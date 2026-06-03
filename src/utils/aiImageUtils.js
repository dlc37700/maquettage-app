// BFS flood-fill background removal. Expects a data URL (no CORS issues).
export function removeBg(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.width, h = img.height;
        const offscreen = document.createElement('canvas');
        offscreen.width = w; offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        const edgePts = [];
        const step = Math.max(1, Math.floor(Math.min(w, h) / 20));
        for (let x = 0; x < w; x += step) { edgePts.push([x, 0]); edgePts.push([x, h - 1]); }
        for (let y = step; y < h - step; y += step) { edgePts.push([0, y]); edgePts.push([w - 1, y]); }
        let bgR = 0, bgG = 0, bgB = 0;
        edgePts.forEach(([x, y]) => { const i = (y * w + x) * 4; bgR += d[i]; bgG += d[i+1]; bgB += d[i+2]; });
        bgR = Math.round(bgR / edgePts.length);
        bgG = Math.round(bgG / edgePts.length);
        bgB = Math.round(bgB / edgePts.length);

        const T = 48;
        const dist2 = (pi) => { const dr=d[pi]-bgR, dg=d[pi+1]-bgG, db=d[pi+2]-bgB; return dr*dr+dg*dg+db*db; };
        const isBg = (pi) => dist2(pi) < T*T*3;

        const visited = new Uint8Array(w * h);
        const stack = [];
        for (let x = 0; x < w; x++) { stack.push(x, 0); stack.push(x, h - 1); }
        for (let y = 1; y < h - 1; y++) { stack.push(0, y); stack.push(w - 1, y); }
        let si = 0;
        while (si < stack.length) {
          const x = stack[si++], y = stack[si++];
          const idx = y * w + x;
          if (visited[idx]) continue;
          visited[idx] = 1;
          const pi = idx * 4;
          if (!isBg(pi)) continue;
          d[pi + 3] = 0;
          if (x > 0)   stack.push(x - 1, y);
          if (x < w-1) stack.push(x + 1, y);
          if (y > 0)   stack.push(x, y - 1);
          if (y < h-1) stack.push(x, y + 1);
        }

        const alpha = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3];
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (alpha[idx] === 0) continue;
            const hasTransparentNeighbor =
              alpha[(y-1)*w+x] === 0 || alpha[(y+1)*w+x] === 0 ||
              alpha[y*w+(x-1)] === 0 || alpha[y*w+(x+1)] === 0;
            if (hasTransparentNeighbor) d[idx * 4 + 3] = Math.min(d[idx * 4 + 3], 180);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(offscreen.toDataURL('image/png'));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const DEFAULT_HF_TOKEN = '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';
const HF_TOKEN_KEY = 'maquetapp-hf-token';
export const getHfToken = () => localStorage.getItem(HF_TOKEN_KEY) || DEFAULT_HF_TOKEN;
export const setHfToken = (t) => { if (t) localStorage.setItem(HF_TOKEN_KEY, t.trim()); else localStorage.removeItem(HF_TOKEN_KEY); };

/**
 * Generate an image via Hugging Face Inference API (FLUX.1-schnell).
 * Requires a free HF token: huggingface.co → Settings → Access Tokens.
 * Returns a dataUrl.
 */
export async function generateWithHuggingFace(prompt, token, cancelledRef, timeoutMs = 120000) {
  const model = 'black-forest-labs/FLUX.1-schnell';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (res.status === 503) {
      const info = await res.json().catch(() => ({}));
      const wait = Math.min((info.estimated_time || 20), 40) * 1000;
      await new Promise(r => setTimeout(r, wait));
      if (cancelledRef?.current) throw new Error('cancelled');
      return generateWithHuggingFace(prompt, token, cancelledRef, timeoutMs);
    }
    if (res.status === 401 || res.status === 403) throw new Error('Token HF invalide ou expiré');
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HF ${res.status}: ${txt.substring(0, 80)}`);
    }
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}

// Try to load a cross-origin image into a canvas to get a dataUrl (needs CORS headers).
export function imageUrlToDataUrl(url, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 512;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
  });
}

// Wait for an external image URL to load via <img> tag (no CORS restriction for display).
export function waitForImage(url, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const img = new Image();
    img.onload = () => { clearTimeout(timer); resolve(url); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('load_error')); };
    img.src = url;
  });
}

// Legacy alias
export function loadImageForDisplay(url, timeoutMs) {
  return waitForImage(url, timeoutMs);
}

const HORDE_API = 'https://aihorde.net/api/v2';

/**
 * Generate an image via AI Horde (free, no login, community GPUs).
 * Returns a dataUrl string.
 */
export async function generateWithHorde(prompt, onStatus, cancelledRef, timeoutMs = 300000) {
  const submitRes = await fetch(`${HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '0000000000',
      'Client-Agent': 'maquetapp:1:anonymous'
    },
    body: JSON.stringify({
      prompt,
      params: { width: 512, height: 512, n: 1, steps: 15, sampler_name: 'k_euler' },
      nsfw: false,
      censor_nsfw: true,
      r2: true,         // store in R2 → URL result (more worker support than inline base64)
      shared: true,     // allow sharing → faster queue
      slow_workers: true, // include slow workers for more availability
      trusted_workers: false
    })
  });

  if (!submitRes.ok) {
    const txt = await submitRes.text().catch(() => '');
    throw new Error(`Horde submit ${submitRes.status}: ${txt.substring(0, 80)}`);
  }
  const body = await submitRes.json();
  const id = body.id;
  if (!id) throw new Error(`Horde: no job ID — ${JSON.stringify(body).substring(0, 100)}`);
  console.log('[Horde] job submitted:', id);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (cancelledRef?.current) throw new Error('cancelled');
    await new Promise(r => setTimeout(r, 4000));
    if (cancelledRef?.current) throw new Error('cancelled');

    const checkRes = await fetch(`${HORDE_API}/generate/check/${id}`).catch(() => null);
    if (!checkRes?.ok) continue;
    const status = await checkRes.json().catch(() => null);
    if (!status) continue;
    console.log('[Horde] status:', status);
    onStatus?.(status);

    if (status.faulted) throw new Error('Horde job faulted (no available workers)');
    if (status.done) {
      const resultRes = await fetch(`${HORDE_API}/generate/status/${id}`);
      if (!resultRes.ok) throw new Error(`Horde result ${resultRes.status}`);
      const result = await resultRes.json();
      console.log('[Horde] result:', result);
      const gen = result.generations?.find(g => g.state === 'ok') || result.generations?.[0];
      if (!gen?.img) throw new Error(`Horde: no image — ${JSON.stringify(result).substring(0, 120)}`);
      return gen.img; // URL to R2-stored image
    }
  }
  throw new Error('timeout');
}

/**
 * Generate an image via Craiyon (free, no login).
 * Returns a dataUrl (data:image/jpeg;base64,...).
 */
export async function generateWithCraiyon(prompt, cancelledRef, timeoutMs = 120000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.craiyon.com/v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, token: null, model: 'art', negative_prompt: '' }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Craiyon ${res.status}: ${txt.substring(0, 80)}`);
    }
    const data = await res.json();
    console.log('[Craiyon] response keys:', Object.keys(data));
    if (!data.images?.length) throw new Error('Craiyon: no images in response');
    return `data:image/jpeg;base64,${data.images[0]}`;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}
