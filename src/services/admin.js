import { ref, get, set, update, remove } from 'firebase/database';
import { db } from './firebase';

export async function initSessionMeta(code, nickname) {
  if (!db || !code) return;
  try {
    await set(ref(db, `sessions/${code}/meta`), {
      createdAt: Date.now(),
      createdBy: nickname,
      blocked: false,
    });
  } catch (err) {
    console.error('[Admin] initSessionMeta error:', err);
  }
}

export async function getAllSessions() {
  if (!db) return [];
  try {
    const snapshot = await get(ref(db, 'sessions/'));
    const val = snapshot.val();
    if (!val || typeof val !== 'object') return [];

    const now = Date.now();
    const FIFTEEN_MIN = 15 * 60 * 1000;

    const sessions = Object.entries(val).map(([code, data]) => {
      const meta = data.meta || {};
      const clients = data.clients || {};

      const members = Object.entries(clients).map(([clientId, clientData]) => {
        let screens = [];
        try {
          screens = JSON.parse(clientData.screensJson || '[]');
          if (!Array.isArray(screens)) screens = [];
        } catch { screens = []; }
        return {
          clientId,
          nickname: clientData.nickname || 'Anonyme',
          updatedAt: clientData.updatedAt || 0,
          screens,
          projectName: clientData.projectName || null,
        };
      });

      const lastActivity = members.length > 0
        ? Math.max(...members.map(m => m.updatedAt))
        : (meta.createdAt || 0);

      const isActive = lastActivity > 0 && (now - lastActivity) < FIFTEEN_MIN;

      return {
        code,
        createdAt: meta.createdAt || 0,
        createdBy: meta.createdBy || '?',
        blocked: meta.blocked || false,
        members,
        lastActivity,
        isActive,
      };
    });

    sessions.sort((a, b) => b.createdAt - a.createdAt);
    return sessions;
  } catch (err) {
    console.error('[Admin] getAllSessions error:', err);
    return [];
  }
}

export async function setSessionBlocked(code, blocked) {
  if (!db || !code) return;
  try {
    await update(ref(db, `sessions/${code}/meta`), { blocked });
  } catch (err) {
    console.error('[Admin] setSessionBlocked error:', err);
  }
}

export async function removeMember(code, clientId) {
  if (!db || !code || !clientId) return;
  try {
    await remove(ref(db, `sessions/${code}/clients/${clientId}`));
  } catch (err) {
    console.error('[Admin] removeMember error:', err);
  }
}

export function exportSessionAsJson(session) {
  const allScreens = session.members.flatMap(m =>
    m.screens.map(s => ({ ...s, _member: m.nickname }))
  );
  const blob = new Blob([JSON.stringify(allScreens, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${session.code}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMemberAsJson(member) {
  const blob = new Blob([JSON.stringify(member.screens, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${member.nickname}-screens.json`;
  a.click();
  URL.revokeObjectURL(url);
}
