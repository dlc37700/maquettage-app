import { ref, onValue, off, update } from 'firebase/database';
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

// Write a single screen + update meta (one atomic multi-path update)
export function writeScreen(code, screen, projectName) {
  if (!db || !code || !screen?.id) return;
  const { _remote, _ownerId, ...clean } = screen;
  const updates = {};
  updates[`sessions/${code}/screens/${screen.id}`] = {
    ...clean,
    updatedAt: Date.now(),
    updatedBy: getClientId(),
  };
  if (projectName) {
    updates[`sessions/${code}/meta`] = { projectName, updatedAt: Date.now() };
  }
  update(ref(db), updates);
}

// Remove a screen from the session and mark it as deleted
export function removeScreen(code, screenId) {
  if (!db || !code || !screenId) return;
  const updates = {};
  updates[`sessions/${code}/screens/${screenId}`] = null; // deletes the node
  updates[`sessions/${code}/deleted/${screenId}`] = Date.now();
  update(ref(db), updates);
}

function parseSession(snapshot) {
  const data = snapshot.val();
  if (!data) return null;
  const deleted = data.deleted || {};
  const screens = Object.values(data.screens || {})
    .filter(s => s?.id && !deleted[s.id])
    .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
  return { screens, projectName: data.meta?.projectName || 'Mon Projet' };
}

export function loadSessionOnce(code) {
  if (!db || !code) return Promise.resolve(null);
  return new Promise((resolve) => {
    const r = ref(db, `sessions/${code}`);
    onValue(r, (snapshot) => {
      const parsed = parseSession(snapshot);
      resolve(parsed && parsed.screens.length > 0 ? parsed : null);
    }, (err) => {
      console.error('[Session] Load error:', err);
      resolve(null);
    }, { onlyOnce: true });
  });
}

// Subscribe — callback receives { remoteScreens, deletedIds }
// remoteScreens = screens written by OTHER clients only
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

      // Only propagate screens from other clients
      const remoteScreens = Object.values(data.screens || {})
        .filter(s => s?.id && s.updatedBy !== myId && !deleted[s.id]);

      onUpdate({ remoteScreens, deletedIds });
    } catch (err) {
      console.error('[Session] Sync error:', err);
    }
  };

  onValue(r, handler, (err) => console.error('[Session] Firebase error:', err));
  return () => off(r, 'value', handler);
}
