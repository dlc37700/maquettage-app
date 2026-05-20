import { ref, set, get } from 'firebase/database';
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

// Each client writes only their own screens under their own path
export function writeOwnScreens(code, ownScreens, projectName) {
  if (!db || !code) return;
  set(ref(db, `sessions/${code}/clients/${getClientId()}`), {
    updatedAt: Date.now(),
    projectName,
    screensJson: JSON.stringify(ownScreens),
  }).catch(err => console.error('[Session] Write error:', err));
}

// Load all clients and merge into { screens, projectName }
export async function loadSessionOnce(code) {
  if (!db || !code) return null;
  try {
    const snapshot = await get(ref(db, `sessions/${code}/clients`));
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
          ownScreens = screens;
        } else {
          remoteScreens.push(...screens.map(s => ({ ...s, _remote: true })));
        }
        if (!projectName && data.projectName) projectName = data.projectName;
      } catch { /* ignore malformed data */ }
    });

    const allScreens = [...ownScreens, ...remoteScreens];
    if (allScreens.length === 0) return null;
    return { screens: allScreens, projectName: projectName || 'Mon Projet' };
  } catch (err) {
    console.error('[Session] Load error:', err);
    return null;
  }
}
