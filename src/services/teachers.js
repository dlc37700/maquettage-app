import { ref, get, push, set, update, remove } from 'firebase/database';
import { db } from './firebase';

function generateSchoolCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ENS-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createTeacher({ login, password, displayName }) {
  if (!db) return { error: 'Firebase non configuré' };
  const snap = await get(ref(db, 'teachers'));
  const val = snap.val() || {};
  const existing = Object.values(val).find(t => t.login === login.trim().toLowerCase());
  if (existing) return { error: 'Ce login est déjà utilisé' };
  let schoolCode;
  do { schoolCode = generateSchoolCode(); }
  while (Object.values(val).find(t => t.schoolCode === schoolCode));
  const newRef = push(ref(db, 'teachers'));
  await set(newRef, {
    login: login.trim().toLowerCase(),
    password,
    displayName: displayName.trim(),
    schoolCode,
    schools: [],
    createdAt: Date.now(),
  });
  return { id: newRef.key, schoolCode };
}

export async function loginTeacher(login, password) {
  if (!db) return null;
  const snap = await get(ref(db, 'teachers'));
  const val = snap.val() || {};
  const entry = Object.entries(val).find(([, t]) =>
    t.login === login.trim().toLowerCase() && t.password === password
  );
  if (!entry) return null;
  return { id: entry[0], ...entry[1] };
}

export async function getTeacherBySchoolCode(schoolCode) {
  if (!db || !schoolCode) return null;
  const snap = await get(ref(db, 'teachers'));
  const val = snap.val() || {};
  const entry = Object.entries(val).find(([, t]) =>
    t.schoolCode === schoolCode.trim().toUpperCase()
  );
  if (!entry) return null;
  return { id: entry[0], ...entry[1] };
}

export async function updateTeacherSchools(teacherId, schools) {
  if (!db || !teacherId) return;
  await update(ref(db, `teachers/${teacherId}`), { schools });
}

export async function updateTeacherPassword(teacherId, newPassword) {
  if (!db || !teacherId) return;
  await update(ref(db, `teachers/${teacherId}`), { password: newPassword });
}

export async function getAllTeachers() {
  if (!db) return [];
  const snap = await get(ref(db, 'teachers'));
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteTeacher(teacherId) {
  if (!db || !teacherId) return;
  await remove(ref(db, `teachers/${teacherId}`));
}
