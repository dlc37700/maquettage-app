import { ref, get, set, update, remove, push } from 'firebase/database';
import { db } from './firebase';
import { exportProjectAsHtml } from '../utils/exportHtml';

export async function initSessionMeta(code, nickname, className, schoolName, teacherCode, school, projectName) {
  if (!db || !code) return;
  try {
    await set(ref(db, `sessions/${code}/meta`), {
      createdAt: Date.now(),
      createdBy: nickname,
      className: className || '',
      schoolName: schoolName || school || '',
      teacherCode: teacherCode || 'SUPERADMIN',
      school: school || schoolName || '',
      blocked: false,
      projectName: projectName || '',
    });
  } catch (err) {
    console.error('[Admin] initSessionMeta error:', err);
  }
}

export async function getAllSessions(teacherCode = null, includeOrphans = false) {
  if (!db) return [];
  try {
    const snapshot = await get(ref(db, 'sessions/'));
    const val = snapshot.val();
    if (!val || typeof val !== 'object') return [];

    let sessions = Object.entries(val).map(([code, data]) => {
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
        teacherCode: meta.teacherCode || null,
        school: meta.school || '',
        blocked: meta.blocked || false,
        projectName: meta.projectName || '',
        members,
        lastActivity,
        isActive,
      };
    });

    if (teacherCode && teacherCode !== 'SUPERADMIN') {
      if (includeOrphans) {
        sessions = sessions.filter(s => s.teacherCode === teacherCode || !s.teacherCode || s.teacherCode === 'SUPERADMIN');
      } else {
        sessions = sessions.filter(s => s.teacherCode === teacherCode);
      }
    } else if (teacherCode === 'SUPERADMIN') {
      sessions = sessions.filter(s => !s.teacherCode || s.teacherCode === 'SUPERADMIN');
    }
    // null = super-admin global, voit tout

    sessions.sort((a, b) => b.createdAt - a.createdAt);
    return sessions;
  } catch (err) {
    console.error('[Admin] getAllSessions error:', err);
    return [];
  }
}

export async function setSessionSchoolName(code, schoolName) {
  if (!db || !code) return;
  try {
    await update(ref(db, `sessions/${code}/meta`), { schoolName: schoolName || '', school: schoolName || '' });
  } catch (err) {
    console.error('[Admin] setSessionSchoolName error:', err);
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

export async function sendAdminMessage(code, text) {
  if (!db || !code || !text.trim()) return;
  try {
    await push(ref(db, `sessions/${code}/messages`), {
      nickname: '👨‍🏫 Professeur',
      text: text.trim(),
      at: Date.now(),
      isAdmin: true,
    });
  } catch (err) {
    console.error('[Admin] sendAdminMessage error:', err);
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

export function exportMemberAsHtml(member, sessionProjectName) {
  exportProjectAsHtml({
    screens: member.screens,
    projectName: sessionProjectName || member.projectName || `Projet de ${member.nickname}`,
  });
}

export function exportSessionAsHtml(session) {
  const allScreens = session.members.flatMap(m =>
    m.screens.map(s => ({ ...s, name: `${m.nickname} — ${s.name}` }))
  );
  exportProjectAsHtml({
    screens: allScreens,
    projectName: session.projectName || session.code,
  });
}
