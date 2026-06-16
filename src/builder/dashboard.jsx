/* ============================================================
   Dashboard — the course library landing screen
   ------------------------------------------------------------
   Shows every saved course as a card. Open one to edit it,
   start a new one, or import from an outline. Backed by the
   library storage in library.jsx (local for now; shared
   database comes next).
   ============================================================ */

function Dashboard({ onOpen, onNew, onImport }) {
  const [lib, setLib] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function refresh() {
    setLoading(true); setError('');
    cloudListCourses()
      .then(rows => { setLib(rows); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }
  useEffect(() => { refresh(); }, []);

  function del(entry) {
    const name = (entry.title || 'this course').replace(/<[^>]+>/g, '');
    if (!confirm('Delete “' + name + '” from the shared library? This cannot be undone.')) return;
    cloudDeleteCourse(entry.id).then(refresh).catch(e => setError(e.message));
  }

  function fmtDate(ms) {
    try { return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function lessonCount(c) { return ((c && c.lessons) || []).filter(l => l.kind === 'lesson').length; }
  function accentColor(key) { return (ACCENTS.find(a => a.key === key) || {}).color || '#2E79BB'; }

  return (
    <div className="dash">
      <div className="dash__inner">

        <header className="dash__head">
          <div>
            <div className="dash__eyebrow">Your workspace</div>
            <h1 className="dash__title">Course Library</h1>
            <p className="dash__sub">Open a course to edit it, or start a new one.</p>
          </div>
          <div className="dash__actions">
            <button className="btn-ghost" onClick={onImport}><Icon name="zap" size={15} /> Import from outline</button>
            <button className="dash__new" onClick={onNew}><Icon name="plus" size={16} /> New course</button>
          </div>
        </header>

        {loading && <p className="dash__empty">Loading the shared library…</p>}
        {error && <p className="dash__error">{error}</p>}

        <div className="dash__grid">
          {!loading && lib.map(entry => {
            const color = accentColor(entry.accent);
            return (
              <div className="dcard" key={entry.id}>
                <span className="dcard__stripe" style={{ background: color }}></span>
                <div className="dcard__body">
                  <div className="dcard__top">
                    <span className="dcard__pill" style={{ color, background: 'color-mix(in srgb, ' + color + ' 12%, #fff)' }}>Course</span>
                    <button className="dcard__del" onClick={() => del(entry)} aria-label="Delete"><Icon name="trash" size={15} /></button>
                  </div>
                  <h3 className="dcard__title" dangerouslySetInnerHTML={{ __html: entry.title || 'Untitled course' }}></h3>
                  <div className="dcard__meta">
                    <span><Icon name="book" size={13} /> {lessonCount(entry.course)} lessons</span>
                    <span className="dcard__dot">·</span>
                    <span>Saved {fmtDate(entry.savedAt)}</span>
                  </div>
                  <button className="dcard__open" onClick={() => onOpen(entry)}>
                    Open <Icon name="arrowRight" size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          <button className="dcard dcard--new" onClick={onNew}>
            <span className="dcard--new__icon"><Icon name="plus" size={24} /></span>
            <span className="dcard--new__label">New course</span>
            <span className="dcard--new__sub">Start blank or import an outline</span>
          </button>
        </div>

        {!loading && lib.length === 0 && (
          <p className="dash__empty">No saved courses yet. Create one above — it’ll appear here for the whole team.</p>
        )}

      </div>
    </div>
  );
}

window.Dashboard = Dashboard;

export {}; // marks this file as an ES module for Vite
