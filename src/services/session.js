import { ref, set, get, push, onValue, query, orderByChild, limitToLast, onDisconnect, remove } from 'firebase/database';
import { db } from './firebase';

const CLIENT_ID_KEY = 'maquettage_client_id';
const NICKNAME_KEY = 'maquettage_nickname';
const PIN_KEY = 'maquettage_pin';

export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function getClientNickname() {
  return localStorage.getItem(NICKNAME_KEY) || '';
}

export function setClientNickname(name) {
  localStorage.setItem(NICKNAME_KEY, name.trim());
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateSessionCode() {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export function getOrCreateClientPin() {
  let pin = localStorage.getItem(PIN_KEY);
  if (!pin) {
    pin = String(Math.floor(1000 + Math.random() * 9000));
    localStorage.setItem(PIN_KEY, pin);
  }
  return pin;
}

export async function saveMemberRecord(code, clientId, nickname) {
  if (!db || !code) return;
  const pin = getOrCreateClientPin();
  try {
    await set(ref(db, `sessions/${code}/members/${clientId}`), { nickname, pin, joinedAt: Date.now() });
  } catch (err) {
    console.error('[Session] saveMemberRecord error:', err);
  }
}

export async function prepareJoin(code) {
  if (!db || !code) return { error: 'offline' };
  try {
    const [metaSnap, clientsSnap, membersSnap] = await Promise.all([
      get(ref(db, `sessions/${code}/meta`)),
      get(ref(db, `sessions/${code}/clients`)),
      get(ref(db, `sessions/${code}/members`)),
    ]);
    const meta = metaSnap.val();
    if (!meta) return { error: 'not_found' };
    if (meta.blocked) return { error: 'blocked' };
    const clients = clientsSnap.val() || {};
    const memberPins = membersSnap.val() || {};
    const myId = getClientId();
    if (clients[myId]) {
      return { alreadyMember: true, myNickname: clients[myId].nickname || 'Anonyme' };
    }
    const members = Object.entries(clients).map(([cid, data]) => ({
      clientId: cid,
      nickname: data.nickname || 'Anonyme',
      hasPin: !!(memberPins[cid]?.pin),
    }));
    return { members };
  } catch (err) {
    console.error('[Session] prepareJoin error:', err);
    return { error: 'network' };
  }
}

export async function verifyAndRestoreMember(code, clientId, pin) {
  if (!db || !code) return false;
  try {
    const snap = await get(ref(db, `sessions/${code}/members/${clientId}/pin`));
    const storedPin = snap.val();
    if (storedPin && storedPin === pin.trim()) {
      localStorage.setItem(CLIENT_ID_KEY, clientId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function claimMemberIdentity(code, clientId, nickname) {
  // Restore this clientId and assign a brand-new PIN (old sessions have no PIN)
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  localStorage.setItem(PIN_KEY, pin);
  try {
    await set(ref(db, `sessions/${code}/members/${clientId}`), { nickname, pin, joinedAt: Date.now() });
  } catch (err) {
    console.error('[Session] claimMemberIdentity error:', err);
  }
  return pin;
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

export function subscribeToSession(code, onRemoteScreens) {
  if (!db || !code) return () => {};
  const unsub = onValue(ref(db, `sessions/${code}/clients`), (snapshot) => {
    const allClients = snapshot.val();
    if (!allClients || typeof allClients !== 'object') { onRemoteScreens([]); return; }
    const myId = getClientId(); // always reads current localStorage value
    const remoteScreens = [];
    Object.entries(allClients).forEach(([clientId, data]) => {
      if (clientId === myId) return;
      try {
        const screens = JSON.parse(data.screensJson || '[]');
        if (!Array.isArray(screens)) return;
        const nickname = data.nickname || 'Anonyme';
        remoteScreens.push(...screens.map(s => ({ ...s, _remote: true, _nickname: nickname, _clientId: clientId })));
      } catch { }
    });
    onRemoteScreens(remoteScreens);
  });
  return unsub;
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
    // Check if session is blocked
    const metaSnap = await get(ref(db, `sessions/${code}/meta`));
    const meta = metaSnap.val();
    if (meta?.blocked) return { blocked: true };

    const snapshot = await get(ref(db, `sessions/${code}/clients`));
    const allClients = snapshot.val();
    if (!allClients || typeof allClients !== 'object') return null;

    let myId = getClientId();

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
          remoteScreens.push(...screens.map(s => ({ ...s, _remote: true, _nickname: nickname, _clientId: clientId })));
        }
        if (!projectName && data.projectName) projectName = data.projectName;
      } catch { /* ignore malformed data */ }
    });

    const allScreens = [...ownScreens, ...remoteScreens];
    if (allScreens.length === 0) return null;
    return { screens: allScreens, projectName: projectName || 'Mon Projet', creatorId: meta?.createdBy || null };
  } catch (err) {
    console.error('[Session] Load error:', err);
    return null;
  }
}

export function registerPresence(code) {
  if (!db || !code) return () => {};
  const presenceRef = ref(db, `sessions/${code}/presence/${getClientId()}`);
  set(presenceRef, { nickname: getClientNickname() || 'Anonyme', connectedAt: Date.now() })
    .catch(err => console.error('[Presence] Write error:', err));
  onDisconnect(presenceRef).remove();
  return () => {
    remove(presenceRef).catch(() => {});
  };
}

export function sendBgRequest(code, targetClientId, { fromNickname, backgroundColor, backgroundGradient, backgroundImage, screenIds }) {
  if (!db || !code || !targetClientId) return;
  set(ref(db, `sessions/${code}/bgRequests/${targetClientId}`), {
    fromNickname,
    backgroundColor: backgroundColor || null,
    backgroundGradient: backgroundGradient || null,
    backgroundImage: backgroundImage || null,
    screenIds,
    requestedAt: Date.now(),
  }).catch(() => {});
}

export function listenBgRequests(code, myClientId, callback) {
  if (!db || !code || !myClientId) return () => {};
  const unsub = onValue(ref(db, `sessions/${code}/bgRequests/${myClientId}`), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return unsub;
}

export function clearBgRequest(code, myClientId) {
  if (!db || !code || !myClientId) return;
  remove(ref(db, `sessions/${code}/bgRequests/${myClientId}`)).catch(() => {});
}

export function sendScreenTransfer(code, targetClientId, screen, fromNickname) {
  if (!db || !code || !targetClientId) return;
  const cleanScreen = JSON.parse(JSON.stringify(screen));
  delete cleanScreen._remote;
  delete cleanScreen._nickname;
  delete cleanScreen._clientId;
  const r = push(ref(db, `sessions/${code}/transfers/${targetClientId}`));
  set(r, {
    screen: cleanScreen,
    fromClientId: getClientId(),
    fromNickname: fromNickname || 'Anonyme',
    sentAt: Date.now(),
  }).catch(err => console.error('[Transfer] Send error:', err));
}

export function listenTransfers(code, myClientId, callback) {
  if (!db || !code || !myClientId) return () => {};
  return onValue(ref(db, `sessions/${code}/transfers/${myClientId}`), (snap) => {
    const val = snap.val();
    if (!val) { callback([]); return; }
    callback(Object.entries(val).map(([id, t]) => ({ id, ...t })));
  });
}

export function clearTransfer(code, myClientId, transferId) {
  if (!db || !code || !myClientId || !transferId) return;
  remove(ref(db, `sessions/${code}/transfers/${myClientId}/${transferId}`)).catch(() => {});
}

export function listenSessionMembers(code, myClientId, callback) {
  if (!db || !code) return () => {};
  return onValue(ref(db, `sessions/${code}/clients`), (snap) => {
    const val = snap.val() || {};
    callback(
      Object.entries(val)
        .filter(([id]) => id !== myClientId)
        .map(([id, data]) => ({ clientId: id, nickname: data.nickname || 'Anonyme' }))
    );
  });
}
