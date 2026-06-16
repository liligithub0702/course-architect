/* ============================================================
   Backend function — POST /api/auth
   Checks the shared team password. Returns 200 if correct,
   401 if not. Used by the site login gate.
   ============================================================ */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { password } = req.body || {};
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: 'Server is missing APP_PASSWORD.' });
  }
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  return res.status(200).json({ ok: true });
}
