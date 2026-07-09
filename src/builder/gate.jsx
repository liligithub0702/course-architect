/* ============================================================
   Site login gate
   ------------------------------------------------------------
   Wraps the whole app. Nothing renders until the team password
   is verified by the backend (/api/auth). The password is saved
   in the browser and reused by the AI importer, so users only
   enter it once.
   ============================================================ */
const GATE_KEY = 'sutherland_team_password_v1'; // same key the importer reads

async function verifyPassword(password) {
  try {
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}

function Gate({ children }) {
  const [authed, setAuthed]     = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw, setPw]             = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const [shaking, setShaking]   = useState(false);

  // on load: if a password is saved, verify it silently
  useEffect(() => {
    const saved = localStorage.getItem(GATE_KEY);
    if (!saved) { setChecking(false); return; }
    verifyPassword(saved).then(ok => {
      if (ok) setAuthed(true);
      else localStorage.removeItem(GATE_KEY);
      setChecking(false);
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    const value = pw.trim();
    if (!value) return;
    setBusy(true); setErr('');
    const ok = await verifyPassword(value);
    setBusy(false);
    if (ok) {
      localStorage.setItem(GATE_KEY, value);
      setAuthed(true);
    } else {
      setErr('Incorrect password.');
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
    }
  }

  if (checking) {
    return <div className="gate"><div className="gate__card gate__card--loading">Loading…</div></div>;
  }
  if (authed) return children;

  return (
    <div className="gate">
      <form className={'gate__card' + (shaking ? ' is-shaking' : '')} onSubmit={submit}>
        <div className="gate__logo-row">
          <div className="gate__logo-chip" aria-hidden="true">
            <div className="gate__logo-dot"></div>
          </div>
          <span className="gate__mark">Design Studio</span>
        </div>
        <h1 className="gate__title">Team access</h1>
        <p className="gate__sub">Enter the team password to continue.</p>
        <div className="gate__input-wrap">
          <span className="gate__input-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            className={'gate__input' + (err ? ' gate__input--error' : '')}
            type="password"
            autoFocus
            placeholder="Team password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
          />
        </div>
        {err && <p className="gate__err">{err}</p>}
        <button className="gate__btn" type="submit" disabled={busy || !pw.trim()}>
          {busy
            ? <React.Fragment><span className="gate__spinner"></span>Checking…</React.Fragment>
            : 'Enter'}
        </button>
        <p className="gate__hint">Ask your team lead for the password.</p>
      </form>
    </div>
  );
}

Object.assign(window, { Gate });

export {}; // marks this file as an ES module for Vite
