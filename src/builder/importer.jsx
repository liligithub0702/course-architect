/* ============================================================
   Course Builder — AI-powered Outline Importer
   Sends the outline to Claude and gets back a complete course.
   ============================================================ */

const PASSWORD_STORE = 'sutherland_team_password_v1';

/* ---- freshen all IDs to avoid collisions with existing course data ---- */
function freshIds(course) {
  const map = {};
  function next(old) {
    if (!map[old]) map[old] = uid(old[0] || 'x');
    return map[old];
  }
  return {
    ...course,
    lessons: (course.lessons || []).map(l => ({
      ...l,
      id: next(l.id),
      blocks: (l.blocks || []).map(b => {
        const nb = { ...b, id: next(b.id) };
        if (b.cards)   nb.cards   = b.cards.map(c => ({ ...c, id: next(c.id) }));
        if (b.items)   nb.items   = b.items.map(i => ({ ...i, id: next(i.id) }));
        if (b.steps)   nb.steps   = b.steps.map(s => ({ ...s, id: next(s.id) }));
        if (b.terms)   nb.terms   = b.terms.map(t => ({ ...t, id: next(t.id) }));
        if (b.rows)    nb.rows    = b.rows.map(r => ({ ...r, id: next(r.id) }));
        if (b.options) {
          const oldCorrect = b.correct;
          nb.options = b.options.map(o => ({ ...o, id: next(o.id) }));
          nb.correct = oldCorrect ? next(oldCorrect) : null;
        }
        return nb;
      }),
    })),
  };
}

/* ---- repair truncated JSON (last-resort fallback) ---- */
function repairJson(str) {
  // Try as-is first
  try { return JSON.parse(str); } catch (_) {}

  // Walk the string tracking open brackets so we can close them
  let inStr = false, esc = false;
  const stack = [];
  let lastSafePos = 0; // last position after a complete top-level value in lessons[]

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') { stack.push(ch === '{' ? '}' : ']'); }
    else if (ch === '}' || ch === ']') {
      stack.pop();
      // After closing a lesson object (depth 2: root obj + lessons array), record position
      if (stack.length === 2) lastSafePos = i + 1;
    }
  }

  if (!lastSafePos) throw new Error('JSON is too malformed to repair automatically.');

  // Truncate to last complete lesson, close lessons array and root object
  let fixed = str.slice(0, lastSafePos).trimEnd();
  if (fixed.endsWith(',')) fixed = fixed.slice(0, -1);
  fixed += ']}';

  return JSON.parse(fixed);
}

/* ---- call our backend (which holds the key + checks the password) ---- */
async function convertWithAI(text, password, onStatus) {
  onStatus('Sending outline to Claude…');

  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, password }),
  });

  if (!resp.ok) {
    let msg = 'Error ' + resp.status;
    try { const e = await resp.json(); msg = e.error || msg; } catch (_) {}
    if (resp.status === 401) msg = 'Wrong team password — check with your team lead.';
    throw new Error(msg);
  }

  onStatus('Parsing course structure…');
  const data = await resp.json();
  const raw = data.raw || '';

  // Claude may wrap JSON in ```json ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const bare   = raw.match(/(\{[\s\S]*\})/s);
  const jsonStr = fenced ? fenced[1].trim() : bare ? bare[1].trim() : raw.trim();

  if (!jsonStr) throw new Error('Claude did not return JSON. Try uploading a shorter or simpler outline.');

  let parsed;
  try {
    parsed = repairJson(jsonStr);
  } catch (e) {
    throw new Error('Could not parse the response as JSON: ' + e.message);
  }

  if (!parsed.lessons || !Array.isArray(parsed.lessons)) {
    throw new Error('Response JSON is missing a "lessons" array.');
  }

  return freshIds(parsed);
}

