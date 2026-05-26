import { ref, get, set, update, remove } from 'firebase/database';
import { db } from './firebase';

export async function initSessionMeta(code, nickname, className, schoolName) {
  if (!db || !code) return;
  try {
    await set(ref(db, `sessions/${code}/meta`), {
      createdAt: Date.now(),
      createdBy: nickname,
      className: className || '',
      schoolName: schoolName || '',
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

    const sessions = Object.entries(val).map(([code, data]) => {
      const meta = data.meta || {};
      const clients = data.clients || {};
      const presence = data.presence || {};
      const membersPins = data.members || {};

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
          online: !!presence[clientId],
          screens,
          projectName: clientData.projectName || null,
          pin: membersPins[clientId]?.pin || null,
        };
      });

      const lastActivity = members.length > 0
        ? Math.max(...members.map(m => m.updatedAt))
        : (meta.createdAt || 0);

      // A session is active only if at least one member's browser is still open
      const isActive = Object.keys(presence).length > 0;

      return {
        code,
        createdAt: meta.createdAt || 0,
        createdBy: meta.createdBy || '?',
        className: meta.className || '',
        schoolName: meta.schoolName || '',
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

export async function deleteSession(code) {
  if (!db || !code) return;
  try {
    await remove(ref(db, `sessions/${code}`));
  } catch (err) {
    console.error('[Admin] deleteSession error:', err);
  }
}

export async function getSessionMessages(code) {
  if (!db || !code) return [];
  try {
    const snap = await get(ref(db, `sessions/${code}/messages`));
    const val = snap.val();
    if (!val) return [];
    return Object.entries(val)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => a.at - b.at);
  } catch (err) {
    console.error('[Admin] getSessionMessages error:', err);
    return [];
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
