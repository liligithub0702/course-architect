/* ============================================================
   Course Builder — App shell, cover, completion, rich toolbar
   ============================================================ */

/* ---------- floating rich-text toolbar ---------- */
function RichToolbar() {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    function onSel() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return; }
      let node = sel.anchorNode;
      while (node && node.nodeType === 3) node = node.parentNode;
      const rich = node && node.closest && node.closest('[data-rich]');
      if (!rich || !document.body.classList.contains('editing')) { setPos(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setPos({ top: r.top - 46, left: r.left + r.width / 2 });
    }
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);
  if (!pos) return null;
  function cmd(c) { document.execCommand(c, false, null); }
  function link() { const u = prompt('Link URL'); if (u) document.execCommand('createLink', false, u); }
  return (
    <div className="rt-toolbar" style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
      onMouseDown={(e) => e.preventDefault()}>
      <button onClick={() => cmd('bold')} aria-label="Bold"><Icon name="bold" size={15} /></button>
      <button onClick={() => cmd('italic')} aria-label="Italic"><Icon name="italic" size={15} /></button>
      <button onClick={() => cmd('insertUnorderedList')} aria-label="List"><Icon name="list" size={15} /></button>
      <button onClick={link} aria-label="Link"><Icon name="link" size={15} /></button>
    </div>
  );
}

