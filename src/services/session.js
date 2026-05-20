import { ref, set, onValue, off } from 'firebase/database';
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

// Each client writes ONLY their own screens under their own path
export function writeClientScreens(code, ownScreens, projectName) {
  if (!db || !code) return;
  set(ref(db, `sessions/${code}/clients/${getClientId()}`), {
    updatedAt: Date.now(),
    projectName,
    screensJson: JSON.stringify(ownScreens),
  });
}

// Parse all clients' data from Firebase into { ownScreens, remoteScreens, projectName }
function parseAllClients(snapshot) {
  const allClients = snapshot.val();
  if (!allClients || typeof allClients !== 'object') return null;

  const myId = getClientId();
  let ownScreens = [];
  let remoteScreens = [];
  let projectName = null;

  Object.entries(allClients).forEach(([clientId, data]) => {
    try {
      const screens = JSON.parse(data.screensJson || '[]');
      if (!Array.isArray(screens)) return;
      if (clientId === myId) {
        ownScreens = screens; // restore own screens on refresh
      } else {
        remoteScreens.push(...screens.map(s => ({ ...s, _remote: true, _ownerId: clientId })));
      }
      if (!projectName && data.projectName) projectName = data.projectName;
    } catch { /* ignore malformed data */ }
  });

  return { ownScreens, remoteScreens, projectName };
}

// Load session once (for join / page refresh)
export function loadSessionOnce(code) {
  if (!db || !code) return Promise.resolve(null);
  return new Promise((resolve) => {
    const r = ref(db, `sessions/${code}/clients`);
    onValue(r, (snapshot) => {
      const parsed = parseAllClients(snapshot);
      if (!parsed) { resolve(null); return; }
      const allScreens = [...parsed.ownScreens, ...parsed.remoteScreens];
      if (allScreens.length === 0) { resolve(null); return; }
      resolve({ screens: allScreens, projectName: parsed.projectName });
    }, (err) => {
      console.error('[Session] Read error:', err);
      resolve(null);
    }, { onlyOnce: true });
  });
}

// Subscribe to remote changes — only fires when OTHER clients change
export function subscribeSession(code, onRemoteScreens) {
  if (!db || !code) return () => {};
  const r = ref(db, `sessions/${code}/clients`);
  const handler = (snapshot) => {
    try {
      const parsed = parseAllClients(snapshot);
      if (!parsed) return;
      onRemoteScreens(parsed.remoteScreens);
    } catch (err) {
      console.error('[Session] Sync error:', err);
    }
  };
  onValue(r, handler, (err) => console.error('[Session] Firebase error:', err));
  return () => off(r, 'value', handler);
}
