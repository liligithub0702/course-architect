/* ============================================================
   Course Builder — AI-powered Outline Importer
   Sends the outline to Claude and gets back a complete course.
   ============================================================ */

const AI_MODEL = 'claude-sonnet-4-6';
const API_KEY_STORE = 'sutherland_anthropic_key_v1';

/* ---- the conversion prompt ---- */
const COURSE_PROMPT = `You are an expert instructional designer. Convert the course outline below into a complete, rich course JSON object.

SCHEMA:
{
  "meta": {
    "title": "string",
    "subtitle": "string — 1-2 sentence description",
    "kicker": "string — e.g. 'MODULE 21 · COMMUNICATIONS VERTICAL · PHASE 4: SPECIALISE'",
    "cover": "",
    "accent": "indigo",
    "facts": [
      {"k": "Delivery", "v": "Self-paced"},
      {"k": "Duration", "v": "60 minutes"},
      {"k": "Competency", "v": "Domain Knowledge"},
      {"k": "Stage", "v": "Understand"}
    ]
  },
  "lessons": [ ... ]
}

Each lesson item is either a SECTION (navigation divider, no blocks) or a LESSON (has blocks):

SECTION: { "id": "l1", "kind": "section", "title": "Section Name", "blocks": [] }
LESSON:  { "id": "l2", "kind": "lesson",  "title": "Lesson Title", "blocks": [...] }

BLOCK TYPES — choose the best fit for each piece of content:

1. Heading (required as first block of every lesson):
   {"id":"b1","type":"heading","level":"h2","text":"Lesson title","eyebrow":"Optional label e.g. Objective 01"}

2. Text paragraph:
   {"id":"b2","type":"text","html":"<p>Content. Can include <strong>bold</strong> and <em>italic</em>.</p>"}

3. Statement / callout (key points, tips, examples, scenarios):
   {"id":"b3","type":"statement","variant":"callout","accent":"blue","label":"Note","title":"Headline","text":"Supporting detail."}
   - variant: "callout" (information), "example" (case study / real-world scenario), "quote"
   - accent: "blue" | "green" | "orange" | "magenta" | "indigo"
   - label: "Note" | "Key Point" | "Example" | "Scenario" | "Tip" | "Warning"

4. Flip cards (terms, concepts, comparisons — use for 2 to 8 items):
   {"id":"b4","type":"flip","cards":[
     {"id":"c1","accent":"blue","icon":"layers","kicker":"Category","front":"Term or concept","back":"Full explanation or definition."},
     {"id":"c2","accent":"magenta","icon":"zap","kicker":"","front":"Second term","back":"Its explanation."}
   ]}
   Available icons: layers, wifi, server, globe, zap, database, building, clock, smartphone, radio, cpu, sliders, cloud, shield, book, award

5. Accordion (3 to 6 expandable items — challenges, features, categories):
   {"id":"b5","type":"accordion","accent":"orange","items":[
     {"id":"a1","title":"Item title","sub":"Optional subtitle","html":"<p>Expanded content for this item.</p>"},
     {"id":"a2","title":"Second item","sub":"","html":"<p>Content.</p>"}
   ]}

6. Tabs (2 to 4 parallel concepts to compare side by side):
   {"id":"b6","type":"tabs","items":[
     {"id":"t1","label":"First Tab","html":"<p>Content.</p>"},
     {"id":"t2","label":"Second Tab","html":"<p>Content.</p>"}
   ]}

7. Process stepper (sequential steps, timelines, staged processes):
   {"id":"b7","type":"stepper","steps":[
     {"id":"s1","icon":"building","name":"Stage name","what":"What happens at this stage.","agent":"Why this matters to the learner / agent."},
     {"id":"s2","icon":"clock","name":"Next stage","what":"Description.","agent":"Relevance."}
   ]}
   Available icons: building, clock, check, smartphone, server, globe, layers, zap, wifi, database

8. Glossary (5 or more technical term definitions):
   {"id":"b8","type":"glossary","terms":[
     {"id":"g1","term":"Technical term","def":"Clear definition."},
     {"id":"g2","term":"Another term","def":"Definition."}
   ]}

9. Multiple choice question (knowledge checks, quizzes):
   {"id":"b9","type":"mcq","graded":true,"question":"Question text?",
    "options":[
      {"id":"o1","text":"Option A","feedback":"Why this is right or wrong."},
      {"id":"o2","text":"Option B","feedback":"Feedback."},
      {"id":"o3","text":"Option C","feedback":"Feedback."}
    ],
    "correct":"o1"}
   NOTE: "correct" must equal the "id" of the correct option.

CONTENT & STRUCTURE RULES:
- Create one SECTION for each major course part (e.g. Introduction, Core Knowledge, Practice, Wrap Up)
- Create one LESSON per learning objective or distinct topic
- Every lesson MUST start with a "heading" block
- Aim for 4–8 blocks per lesson — use the rich block types, not just text
- Use "flip" cards for vocabulary, key terms, and short concept pairs
- Use "stepper" for any timeline, chronological sequence, or multi-stage process
- Use "accordion" for any list of 3+ challenges, features, benefits, or options
- Use "tabs" when comparing two sides or two categories (e.g. Equipment vs Services)
- Use "glossary" for a dedicated terms/definitions lesson
- Use "mcq" for every practice activity or knowledge check question
- Use "statement" with variant="example" for any real-world scenario, agent dialogue, or case study
- Use "text" only for narrative paragraphs that don't fit another block type
- Extract and use ALL content from the outline — do not summarise or skip sections
- Pull actual text, real examples, correct answers, and feedback from the outline
- For MCQs, set the correct answer and write accurate feedback for each option
- Generate all IDs as short unique strings: l1, l2, b1, b2, c1, c2, o1, o2, etc.

OUTPUT REQUIREMENTS:
- Respond with ONLY the JSON object — no explanation, no markdown fences
- Keep string values concise; do not pad with unnecessary whitespace
- Use compact JSON (no extra blank lines between properties)

OUTLINE TO CONVERT:
`;

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

/* ---- call Claude API ---- */
async function convertWithAI(text, apiKey, onStatus) {
  onStatus('Sending outline to Claude…');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-beta': 'output-128k-2025-02-19',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: COURSE_PROMPT + text }],
    }),
  });

  if (!resp.ok) {
    let msg = 'API error ' + resp.status;
    try { const e = await resp.json(); msg = e.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  onStatus('Parsing course structure…');
  const data = await resp.json();
  const raw = (data.content && data.content[0]?.text) || '';

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
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem(API_KEY_STORE) || '');
  const [keyDraft, setKeyDraft]   = useState(() => localStorage.getItem(API_KEY_STORE) || '');
  const [keySaved, setKeySaved]   = useState(() => !!localStorage.getItem(API_KEY_STORE));
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
    localStorage.setItem(API_KEY_STORE, k);
    setApiKey(k);
    setKeySaved(true);
  }

  async function run(text, label) {
    if (!apiKey) { setErr('Add your Anthropic API key above first.'); return; }
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
                <span>Anthropic API key — Claude turns your outline into a full course</span>
              </div>
              <div className="imp-key-row">
                <input
                  className={'imp-key-input' + (keySaved ? ' saved' : '')}
                  type="password"
                  placeholder="sk-ant-api03-…"
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
                  Get a key at <strong>console.anthropic.com</strong> · Stored in your browser only.
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
