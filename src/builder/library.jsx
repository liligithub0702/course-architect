/* ============================================================
   Course Builder — Course library, JSON export/import,
   and "Create from outline" (chunked Claude generation).
   Globals used: React, Icon, uid, blankCourse, ACCENTS, FLIP_ICONS
   ============================================================ */

const LIBRARY_KEY = 'sutherland_course_library_v1';

/* ---------- library storage ---------- */
function loadLibrary() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || []; }
  catch (e) { return []; }
}
function saveLibrary(arr) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(arr)); } catch (e) {}
}
function libraryUpsert(course) {
  const lib = loadLibrary();
  const clone = JSON.parse(JSON.stringify(course));
  let id = clone.meta && clone.meta.libraryId;
  const entry = {
    id: id || uid('lib'),
    title: (clone.meta && clone.meta.title) || 'Untitled course',
    accent: (clone.meta && clone.meta.accent) || 'indigo',
    savedAt: Date.now(),
    course: clone,
  };
  entry.course.meta = entry.course.meta || {};
  entry.course.meta.libraryId = entry.id;
  const i = lib.findIndex(e => e.id === entry.id);
  if (i >= 0) lib[i] = entry; else lib.unshift(entry);
  saveLibrary(lib);
  return entry.id;
}
function libraryDelete(id) { saveLibrary(loadLibrary().filter(e => e.id !== id)); }

