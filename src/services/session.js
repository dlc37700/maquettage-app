import { ref, onValue, off, update, get } from 'firebase/database';
import { db } from './firebase';

const CLIENT_ID_KEY = 'maquettage_client_id';

export function getClientId() {
  let id = sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateSessionCode() {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

// Store screen as JSON string to prevent Firebase from mangling arrays
export function writeScreen(code, screen, projectName) {
  if (!db || !code || !screen?.id) return;
  const { _remote, _ownerId, updatedAt, updatedBy, ...clean } = screen;
  const ts = Date.now();
  const updates = {};
  updates[`sessions/${code}/screens/${screen.id}`] = {
    id: screen.id,           // top-level for quick filtering
    updatedAt: ts,
    updatedBy: getClientId(),
    screenJson: JSON.stringify({ ...clean, updatedAt: ts }),
  };
  if (projectName) {
    updates[`sessions/${code}/meta`] = { projectName, updatedAt: ts };
  }
  update(ref(db), updates).catch(err =>
    console.error('[Session] Write error:', err)
  );
}

// Delete a screen + record it in the deleted index
export function removeScreen(code, screenId) {
  if (!db || !code || !screenId) return;
  const updates = {};
  updates[`sessions/${code}/screens/${screenId}`] = null;
  updates[`sessions/${code}/deleted/${screenId}`] = Date.now();
  update(ref(db), updates).catch(err =>
    console.error('[Session] Delete error:', err)
  );
}

function parseScreensFromData(data) {
  if (!data) return [];
  const deleted = data.deleted || {};
  return Object.values(data.screens || {})
    .filter(s => s?.id && s.screenJson && !deleted[s.id])
    .map(s => {
      try { return JSON.parse(s.screenJson); }
      catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
}

// One-time read using get() — more reliable than onValue+onlyOnce
export async function loadSessionOnce(code) {
  if (!db || !code) return null;
  try {
    const snapshot = await get(ref(db, `sessions/${code}`));
    const data = snapshot.val();
    if (!data) return null;
    const screens = parseScreensFromData(data);
    if (screens.length === 0) return null;
    return { screens, projectName: data.meta?.projectName || 'Mon Projet' };
  } catch (err) {
    console.error('[Session] Load error:', err);
    return null;
  }
}

// Subscribe — only fires for OTHER clients' changes
export function subscribeSession(code, onUpdate) {
  if (!db || !code) return () => {};
  const r = ref(db, `sessions/${code}`);
  const myId = getClientId();

  const handler = (snapshot) => {
    try {
      const data = snapshot.val();
      if (!data) return;
      const deleted = data.deleted || {};
      const deletedIds = Object.keys(deleted);

      const remoteScreens = Object.values(data.screens || {})
        .filter(s => s?.id && s.updatedBy !== myId && !deleted[s.id] && s.screenJson)
        .map(s => {
          try { return JSON.parse(s.screenJson); }
          catch { return null; }
        })
        .filter(Boolean);

      onUpdate({ remoteScreens, deletedIds });
    } catch (err) {
      console.error('[Session] Sync error:', err);
    }
  };

  onValue(r, handler, err => console.error('[Session] Firebase error:', err));
  return () => off(r, 'value', handler);
}
