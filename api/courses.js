/* ============================================================
   Backend function — /api/courses
   ------------------------------------------------------------
   Shared course library, stored in Supabase. All access goes
   through here so the Supabase secret stays server-side and
   every request is checked against the team password.

     GET    /api/courses?password=...        -> list all courses
     POST   /api/courses  { password, course } -> save / update one
     DELETE /api/courses  { password, id }      -> delete one
   ============================================================ */

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'content-type': 'application/json',
  };
}

function checkConfig(res) {
  if (!process.env.APP_PASSWORD) {
    res.status(500).json({ error: 'Server is missing APP_PASSWORD.' }); return false;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    res.status(500).json({ error: 'Server is missing SUPABASE_URL / SUPABASE_SERVICE_KEY.' }); return false;
  }
  return true;
}

function getPassword(req) {
  if (req.method === 'GET') return (req.query && req.query.password) || '';
  return (req.body && req.body.password) || '';
}

export default async function handler(req, res) {
  if (!checkConfig(res)) return;
  if (getPassword(req) !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong team password.' });
  }

  const base = process.env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/courses';

  try {
    // ---- list ----
    if (req.method === 'GET') {
      const r = await fetch(base + '?select=*&order=updated_at.desc', { headers: supabaseHeaders() });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const rows = await r.json();
      // shape rows back into the library entry format the app expects
      const entries = rows.map(row => ({
        id: row.id,
        title: row.title,
        accent: row.accent,
        savedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        course: row.course,
      }));
      return res.status(200).json({ entries });
    }

    // ---- save / update ----
    if (req.method === 'POST') {
      const course = req.body && req.body.course;
      if (!course || !course.meta) return res.status(400).json({ error: 'No course provided.' });
      const id = (course.meta.libraryId) || ('lib_' + Math.random().toString(36).slice(2, 9));
      course.meta.libraryId = id;
      const row = {
        id,
        title: course.meta.title || 'Untitled course',
        accent: course.meta.accent || 'indigo',
        course,
        updated_at: new Date().toISOString(),
      };
      const r = await fetch(base, {
        method: 'POST',
        headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json({ id });
    }

    // ---- delete ----
    if (req.method === 'DELETE') {
      const id = req.body && req.body.id;
      if (!id) return res.status(400).json({ error: 'No id provided.' });
      const r = await fetch(base + '?id=eq.' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: supabaseHeaders(),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
