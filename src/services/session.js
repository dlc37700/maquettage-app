import { ref, set, get, push, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './firebase';

const CLIENT_ID_KEY = 'maquettage_client_id';
const NICKNAME_KEY = 'maquettage_nickname';

export function getClientId() {
  let id = sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function getClientNickname() {
  return sessionStorage.getItem(NICKNAME_KEY) || '';
}

export function setClientNickname(name) {
  sessionStorage.setItem(NICKNAME_KEY, name.trim());
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateSessionCode() {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export function writeOwnScreens(code, ownScreens, projectName) {
  if (!db || !code) return;
  set(ref(db, `sessions/${code}/clients/${getClientId()}`), {
    updatedAt: Date.now(),
    projectName,
    nickname: getClientNickname() || 'Anonyme',
    screensJson: JSON.stringify(ownScreens),
  }).catch(err => console.error('[Session] Write error:', err));
}

export function sendMessage(code, text) {
  if (!db || !code || !text.trim()) return;
  push(ref(db, `sessions/${code}/messages`), {
    nickname: getClientNickname() || 'Anonyme',
    text: text.trim(),
    at: Date.now(),
  }).catch(err => console.error('[Chat] Send error:', err));
}

export function subscribeToMessages(code, callback) {
  if (!db || !code) return () => {};
  const q = query(ref(db, `sessions/${code}/messages`), orderByChild('at'), limitToLast(100));
  const unsub = onValue(q, (snapshot) => {
    const val = snapshot.val();
    if (!val) { callback([]); return; }
    const msgs = Object.entries(val)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => a.at - b.at);
    callback(msgs);
  });
  return unsub;
}

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
        const nickname = data.nickname || 'Anonyme';
        if (clientId === myId) {
          ownScreens = screens;
        } else {
          remoteScreens.push(...screens.map(s => ({ ...s, _remote: true, _nickname: nickname })));
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
