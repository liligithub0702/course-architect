/* ============================================================
   Cloud library — talks to /api/courses (Supabase behind it)
   ------------------------------------------------------------
   Replaces the per-browser localStorage library with a shared
   one. The team password (already stored by the login gate) is
   sent with every request.
   ============================================================ */

function teamPassword() {
  return localStorage.getItem('sutherland_team_password_v1') || '';
}

async function cloudListCourses() {
  const r = await fetch('/api/courses?password=' + encodeURIComponent(teamPassword()));
  if (!r.ok) {
    let msg = 'Could not load courses (' + r.status + ')';
    try { const e = await r.json(); msg = e.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  const data = await r.json();
  return data.entries || [];
}

async function cloudSaveCourse(course) {
  const r = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: teamPassword(), course }),
  });
  if (!r.ok) {
    let msg = 'Could not save (' + r.status + ')';
    try { const e = await r.json(); msg = e.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  const data = await r.json();
  return data.id;
}

async function cloudDeleteCourse(id) {
  const r = await fetch('/api/courses', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: teamPassword(), id }),
  });
  if (!r.ok) {
    let msg = 'Could not delete (' + r.status + ')';
    try { const e = await r.json(); msg = e.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return true;
}

Object.assign(window, { cloudListCourses, cloudSaveCourse, cloudDeleteCourse });

export {}; // marks this file as an ES module for Vite
