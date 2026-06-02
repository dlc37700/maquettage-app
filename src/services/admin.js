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

export function exportClassPinsAsHtml(sessions, className, schoolName) {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const groups = sessions.map(s => {
    const membersHtml = s.members.length === 0
      ? `<p style="color:#9CA3AF;font-style:italic;font-size:13px;margin:6px 0">Aucun membre</p>`
      : s.members.map(m => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:14px;font-weight:600;color:#1F2937">👤 ${m.nickname}</span>
          ${m.pin
            ? `<span style="font-family:monospace;font-size:20px;font-weight:900;color:#6C63FF;background:#EDE9FE;padding:3px 10px;border-radius:8px;letter-spacing:3px">${m.pin}</span>`
            : `<span style="font-size:12px;color:#9CA3AF;font-style:italic">pas de PIN</span>`
          }
        </div>`).join('');
    return `
      <div style="break-inside:avoid;border:2px solid #DDD6FE;border-radius:14px;padding:18px 20px;background:white;box-shadow:0 2px 8px rgba(108,99,255,0.08)">
        <div style="font-size:17px;font-weight:900;color:#4C1D95;margin-bottom:2px">${s.projectName || '(sans nom de projet)'}</div>
        <div style="font-family:monospace;font-size:22px;font-weight:900;color:#6C63FF;letter-spacing:5px;margin-bottom:12px;background:#F5F3FF;display:inline-block;padding:4px 12px;border-radius:8px">${s.code}</div>
        <div>${membersHtml}</div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Codes PIN — ${className} — ${schoolName || ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #F9FAFB; padding: 28px 32px; color: #1F2937; }
  @media print {
    body { background: white; padding: 16px; }
    .no-print { display: none; }
  }
  h1 { font-size: 26px; color: #4C1D95; margin-bottom: 4px; }
  .subtitle { font-size: 14px; color: #6B7280; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
</style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="float:right;background:#6C63FF;color:white;border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:12px">🖨️ Imprimer</button>
  <h1>📚 ${className}</h1>
  <p class="subtitle">🏫 ${schoolName || 'Établissement non renseigné'} &nbsp;·&nbsp; ${sessions.length} groupe${sessions.length > 1 ? 's' : ''} &nbsp;·&nbsp; ${date}</p>
  <div class="grid">${groups}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pins-${className.replace(/\s+/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
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
