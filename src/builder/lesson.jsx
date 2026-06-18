/* ============================================================
   Course Builder — Lesson view, block shell, block picker
   ============================================================ */

/* ---------- block picker modal ---------- */
function BlockPicker({ onPick, onClose }) {
  const groups = {};
  BLOCK_LIBRARY.forEach(b => { (groups[b.group] = groups[b.group] || []).push(b); });
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="picker" onClick={e => e.stopPropagation()}>
        <div className="picker__head">
          <h3>Add a block</h3>
          <button className="picker__close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="picker__body">
          {Object.keys(groups).map(g => (
            <div key={g}>
              <div className="picker__group">{g}</div>
              <div className="picker__grid">
                {groups[g].map(b => (
                  <button key={b.type} className="pickcard" onClick={() => onPick(b.type)}>
                    <span className="pickcard__icon"><Icon name={b.icon} size={20} /></span>
                    <span className="pickcard__label">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- inserter between blocks ---------- */
function Inserter({ onClick, big }) {
  return (
    <div className={'inserter' + (big ? ' inserter--big' : '')}>
      <div className="inserter__line"></div>
      <button className="inserter__btn" onClick={onClick}>
        <Icon name="plus" size={big ? 16 : 16} />{big && <span>Add block</span>}
      </button>
    </div>
  );
}

/* ---------- review / comment panel (edit mode only) ---------- */
function ReviewPanel({ block, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const reviews = block.reviews || [];

  function addReview() {
    const text = draft.trim();
    if (!text) return;
    const updated = [...reviews, { id: uid('rv'), text, ts: new Date().toISOString() }];
    onChange({ ...block, reviews: updated });
    setDraft('');
  }

  function delReview(id) {
    onChange({ ...block, reviews: reviews.filter(r => r.id !== id) });
  }

  return (
    <div className="review-panel">
      <button type="button" className={'review-toggle' + (open ? ' open' : '') + (reviews.length ? ' has-items' : '')}
        onClick={() => setOpen(o => !o)}>
        <Icon name="quote" size={13} />
        {reviews.length > 0 ? reviews.length + ' comment' + (reviews.length !== 1 ? 's' : '') : 'Add comment'}
        <Icon name={open ? 'up' : 'down'} size={12} />
      </button>
      {open && (
        <div className="review-panel__body">
          {reviews.map(r => (
            <div className="review-item" key={r.id}>
              <p className="review-item__text">{r.text}</p>
              <div className="review-item__meta">
                <span>{new Date(r.ts).toLocaleString()}</span>
                <button type="button" onClick={() => delReview(r.id)} aria-label="Delete comment"><Icon name="trash" size={12} /></button>
              </div>
            </div>
          ))}
          <div className="review-compose">
            <textarea className="review-compose__input" value={draft} placeholder="Leave a comment or feedback…"
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addReview(); }} />
            <button type="button" className="review-compose__send" onClick={addReview} disabled={!draft.trim()}>
              <Icon name="arrowRight" size={14} /> Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- block wrapper with author controls ---------- */
function BlockShell({ block, index, total, editing, onChange, onMove, onDuplicate, onRemove, answer, onAnswer }) {
  const label = (BLOCK_LIBRARY.find(b => b.type === block.type) || {}).label || block.type;
  const revealProps = !editing ? { 'data-reveal': '', 'data-delay': String(Math.min(index * 80, 400)) } : {};
  return (
    <div className="blockwrap" {...revealProps}>
      {editing && <span className="block-tag">{label}</span>}
      {editing && (
        <div className="block-toolbar">
          <button onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move up" style={{ opacity: index === 0 ? .4 : 1 }}><Icon name="up" size={15} /></button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1} aria-label="Move down" style={{ opacity: index === total - 1 ? .4 : 1 }}><Icon name="down" size={15} /></button>
          <span className="sep"></span>
          <button onClick={() => onDuplicate(index)} aria-label="Duplicate"><Icon name="copy" size={15} /></button>
          <button className="danger" onClick={() => onRemove(index)} aria-label="Delete"><Icon name="trash" size={15} /></button>
        </div>
      )}
      <div className="block-body">
        <BlockBody block={block} editing={editing} onChange={onChange} answer={answer} onAnswer={onAnswer} />
      </div>
      {editing && <ReviewPanel block={block} onChange={onChange} />}
    </div>
  );
}

/* ---------- the lesson ---------- */
function LessonView({ lesson, index, editing, onChangeLesson, answers, onAnswer,
                      onPrev, onContinue, isFirst, isLast, completed, accent }) {
  const [picker, setPicker] = useState(null); // insert index or null
  const canvasRef = useRef(null);
  const blocks = lesson.blocks || [];

  // Bidirectional scroll-reveal — elements glide in on enter, reverse on leave
  useEffect(() => {
    if (editing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reveals = canvas.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const el = en.target;
        if (el._rt) { clearTimeout(el._rt); el._rt = null; }
        if (en.isIntersecting) {
          const delay = parseFloat(el.dataset.delay || '0');
          el._rt = setTimeout(() => el.classList.add('is-visible'), delay);
        } else {
          el.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [lesson.id, editing]);

  function update(i, nb) { const b = blocks.slice(); b[i] = nb; onChangeLesson({ ...lesson, blocks: b }); }
  function move(i, dir) {
    const j = i + dir; if (j < 0 || j >= blocks.length) return;
    const b = blocks.slice(); const t = b[i]; b[i] = b[j]; b[j] = t;
    onChangeLesson({ ...lesson, blocks: b });
  }
  function duplicate(i) {
    const copy = JSON.parse(JSON.stringify(blocks[i])); copy.id = uid('b');
    const b = blocks.slice(); b.splice(i + 1, 0, copy); onChangeLesson({ ...lesson, blocks: b });
  }
  function remove(i) {
    const b = blocks.slice(); b.splice(i, 1); onChangeLesson({ ...lesson, blocks: b });
  }
  function insert(type) {
    const b = blocks.slice(); b.splice(picker, 0, newBlock(type));
    onChangeLesson({ ...lesson, blocks: b }); setPicker(null);
  }

  const style = { '--accent': accent };
  return (
    <div className="canvas" style={style} ref={canvasRef}>
      <div className="lessonhead" {...(!editing ? { 'data-reveal': '', 'data-delay': '0' } : {})}>
        <div className="lessonhead__kicker"><span className="dot"></span>
          {editing
            ? <Editable tag="span" editing html={lesson.title} placeholder="Lesson title"
                onCommit={(v) => onChangeLesson({ ...lesson, title: v.replace(/<[^>]+>/g, '') })} />
            : <span>Lesson {index}</span>}
        </div>
        <h1 dangerouslySetInnerHTML={{ __html: lesson.title }}></h1>
      </div>

      <div className="blocks">
        {blocks.length === 0 && !editing && (
          <div className="empty-hint"><div className="ic"><Icon name="book" size={26} /></div>This lesson is empty.</div>
        )}
        {blocks.map((blk, i) => (
          <React.Fragment key={blk.id}>
            {editing && <Inserter onClick={() => setPicker(i)} />}
            <BlockShell block={blk} index={i} total={blocks.length} editing={editing}
              onChange={(nb) => update(i, nb)} onMove={move} onDuplicate={duplicate} onRemove={remove}
              answer={answers[blk.id]} onAnswer={onAnswer} />
          </React.Fragment>
        ))}
        {editing && <Inserter big onClick={() => setPicker(blocks.length)} />}
      </div>

      {/* footer */}
      {!editing && (
        <div className="lessonfoot">
          <button className="lessonfoot__prev" onClick={onPrev} disabled={isFirst} style={{ visibility: isFirst ? 'hidden' : 'visible' }}>
            <Icon name="arrowLeft" size={17} /> Previous
          </button>
          <span className="lessonfoot__spacer"></span>
          <button className={'lessonfoot__cta' + (completed ? ' done' : '') + (isLast ? ' finish' : '')} onClick={onContinue}>
            {isLast ? <React.Fragment>Finish course <Icon name="award" size={18} /></React.Fragment>
                    : <React.Fragment>{completed ? 'Next lesson' : 'Complete & continue'} <Icon name="arrowRight" size={18} /></React.Fragment>}
          </button>
        </div>
      )}

      {picker !== null && <BlockPicker onPick={insert} onClose={() => setPicker(null)} />}
    </div>
  );
}

Object.assign(window, { BlockPicker, Inserter, BlockShell, LessonView });


export {}; // marks this file as an ES module for Vite