/* ---------- JSON file download / read ---------- */
function downloadJSON(course) {
  const name = ((course.meta && course.meta.title) || 'course').replace(/<[^>]+>/g, '').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'course';
  const blob = new Blob([JSON.stringify(course, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name + '.json';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsText(file);
  });
}

/* ---------- validation helpers ---------- */
function validAccent(a) {
  const keys = ACCENTS.map(x => x.key);
  return keys.indexOf(a) !== -1 ? a : 'indigo';
}
function validIcon(i) { return FLIP_ICONS.indexOf(i) !== -1 ? i : 'layers'; }
function asArray(x) { return Array.isArray(x) ? x : []; }
function txt(s) { return (s == null ? '' : String(s)); }

/* ---------- normalize an "authoring" course into the internal model ---------- */
function normalizeBlock(b) {
  const id = uid('b');
  const t = b && b.type;
  switch (t) {
    case 'heading':
      return { id, type: 'heading', level: b.level === 'h3' ? 'h3' : 'h2', text: txt(b.text) || 'Heading', eyebrow: txt(b.eyebrow) };
    case 'text':
      return { id, type: 'text', html: txt(b.html) || txt(b.text) };
    case 'statement':
      return { id, type: 'statement', variant: b.variant === 'quote' ? 'quote' : 'callout', accent: validAccent(b.accent), label: txt(b.label) || 'Note', title: txt(b.title), text: txt(b.text) };
    case 'flip':
      return { id, type: 'flip', cards: asArray(b.cards).map(c => ({ id: uid('c'), accent: validAccent(c.accent), icon: validIcon(c.icon), kicker: txt(c.kicker), front: txt(c.front) || 'Term', back: txt(c.back) })) };
    case 'accordion':
      return { id, type: 'accordion', accent: validAccent(b.accent), items: asArray(b.items).map(it => ({ id: uid('a'), title: txt(it.title) || 'Item', sub: txt(it.sub), html: txt(it.html) })) };
    case 'tabs':
      return { id, type: 'tabs', items: asArray(b.items).map(it => ({ id: uid('t'), label: txt(it.label) || 'Tab', html: txt(it.html) })) };
    case 'stepper':
      return { id, type: 'stepper', steps: asArray(b.steps).map(s => ({ id: uid('s'), icon: validIcon(s.icon), name: txt(s.name) || 'Stage', what: txt(s.what), agent: txt(s.agent) })) };
    case 'hotspots':
      return { id, type: 'hotspots', intro: txt(b.intro), nodes: asArray(b.nodes).map(n => ({ id: uid('h'), icon: validIcon(n.icon), label: txt(n.label) || 'Step', layer: txt(n.layer), title: txt(n.title) || 'Headline', body: txt(n.body) })) };
    case 'glossary':
      return { id, type: 'glossary', terms: asArray(b.terms).map(tm => ({ id: uid('g'), term: txt(tm.term) || 'Term', def: txt(tm.def) })) };
    case 'mcq': {
      const options = asArray(b.options).map(o => ({ id: uid('o'), text: txt(o.text) || 'Option', feedback: txt(o.feedback) }));
      const ci = typeof b.correctIndex === 'number' ? b.correctIndex : 0;
      return { id, type: 'mcq', question: txt(b.question) || 'Question', graded: b.graded !== false, options, correct: options[ci] ? options[ci].id : (options[0] && options[0].id) || null };
    }
    case 'matching': {
      const optionsList = asArray(b.options).map(o => ({ id: uid('o'), label: txt(typeof o === 'string' ? o : o.label) || 'Option' }));
      const rows = asArray(b.rows).map(r => {
        const ci = typeof r.correctIndex === 'number' ? r.correctIndex : 0;
        return { id: uid('r'), q: txt(r.q) || 'Scenario', correct: optionsList[ci] ? optionsList[ci].id : (optionsList[0] && optionsList[0].id) };
      });
      return { id, type: 'matching', graded: b.graded !== false, instr: txt(b.instr) || 'Match each scenario to the correct option.', optionsList, rows };
    }
    case 'classify': {
      const categories = asArray(b.categories).map(o => ({ id: uid('o'), label: txt(typeof o === 'string' ? o : o.label) || 'Category' }));
      const items = asArray(b.items).map(it => {
        const ci = typeof it.correctIndex === 'number' ? it.correctIndex : 0;
        return { id: uid('i'), q: txt(it.q) || 'Statement', correct: categories[ci] ? categories[ci].id : (categories[0] && categories[0].id), explain: txt(it.explain) };
      });
      return { id, type: 'classify', graded: b.graded !== false, instr: txt(b.instr) || 'Choose the category each statement reflects.', categories, items };
    }
    case 'divider':
      return { id, type: 'divider', style: b.style === 'space' ? 'space' : 'line' };
    default:
      return { id, type: 'text', html: txt(b && (b.html || b.text)) };
  }
}
function normalizeAuthoringCourse(raw) {
  const meta = (raw && raw.meta) || {};
  const facts = asArray(meta.facts).map(f => ({ k: txt(f.k), v: txt(f.v) })).filter(f => f.k || f.v);
  const lessons = asArray(raw && raw.lessons).map(l => ({
    id: uid('l'),
    kind: l.kind === 'section' ? 'section' : 'lesson',
    title: txt(l.title) || (l.kind === 'section' ? 'Section' : 'Lesson'),
    blocks: asArray(l.blocks).map(normalizeBlock),
  }));
  return {
    meta: {
      title: txt(meta.title) || 'Untitled course',
      subtitle: txt(meta.subtitle),
      kicker: txt(meta.kicker) || 'Training · Self-paced',
      cover: '',
      accent: validAccent(meta.accent),
      facts: facts.length ? facts : [{ k: 'Delivery', v: 'Self-paced' }, { k: 'Duration', v: '60 minutes' }],
    },
    lessons: lessons.length ? lessons : blankCourse().lessons,
  };
}

/* ---------- robust JSON extraction from model output ---------- */
function extractJSON(s) {
  let t = txt(s).trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

/* ---------- block-shape reference shared with the model ---------- */
const BLOCK_SHAPES = [
  '{"type":"heading","text":"","eyebrow":""}',
  '{"type":"text","html":"<p>...</p>"}',
  '{"type":"statement","variant":"callout","label":"Note","title":"","text":""}',
  '{"type":"flip","cards":[{"front":"","back":"","kicker":"","icon":"layers","accent":"blue"}]}',
  '{"type":"accordion","accent":"orange","items":[{"title":"","sub":"","html":""}]}',
  '{"type":"tabs","items":[{"label":"","html":""}]}',
  '{"type":"stepper","steps":[{"name":"","what":"","agent":"","icon":"check"}]}',
  '{"type":"hotspots","intro":"","nodes":[{"label":"","layer":"","title":"","body":"","icon":"check"}]}',
  '{"type":"glossary","terms":[{"term":"","def":""}]}',
  '{"type":"mcq","question":"","graded":true,"options":[{"text":"","feedback":""}],"correctIndex":0}',
  '{"type":"matching","instr":"","options":["A","B","C"],"rows":[{"q":"","correctIndex":0}]}',
  '{"type":"classify","instr":"","categories":["A","B"],"items":[{"q":"","correctIndex":0,"explain":""}]}',
].join('\n');
const ICON_HINT = 'layers,wifi,server,globe,zap,database,building,clock,smartphone,radio,cpu,sliders,cloud,shield,book';

/* ---------- chunked generation ---------- */
async function callClaude(prompt) {
  if (!window.claude || typeof window.claude.complete !== 'function') {
    throw new Error('AI generation is only available while the Builder runs inside the preview environment.');
  }
  return await window.claude.complete(prompt);
}

async function generateCourseFromOutline(outline, onProgress) {
  onProgress && onProgress('Reading the outline…');
  const skeletonPrompt =
    'You structure self-paced training courses. Output ONLY JSON, no markdown, no prose.\n' +
    'Schema: {"meta":{"title":"","kicker":"","subtitle":"","accent":"indigo","facts":[{"k":"Delivery","v":"Self-paced"}]},' +
    '"lessons":[{"kind":"lesson","title":"","focus":""}]}\n' +
    'Rules: accent is one of blue,green,orange,indigo,magenta,slate. facts = 3-4 short label/value chips. ' +
    'kind is "section" (a divider with no content) or "lesson". Make ONE lesson per major objective/topic in the outline, ' +
    'then a "Knowledge check" lesson and a "Summary" lesson. 5-9 lessons total. ' +
    '"focus" = one sentence naming what the lesson covers and which interactive block fits ' +
    '(flip cards, stepper, accordion, hotspots, glossary, mcq, matching, classify). Be concise.\n\nOUTLINE:\n' + outline;
  const skelRaw = await callClaude(skeletonPrompt);
  const skel = extractJSON(skelRaw);
  const lessons = asArray(skel.lessons);
  const out = { meta: skel.meta || {}, lessons: [] };

  for (let i = 0; i < lessons.length; i++) {
    const L = lessons[i];
    const title = txt(L.title) || ('Lesson ' + (i + 1));
    if (L.kind === 'section') { out.lessons.push({ kind: 'section', title, blocks: [] }); continue; }
    onProgress && onProgress('Writing lesson ' + (i + 1) + ' of ' + lessons.length + ': ' + title);
    const blocksPrompt =
      'You write ONE lesson of a training course as JSON blocks. Output ONLY JSON, no markdown: {"blocks":[...]}\n' +
      'Lesson title: "' + title + '". Focus: "' + txt(L.focus) + '".\n' +
      'Use 2-4 concise blocks. Start with a heading, then the teaching block(s) that fit the focus. ' +
      'Base everything strictly on the outline — do not invent facts. Keep text tight (the author will refine it).\n' +
      'Allowed block shapes (copy the structure exactly):\n' + BLOCK_SHAPES + '\n' +
      'Valid icon names: ' + ICON_HINT + '. For mcq/matching/classify, correctIndex is 0-based into options/categories.\n\nOUTLINE:\n' + outline;
    try {
      const raw = await callClaude(blocksPrompt);
      const parsed = extractJSON(raw);
      out.lessons.push({ kind: 'lesson', title, blocks: asArray(parsed.blocks) });
    } catch (e) {
      // Don't lose the lesson — drop in an editable placeholder.
      out.lessons.push({ kind: 'lesson', title, blocks: [
        { type: 'heading', text: title },
        { type: 'statement', variant: 'callout', label: 'Draft', title: 'Add this lesson’s content', text: 'Automatic drafting did not complete for this lesson. Use the block menu to build it from your outline.' },
      ] });
    }
  }
  onProgress && onProgress('Assembling the course…');
  return normalizeAuthoringCourse(out);
}

/* ============================================================
   MODAL: Create from outline
   ============================================================ */
function OutlineImport({ onDone, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { const t = await readTextFile(f); setText(t); setError(''); }
    catch (err) { setError('Could not read that file. Paste the text instead.'); }
  }
  async function generate() {
    if (!text.trim()) { setError('Paste an outline or upload a .txt / .md file first.'); return; }
    setBusy(true); setError(''); setStatus('Starting…');
    try {
      const course = await generateCourseFromOutline(text, setStatus);
      onDone(course);
    } catch (err) {
      setError(err.message || 'Generation failed. Try again, or build the course manually.');
      setBusy(false);
    }
  }
  return (
    <div className="modal-veil" onClick={busy ? undefined : onClose}>
      <div className="picker lib" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="picker__head">
          <h3><Icon name="zap" size={17} /> Create a course from an outline</h3>
          {!busy && <button className="picker__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>}
        </div>
        <div className="picker__body">
          <p className="lib__hint">Paste your source outline (or upload a <b>.txt</b> / <b>.md</b> file). Claude drafts a full course — lessons, flip cards, activities — that you then refine in the editor. It works on your messy notes too.</p>
          <textarea className="ta" style={{ minHeight: 200 }} value={text} placeholder="Paste your outline here…" onChange={e => setText(e.target.value)} disabled={busy}></textarea>
          <div className="lib__row" style={{ marginTop: 12 }}>
            <button type="button" className="miniadd" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}><Icon name="upload" size={15} /> Upload .txt / .md</button>
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown,text/plain" hidden onChange={onFile} />
            <span className="lib__spacer"></span>
            <button type="button" className="lessonfoot__cta" style={{ boxShadow: 'none' }} onClick={generate} disabled={busy}>
              {busy ? 'Working…' : <React.Fragment>Generate course <Icon name="arrowRight" size={17} /></React.Fragment>}
            </button>
          </div>
          {busy && <div className="lib__status"><span className="lib__spin"></span> {status}</div>}
          {error && <div className="lib__error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL: Courses manager
   ============================================================ */
function CourseManager({ course, onLoad, onLinkLibrary, onClose, toast }) {
  const [lib, setLib] = useState(loadLibrary);
  const [outline, setOutline] = useState(false);
  const [name, setName] = useState((course.meta && course.meta.title || '').replace(/<[^>]+>/g, ''));
  const importRef = useRef(null);

  function refresh() { setLib(loadLibrary()); }
  function saveCurrent() {
    const c = JSON.parse(JSON.stringify(course));
    c.meta = c.meta || {}; if (name.trim()) c.meta.title = name.trim();
    const id = libraryUpsert(c);
    onLinkLibrary(id);
    refresh(); toast('Saved to library');
  }
  function open(entry) {
    if (!confirm('Open “' + entry.title.replace(/<[^>]+>/g, '') + '”? Your current course stays saved in the library if you saved it.')) return;
    onLoad(JSON.parse(JSON.stringify(entry.course)));
  }
  function del(entry) {
    if (!confirm('Delete “' + entry.title.replace(/<[^>]+>/g, '') + '” from the library? This cannot be undone.')) return;
    libraryDelete(entry.id); refresh(); toast('Removed from library');
  }
  function newCourse() {
    if (!confirm('Start a new blank course? Save the current one to the library first if you want to keep editing it later.')) return;
    onLoad(blankCourse());
  }
  async function onImport(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const t = await readTextFile(f);
      const data = JSON.parse(t);
      if (!data || !data.lessons || !data.meta) throw new Error('bad');
      onLoad(data);
    } catch (err) { alert('That file is not a valid course export.'); }
    e.target.value = '';
  }
  function fmtDate(ms) { try { return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="picker lib" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="picker__head">
          <h3><Icon name="folder" size={17} /> Courses</h3>
          <button className="picker__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="picker__body">

          <div className="lib__group">Current course</div>
          <div className="lib__current">
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Course name" />
            <div className="lib__row" style={{ marginTop: 10 }}>
              <button className="lessonfoot__cta" style={{ boxShadow: 'none' }} onClick={saveCurrent}><Icon name="save" size={16} /> Save to library</button>
              <button className="btn-ghost" onClick={() => downloadJSON(course)}><Icon name="download" size={14} /> Export .json</button>
            </div>
          </div>

          <div className="lib__row lib__startrow">
            <button className="btn-ghost" onClick={newCourse}><Icon name="plus" size={14} /> New blank course</button>
            <button className="btn-ghost" onClick={() => importRef.current && importRef.current.click()}><Icon name="file" size={14} /> Import .json</button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
            <button className="btn-ghost lib__ai" onClick={() => setOutline(true)}><Icon name="zap" size={14} /> Create from outline</button>
          </div>

          <div className="lib__group" style={{ marginTop: 22 }}>Saved courses <span className="lib__count">{lib.length}</span></div>
          {lib.length === 0 && <p className="lib__hint">No saved courses yet. Save the current course above to keep it while you build the next one.</p>}
          <div className="lib__list">
            {lib.map(entry => (
              <div className="lib__item" key={entry.id}>
                <span className="lib__dot" style={{ background: (ACCENTS.find(a => a.key === entry.accent) || {}).color || '#2E79BB' }}></span>
                <div className="lib__meta">
                  <div className="lib__title" dangerouslySetInnerHTML={{ __html: entry.title }}></div>
                  <div className="lib__sub">Saved {fmtDate(entry.savedAt)} · {asArray(entry.course.lessons).filter(l => l.kind === 'lesson').length} lessons</div>
                </div>
                <button className="lib__act" onClick={() => open(entry)} title="Open"><Icon name="edit" size={15} /></button>
                <button className="lib__act" onClick={() => downloadJSON(entry.course)} title="Export .json"><Icon name="download" size={15} /></button>
                <button className="lib__act danger" onClick={() => del(entry)} title="Delete"><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {outline && <OutlineImport onClose={() => setOutline(false)} onDone={(c) => { setOutline(false); onLoad(c); }} />}
    </div>
  );
}

Object.assign(window, {
  CourseManager, OutlineImport,
  loadLibrary, saveLibrary, libraryUpsert, libraryDelete,
});


export {}; // marks this file as an ES module for Vite