/* ---- plain-text extract from .docx via mammoth ---- */
async function extractText(file) {
  if (file.name.endsWith('.docx')) {
    if (!window.mammoth) throw new Error('mammoth.js not loaded — check your internet connection.');
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  return file.text();
}

/* ============================================================
   ImportModal
   ============================================================ */
function ImportModal({ onImport, onClose }) {
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem(PASSWORD_STORE) || '');
  const [keyDraft, setKeyDraft]   = useState(() => localStorage.getItem(PASSWORD_STORE) || '');
  const [keySaved, setKeySaved]   = useState(() => !!localStorage.getItem(PASSWORD_STORE));
  const [tab, setTab]             = useState('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName]   = useState('');
  const [fileText, setFileText]   = useState('');
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [preview, setPreview]     = useState(null);
  const [err, setErr]             = useState('');
  const fileRef = useRef(null);

  function saveKey() {
    const k = keyDraft.trim();
    localStorage.setItem(PASSWORD_STORE, k);
    setApiKey(k);
    setKeySaved(true);
  }

  async function run(text, label) {
    if (!apiKey) { setErr('Enter the team password above first.'); return; }
    if (!text || !text.trim()) { setErr('No content to convert.'); return; }
    setErr(''); setPreview(null); setLoading(true);
    try {
      const course = await convertWithAI(text, apiKey, setStatus);
      setPreview(course);
    } catch (e) {
      setErr(e.message);
    }
    setStatus('');
    setLoading(false);
  }

  async function handleFile(file) {
    if (!file) return;
    setErr(''); setPreview(null);
    try {
      const text = await extractText(file);
      setFileText(text);
      setFileName(file.name);
    } catch (e) {
      setErr(e.message);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const stats = preview ? {
    sections: preview.lessons.filter(l => l.kind === 'section').length,
    lessons:  preview.lessons.filter(l => l.kind === 'lesson').length,
  } : null;

  const PASTE_PH = `Paste your course outline here.

Claude will read the full content and create a complete
course — lessons, flip cards, steppers, quizzes, glossaries,
and all — populated with your actual content.

Supported formats:
• Any plain text outline
• Structured Word-extracted text
• Markdown (# ## ### headings)`;

  const totalBlocks = preview
    ? preview.lessons.filter(l => l.kind === 'lesson').reduce((n, l) => n + (l.blocks || []).length, 0)
    : 0;

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="picker imp-modal imp-modal--wide" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="picker__head">
          <h3 style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Icon name="upload" size={17} /> Import from outline
          </h3>
          <button className="picker__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        <div className="picker__body imp-grid">

          {/* ============ LEFT: input ============ */}
          <div className="imp-col imp-col--input">

            {/* API key section */}
            <div className="imp-key-section">
              <div className="imp-key-label">
                <Icon name="zap" size={13} />
                <span>Team access password — unlocks AI course generation</span>
              </div>
              <div className="imp-key-row">
                <input
                  className={'imp-key-input' + (keySaved ? ' saved' : '')}
                  type="password"
                  placeholder="Enter team password…"
                  value={keyDraft}
                  onChange={e => { setKeyDraft(e.target.value); setKeySaved(false); }}
                  onKeyDown={e => e.key === 'Enter' && saveKey()}
                />
                <button className={'imp-key-save' + (keySaved ? ' done' : '')} onClick={saveKey}>
                  {keySaved ? <><Icon name="check" size={13} /> Saved</> : 'Save'}
                </button>
              </div>
              {!keySaved && (
                <p className="imp-key-hint">
                  Ask your team lead for the password · Stored in your browser only.
                </p>
              )}
            </div>

            {/* file / paste tabs */}
            <div className="imp-tabs">
              <button className={'imp-tab' + (tab === 'upload' ? ' on' : '')}
                onClick={() => { setTab('upload'); setErr(''); }}>
                <Icon name="upload" size={14} /> Upload file
              </button>
              <button className={'imp-tab' + (tab === 'paste' ? ' on' : '')}
                onClick={() => { setTab('paste'); setErr(''); }}>
                <Icon name="text" size={14} /> Paste text
              </button>
            </div>

            {tab === 'upload' && (
              <div>
                <div className={'imp-drop' + (fileName ? ' imp-drop--ready' : '')}
                  onDragOver={e => e.preventDefault()} onDrop={onDrop}
                  onClick={() => !fileName && fileRef.current && fileRef.current.click()}>
                  {fileName ? (
                    <>
                      <Icon name="file" size={28} />
                      <p><strong>{fileName}</strong></p>
                      <p className="imp-drop__sub">Ready to convert</p>
                    </>
                  ) : (
                    <>
                      <Icon name="upload" size={28} />
                      <p><strong>Drop your outline here</strong> or click to browse</p>
                      <p className="imp-drop__sub">.docx · .txt · .md</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".docx,.txt,.md" hidden
                    onChange={e => handleFile(e.target.files && e.target.files[0])} />
                </div>
                {fileName && (
                  <button className="btn-ghost imp-remove"
                    onClick={() => { setFileName(''); setFileText(''); }}>
                    <Icon name="trash" size={14} /> Remove file
                  </button>
                )}
              </div>
            )}

            {tab === 'paste' && (
              <textarea className="imp-textarea" value={pasteText}
                onChange={e => { setPasteText(e.target.value); setErr(''); }}
                placeholder={PASTE_PH} />
            )}

            {err && <p className="imp-err">{err}</p>}

            <button className="hero2__cta imp-convert"
              onClick={() => tab === 'upload' ? run(fileText, fileName) : run(pasteText, 'pasted text')}
              disabled={loading || (tab === 'upload' ? !fileText : !pasteText.trim())}>
              <Icon name="zap" size={15} /> {loading ? 'Converting…' : 'Convert with Claude'}
            </button>
          </div>

          {/* ============ RIGHT: AI preview ============ */}
          <div className="imp-col imp-col--preview">
            <div className="imp-pane">
              <div className="imp-pane__head">
                <div className="imp-pane__title">
                  <Icon name="zap" size={15} /> AI preview
                </div>
                <span className={'imp-pane__badge' + (loading ? ' analyzing' : preview ? ' ready' : '')}>
                  {loading ? 'Analysing…' : preview ? 'Ready' : 'Waiting'}
                </span>
              </div>

              {/* progress shimmer during the API call */}
              {loading && (
                <div className="imp-pane__body">
                  <div className="imp-progress">
                    <div className="imp-progress__bar"><div className="imp-progress__shimmer"></div></div>
                    <span className="imp-progress__label">{status || 'Working…'}</span>
                  </div>
                  <div className="imp-skel">
                    <div className="imp-skel__row w70"></div>
                    <div className="imp-skel__row w90 indent"></div>
                    <div className="imp-skel__row w80 indent"></div>
                    <div className="imp-skel__row w60"></div>
                    <div className="imp-skel__row w85 indent"></div>
                  </div>
                </div>
              )}

              {/* empty state */}
              {!loading && !preview && (
                <div className="imp-pane__empty">
                  <Icon name="file" size={30} />
                  <p>Your generated course structure will appear here.</p>
                  <p className="imp-pane__emptysub">Add your outline on the left and convert.</p>
                </div>
              )}

              {/* result */}
              {!loading && preview && (
                <div className="imp-pane__body">
                  <div className="imp-preview__title">{preview.meta.title || 'Untitled course'}</div>
                  <div className="imp-preview__stats">
                    <span>{stats.sections} section{stats.sections !== 1 ? 's' : ''}</span><span>·</span>
                    <span>{stats.lessons} lesson{stats.lessons !== 1 ? 's' : ''}</span><span>·</span>
                    <span>{totalBlocks} blocks</span>
                  </div>

                  <ul className="imp-tree">
                    {preview.lessons.slice(0, 30).map(l => (
                      <li key={l.id} className={'imp-tree__item imp-tree__' + l.kind}>
                        <Icon name={l.kind === 'section' ? 'section' : 'file'} size={13} />
                        <span>{l.title}</span>
                        {l.kind === 'lesson' && l.blocks && (
                          <span className="imp-tree__count">{l.blocks.map(b => b.type).join(' · ')}</span>
                        )}
                      </li>
                    ))}
                    {preview.lessons.length > 30 && (
                      <li className="imp-tree__more">…and {preview.lessons.length - 30} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* footer action */}
              {!loading && preview && (
                <div className="imp-pane__foot">
                  <p className="imp-warn">Replaces your current course. Everything stays editable after import.</p>
                  <button className="hero2__cta imp-cta" onClick={() => onImport(preview)}>
                    Confirm &amp; build course <Icon name="arrowRight" size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ImportModal, convertWithAI });


export {}; // marks this file as an ES module for Vite
