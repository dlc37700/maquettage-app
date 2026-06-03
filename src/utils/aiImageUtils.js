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

// Build a Pollinations.ai image URL with the given prompt and seed.
export function pollinationsUrl(prompt, seed) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
}

// Fetch an image from a URL and return a dataUrl.
// Uses fetch() which lets us inspect the response (status, content-type).
// Falls back to <img> blob loading if CORS blocks the response body.
export async function fetchImageAsDataUrl(url, timeoutMs = 90000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.substring(0, 120)}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      const body = await res.text().catch(() => '');
      throw new Error(`Non-image response (${ct}): ${body.substring(0, 120)}`);
    }
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
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

// Try to load a cross-origin image into a canvas to get a dataUrl.
// Requires the server to send Access-Control-Allow-Origin headers.
// Returns dataUrl on success, null on CORS/canvas error.
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null); // canvas tainted (no CORS headers on server)
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
  });
}

// Legacy alias kept for DrawingRenderer compatibility
export function loadImageForDisplay(url, timeoutMs) {
  return waitForImage(url, timeoutMs);
}
