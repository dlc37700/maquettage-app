import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

const CLIENT_ID_KEY = 'maquettage_client_id';

function getClientId() {
  let id = sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// 6-char code using unambiguous characters
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateSessionCode() {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export function writeSession(code, project) {
  if (!db || !code) return;
  // Store as JSON string to avoid Firebase array-to-object conversion
  set(ref(db, `sessions/${code}`), {
    clientId: getClientId(),
    updatedAt: Date.now(),
    projectJson: JSON.stringify(project),
  });
}

function parseProject(data) {
  if (!data?.projectJson) return null;
  try {
    const project = JSON.parse(data.projectJson);
    if (!project || !Array.isArray(project.screens)) return null;
    return project;
  } catch {
    return null;
  }
}

export function loadSessionOnce(code) {
  if (!db || !code) return Promise.resolve(null);
  return new Promise((resolve) => {
    const r = ref(db, `sessions/${code}`);
    onValue(r, (snapshot) => {
      resolve(parseProject(snapshot.val()));
    }, (err) => {
      console.error('[Session] Erreur lecture :', err);
      resolve(null);
    }, { onlyOnce: true });
  });
}

export function subscribeSession(code, onRemoteUpdate) {
  if (!db || !code) return () => {};
  const r = ref(db, `sessions/${code}`);
  const handler = (snapshot) => {
    try {
      const data = snapshot.val();
      if (!data) return;
      if (data.clientId === getClientId()) return; // ignore own writes
      const project = parseProject(data);
      if (project) onRemoteUpdate(project);
    } catch (err) {
      console.error('[Session] Erreur sync :', err);
    }
  };
  onValue(r, handler, (err) => console.error('[Session] Firebase error :', err));
  return () => off(r, 'value', handler);
}