/* ---------- cover / course home (hero) ---------- */
function Cover({ course, editing, onChangeMeta, onStart, accent }) {
  const fileRef = useRef(null);
  function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => onChangeMeta({ ...course.meta, cover: r.result }); r.readAsDataURL(f);
  }
  const firstLesson = course.lessons.find(l => l.kind === 'lesson');
  const facts = course.meta.facts || [];
  function setFact(i, patch) { onChangeMeta({ ...course.meta, facts: facts.map((f, j) => j === i ? { ...f, ...patch } : f) }); }
  return (
    <div className="canvas canvas--hero" style={{ '--accent': accent }}>
      <div className="hero2">
        {course.meta.cover ? <img className="hero2__img" src={course.meta.cover} alt="" /> : <div className="hero2__grid"></div>}
        <div className="hero2__inner">
          <Editable tag="div" className="hero2__module" editing={editing} html={course.meta.kicker} placeholder="MODULE · TRACK"
            onCommit={(v) => onChangeMeta({ ...course.meta, kicker: v.replace(/<[^>]+>/g, '') })} />
          <Editable tag="h1" className="hero2__title" editing={editing} html={course.meta.title} placeholder="Course title"
            onCommit={(v) => onChangeMeta({ ...course.meta, title: v })} />
          <Editable tag="p" className="hero2__sub" editing={editing} html={course.meta.subtitle} placeholder="Course description"
            onCommit={(v) => onChangeMeta({ ...course.meta, subtitle: v })} />
          {facts.length > 0 && (
            <div className="hero2__meta">
              {facts.map((f, i) => (
                <div className="metachip2" key={i}>
                  <Editable tag="span" className="metachip2__k" editing={editing} html={f.k} placeholder="Label"
                    onCommit={(v) => setFact(i, { k: v.replace(/<[^>]+>/g, '') })} />
                  <Editable tag="span" className="metachip2__v" editing={editing} html={f.v} placeholder="Value"
                    onCommit={(v) => setFact(i, { v: v.replace(/<[^>]+>/g, '') })} />
                </div>
              ))}
            </div>
          )}
          {!editing && firstLesson && (
            <button className="hero2__cta" onClick={onStart}>Begin the module <Icon name="arrowRight" size={19} /></button>
          )}
        </div>
      </div>
      {editing && (
        <div className="editpanel" style={{ maxWidth: 520 }}>
          <div className="editpanel__title"><Icon name="image" size={14} /> Cover image &amp; accent</div>
          <div className="field">
            <input className="inp" value={course.meta.cover && course.meta.cover.startsWith('data:') ? '' : course.meta.cover}
              placeholder="Image URL (optional — leave blank for the grid background)" onChange={(e) => onChangeMeta({ ...course.meta, cover: e.target.value })} />
          </div>
          <button type="button" className="miniadd" onClick={() => fileRef.current && fileRef.current.click()}><Icon name="upload" size={15} /> Upload cover</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <div className="field" style={{ marginTop: 14 }}>
            <span className="field__lab">Course accent colour</span>
            <Swatches value={course.meta.accent} onChange={(v) => onChangeMeta({ ...course.meta, accent: v })} />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '12px 0 0' }}>Edit the module label, title, description, and the fact chips directly on the hero above.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- completion screen ---------- */
function Completion({ pct, doneCount, total, score, onReview, onRestart, accent }) {
  const R = 66, C = 2 * Math.PI * R;
  return (
    <div className="canvas" style={{ '--accent': accent }}>
      <div className="complete">
        <div className="complete__award"><Icon name="award" size={36} /></div>
        <div className="complete__ring">
          <svg width="150" height="150">
            <circle className="complete__ring-track" cx="75" cy="75" r={R} fill="none" strokeWidth="11" />
            <circle className="complete__ring-fill" cx="75" cy="75" r={R} fill="none" strokeWidth="11"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <div className="complete__pct">{pct}%</div>
        </div>
        <h1>Course complete</h1>
        <p className="complete__sub">You've worked through every lesson. Review anything you'd like, or restart to go again.</p>
        <div className="complete__stats">
          <div className="complete__stat"><div className="n">{doneCount}/{total}</div><div className="l">Lessons done</div></div>
          {score.total > 0 && <div className="complete__stat"><div className="n">{Math.round((score.correct / score.total) * 100)}%</div><div className="l">Quiz score</div></div>}
        </div>
        <div className="complete__actions">
          <button className="btn-ghost" onClick={onRestart}><Icon name="reset" size={15} /> Restart course</button>
          <button className="lessonfoot__cta" style={{ boxShadow: 'none' }} onClick={onReview}>Back to start <Icon name="arrowRight" size={17} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- toast ---------- */
function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef(null);
  function show(m) { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2200); }
  const node = <div className={'toast' + (msg ? ' show' : '')}><Icon name="check" size={16} /> {msg}</div>;
  return [node, show];
}

/* ============================================================
   APP
   ============================================================ */
function App() {
  const [course, setCourse] = useState(loadCourse);
  const [progress, setProgress] = useState(loadProgress);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState({ type: 'cover' });
  const [showImporter, setShowImporter] = useState(false);
  const [screen, setScreen] = useState('dashboard'); // 'dashboard' | 'builder'
  const [toastNode, toast] = useToast();

  // --- premium learner-view motion system ---
  const scrollRef   = useRef(null);
  const progFillRef = useRef(null);
  const progPctRef  = useRef(null);
  const railFillRef = useRef(null);
  const pulseRef    = useRef(null);
  const pulseNodeRef= useRef(null);
  const pulseTrailRef=useRef(null);
  const blob1Ref    = useRef(null);
  const blob2Ref    = useRef(null);

  useEffect(() => {
    if (editing || screen !== 'builder') return;
    const el = scrollRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const CA = { r: 38, g: 35, b: 93 };   // #26235D
    const CB = { r: 222, g: 27, b: 84 };  // #DE1B54
    const mix = t => ({
      r: Math.round(CA.r + (CB.r - CA.r) * t),
      g: Math.round(CA.g + (CB.g - CA.g) * t),
      b: Math.round(CA.b + (CB.b - CA.b) * t),
    });
    const rgb  = c => `rgb(${c.r},${c.g},${c.b})`;
    const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

    let lastY = 0, speed = 0, raf;
    const tick = () => {
      const y   = el.scrollTop;
      const max = (el.scrollHeight - el.clientHeight) || 1;
      const p   = clamp(y / max, 0, 1);
      speed += (Math.abs(y - lastY) - speed) * 0.18;
      lastY = y;
      const sp = Math.min(speed / 34, 1);

      // progress bar + percentage
      if (progFillRef.current) progFillRef.current.style.width = (p * 100).toFixed(2) + '%';
      if (progPctRef.current)  progPctRef.current.textContent  = Math.round(p * 100) + '%';

      // signal rail
      const railH = el.clientHeight;
      const pulseY = p * railH;
      if (pulseRef.current)     pulseRef.current.style.transform = `translate(-50%, ${pulseY.toFixed(1)}px)`;
      if (railFillRef.current)  railFillRef.current.style.height  = pulseY.toFixed(1) + 'px';
      const col = mix(clamp(0.25 + p * 0.55 + sp * 0.5, 0, 1));
      if (pulseNodeRef.current) {
        const scale = 0.62 + sp * 0.78;
        pulseNodeRef.current.style.transform  = `scale(${scale.toFixed(3)})`;
        pulseNodeRef.current.style.background = rgb(col);
        pulseNodeRef.current.style.boxShadow  = `0 0 ${(10 + sp * 24).toFixed(0)}px ${(3 + sp * 5).toFixed(0)}px ${rgba(col, 0.5)}`;
      }
      if (pulseTrailRef.current) {
        pulseTrailRef.current.style.opacity    = (sp * 0.85).toFixed(2);
        pulseTrailRef.current.style.background = `linear-gradient(180deg, transparent, ${rgb(col)})`;
      }

      // ambient blobs
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate(${(-p * 150).toFixed(0)}px, ${(p * 60).toFixed(0)}px) scale(${(1 + p * 0.25).toFixed(3)})`;
        blob1Ref.current.style.opacity   = (0.04 + p * 0.05).toFixed(3);
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.opacity   = (clamp((p - 0.58) / 0.42, 0, 1) * 0.08).toFixed(3);
        blob2Ref.current.style.transform = `translate(${(p * 40).toFixed(0)}px, ${(-p * 50).toFixed(0)}px) scale(${(0.8 + p * 0.35).toFixed(3)})`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [editing, screen]);

  // autosave
  useEffect(() => { saveCourse(course); }, [course]);
  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { document.body.classList.toggle('editing', editing); }, [editing]);

  /* ---- dashboard <-> builder navigation ---- */
  function openFromLibrary(entry) {
    setCourse(JSON.parse(JSON.stringify(entry.course)));
    setProgress({ completed: {}, answers: {} });
    setView({ type: 'cover' });
    setEditing(false);
    setScreen('builder');
  }
  function newCourse() {
    setCourse(blankCourse());
    setProgress({ completed: {}, answers: {} });
    setView({ type: 'cover' });
    setEditing(true);
    setScreen('builder');
  }
  function backToLibrary() {
    cloudSaveCourse(course) // save current work to the shared library
      .then(() => toast('Saved to library'))
      .catch(e => toast('Save failed: ' + e.message));
    setScreen('dashboard');
  }

  const lessons = course.lessons.filter(l => l.kind === 'lesson');
  const totalLessons = lessons.length;
  const completed = progress.completed || {};
  const doneCount = lessons.filter(l => completed[l.id]).length;
  const progressPct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
  const accent = accentColor(course.meta.accent);

  // score across graded activities (mcq + matching + classify)
  const score = (() => {
    let correct = 0, total = 0;
    const A = progress.answers || {};
    course.lessons.forEach(l => (l.blocks || []).forEach(b => {
      const a = A[b.id];
      if (b.type === 'mcq' && b.graded && b.correct) {
        total++;
        if (a && a.val === b.correct) correct++;
      } else if (b.type === 'matching' && b.graded) {
        (b.rows || []).forEach(r => { total++; if (a && a.values && a.values[r.id] === r.correct) correct++; });
      } else if (b.type === 'classify' && b.graded) {
        (b.items || []).forEach(it => { total++; if (a && a.values && a.values[it.id] === it.correct) correct++; });
      }
    }));
    return { correct, total };
  })();

  /* ---- course mutations ---- */
  function updateLesson(updated) {
    setCourse(c => ({ ...c, lessons: c.lessons.map(l => l.id === updated.id ? updated : l) }));
  }
  function changeMeta(meta) { setCourse(c => ({ ...c, meta })); }
  function addLesson() {
    const l = { id: uid('l'), kind: 'lesson', title: 'New lesson', blocks: [newBlock('heading')] };
    l.blocks[0].text = 'New lesson';
    setCourse(c => ({ ...c, lessons: [...c.lessons, l] }));
    setView({ type: 'lesson', id: l.id });
    toast('Lesson added');
  }
  function addSection() {
    const s = { id: uid('l'), kind: 'section', title: 'New section', blocks: [] };
    setCourse(c => ({ ...c, lessons: [...c.lessons, s] }));
    toast('Section added');
  }
  function rename(id, title) {
    setCourse(c => ({ ...c, lessons: c.lessons.map(l => l.id === id ? { ...l, title } : l) }));
  }
  function del(id) {
    const item = course.lessons.find(l => l.id === id);
    if (!confirm('Delete "' + item.title.replace(/<[^>]+>/g, '') + '"?')) return;
    setCourse(c => ({ ...c, lessons: c.lessons.filter(l => l.id !== id) }));
    if (view.type === 'lesson' && view.id === id) setView({ type: 'cover' });
  }
  function importCourse(parsed) {
    setCourse(parsed);
    setProgress({ completed: {}, answers: {} });
    setView({ type: 'cover' });
    setShowImporter(false);
    setScreen('builder');
    toast('Course imported from outline');
  }

  function reorder(fromId, toId) {
    setCourse(c => {
      const arr = c.lessons.slice();
      const fi = arr.findIndex(l => l.id === fromId);
      const ti = arr.findIndex(l => l.id === toId);
      if (fi < 0 || ti < 0) return c;
      const [m] = arr.splice(fi, 1); arr.splice(ti, 0, m);
      return { ...c, lessons: arr };
    });
  }

  /* ---- learner answers ---- */
  // value may be an option id (mcq) or a data object (matching/classify: {values, checked})
  function answer(blockId, value) {
    const v = (value && typeof value === 'object') ? value : { val: value };
    setProgress(p => ({ ...p, answers: { ...(p.answers || {}), [blockId]: v } }));
  }

  /* ---- navigation / completion ---- */
  function go(v) { setView(v); document.querySelector('.scroll') && (document.querySelector('.scroll').scrollTop = 0); document.body.classList.remove('nav-open'); }
  function lessonIndex(id) { return lessons.findIndex(l => l.id === id); }
  function continueFrom(id) {
    setProgress(p => ({ ...p, completed: { ...(p.completed || {}), [id]: true } }));
    const i = lessonIndex(id);
    if (i < lessons.length - 1) go({ type: 'lesson', id: lessons[i + 1].id });
    else go({ type: 'complete' });
  }
  function restart() {
    setProgress({ completed: {}, answers: {} });
    go({ type: 'cover' });
    toast('Progress reset');
  }

  /* ---- render current view ---- */
  let main;
  if (view.type === 'cover') {
    main = <Cover course={course} editing={editing} onChangeMeta={changeMeta} accent={accent}
      onStart={() => { const f = lessons[0]; if (f) go({ type: 'lesson', id: f.id }); }} />;
  } else if (view.type === 'complete') {
    main = <Completion pct={progressPct} doneCount={doneCount} total={totalLessons} score={score}
      onReview={() => go({ type: 'cover' })} onRestart={restart} accent={accent} />;
  } else {
    const lesson = course.lessons.find(l => l.id === view.id);
    if (!lesson) { main = <Cover course={course} editing={editing} onChangeMeta={changeMeta} accent={accent} onStart={() => {}} />; }
    else {
      const li = lessonIndex(lesson.id);
      main = <LessonView lesson={lesson} index={li + 1} editing={editing} onChangeLesson={updateLesson}
        answers={progress.answers || {}} onAnswer={answer}
        isFirst={li === 0} isLast={li === lessons.length - 1} completed={completed[lesson.id]}
        accent={accent}
        onPrev={() => { if (li > 0) go({ type: 'lesson', id: lessons[li - 1].id }); }}
        onContinue={() => continueFrom(lesson.id)} />;
    }
  }

  const crumbTitle = view.type === 'cover' ? 'Course home'
    : view.type === 'complete' ? 'Completion'
    : (course.lessons.find(l => l.id === view.id) || {}).title || '';

  // ---- dashboard screen ----
  if (screen === 'dashboard') {
    return (
      <React.Fragment>
        <Dashboard onOpen={openFromLibrary} onNew={newCourse} onImport={() => setShowImporter(true)} />
        {showImporter && <ImportModal onImport={importCourse} onClose={() => setShowImporter(false)} />}
        {toastNode}
      </React.Fragment>
    );
  }

  // ---- builder screen ----
  return (
    <React.Fragment>
      {/* Signal rail — learner mode only, travels with scroll */}
      {!editing && (
        <div className="signal-rail" aria-hidden="true">
          <div className="signal-rail__track"></div>
          <div className="signal-rail__fill" ref={railFillRef}></div>
          <div className="signal-rail__pulse" ref={pulseRef}>
            <div className="signal-rail__trail" ref={pulseTrailRef}></div>
            <div className="signal-rail__node" ref={pulseNodeRef}></div>
          </div>
        </div>
      )}
      {/* Ambient depth blobs — learner mode only */}
      {!editing && <React.Fragment>
        <div className="ambient-blob-1" ref={blob1Ref} aria-hidden="true"></div>
        <div className="ambient-blob-2" ref={blob2Ref} aria-hidden="true"></div>
      </React.Fragment>}

      <div className="app">
        <Sidebar course={course} currentView={view} completed={completed} editing={editing}
          onNavigate={go} onAddLesson={addLesson} onAddSection={addSection} onRename={rename} onDelete={del} onReorder={reorder}
          progressPct={progressPct} doneCount={doneCount} totalLessons={totalLessons}
          onToggleEdit={() => setEditing(e => !e)} onImport={() => setShowImporter(true)}
          onExportScorm={() => exportScorm(course)} />
        <div className="main">
          <header className="topbar" style={{ position: 'sticky', top: 0 }}>
            {/* Scroll progress bar — learner mode */}
            {!editing && <div className="scroll-prog"><div className="scroll-prog__fill" ref={progFillRef}></div></div>}
            <button className="topbar__menubtn" onClick={() => document.body.classList.toggle('nav-open')} aria-label="Menu"><Icon name="menu" /></button>
            <button className="btn-ghost topbar__lib" onClick={backToLibrary}><Icon name="arrowLeft" size={14} /> Library</button>
            <div className="topbar__crumb"><span dangerouslySetInnerHTML={{ __html: course.meta.title }}></span> <Icon name="arrowRight" size={13} /> <b dangerouslySetInnerHTML={{ __html: crumbTitle }}></b></div>
            <span className="topbar__spacer"></span>
            {!editing && <span className="topbar__prog-pct" ref={progPctRef}>0%</span>}
            <span className={'topbar__badge ' + (editing ? 'edit' : 'learn')}>{editing ? 'Author mode' : 'Learner view'}</span>
            {editing && <button className="btn-ghost" onClick={() => { if (confirm('Reset the whole course back to the blank template? This erases your content.')) { const d = defaultCourse(); setCourse(d); setProgress({ completed: {}, answers: {} }); go({ type: 'cover' }); toast('Course reset'); } }}><Icon name="reset" size={14} /> Reset template</button>}
          </header>
          <div className="scroll" ref={scrollRef}>{main}</div>
        </div>
        {showImporter && <ImportModal onImport={importCourse} onClose={() => setShowImporter(false)} />}
        <RichToolbar />
        {toastNode}
      </div>
    </React.Fragment>
  );
}

// reuse one root so hot-reload doesn't create it twice
if (!window.__caRoot) window.__caRoot = ReactDOM.createRoot(document.getElementById('root'));
window.__caRoot.render(<Gate><App /></Gate>);


export {}; // marks this file as an ES module for Vite
