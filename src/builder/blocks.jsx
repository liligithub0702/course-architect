/* ============================================================
   Course Builder — Editable helper + block renderers
   ============================================================ */
const { useState, useRef, useEffect } = React;

/* ---------- inline-editable text ---------- */
function Editable({ html, tag, className, placeholder, onCommit, editing, rich, style }) {
  const ref = useRef(null);
  const Tag = tag || 'div';
  useEffect(() => {
    if (editing && ref.current && document.activeElement !== ref.current) {
      if (ref.current.innerHTML !== (html || '')) ref.current.innerHTML = html || '';
    }
  }, [html, editing]);
  if (!editing) {
    return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html || '' }}></Tag>;
  }
  return (
    <Tag
      ref={ref}
      className={(className || '') + (placeholder ? ' edit-empty' : '')}
      data-editable="true"
      data-ph={placeholder || ''}
      data-rich={rich ? 'true' : undefined}
      contentEditable
      suppressContentEditableWarning
      style={style}
      onBlur={(e) => onCommit(e.currentTarget.innerHTML)}
      onKeyDown={(e) => {
        if (!rich && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
      }}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    ></Tag>
  );
}

/* ---------- embed url parsing ---------- */
function parseEmbed(url) {
  if (!url) return null;
  let m;
  if ((m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/))) return { type: 'iframe', src: 'https://www.youtube.com/embed/' + m[1] };
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { type: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'video', src: url };
  return { type: 'iframe', src: url };
}

/* ---------- small UI helpers ---------- */
function Swatches({ value, onChange }) {
  return (
    <div className="swatchrow">
      {ACCENTS.map(a => (
        <button key={a.key} type="button" className={'swatch' + (value === a.key ? ' on' : '')}
          style={{ background: a.color }} onClick={() => onChange(a.key)} aria-label={a.key}></button>
      ))}
    </div>
  );
}
function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} type="button" className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
function IconPicker({ value, onChange }) {
  return (
    <div className="iconpick">
      {FLIP_ICONS.map(name => (
        <button key={name} type="button" className={'iconpick__btn' + (value === name ? ' on' : '')}
          onClick={() => onChange(name)} aria-label={name}><Icon name={name} size={18} /></button>
      ))}
    </div>
  );
}

/* ============================================================
   HEADING
   ============================================================ */
function HeadingBlock({ block, editing, onChange }) {
  const Tag = block.level === 'h3' ? 'h3' : 'h2';
  return (
    <div className="blk-heading">
      {(editing || block.eyebrow) && (
        <div className="eyebrow"><span className="dot"></span>
          <Editable tag="span" editing={editing} html={block.eyebrow} placeholder="Eyebrow (optional)"
            onCommit={(v) => onChange({ ...block, eyebrow: v })} />
        </div>
      )}
      <Editable tag={Tag} editing={editing} html={block.text} placeholder="Heading text"
        onCommit={(v) => onChange({ ...block, text: v })} />
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="heading" size={14} /> Heading options</div>
          <div className="field">
            <span className="field__lab">Size</span>
            <Seg value={block.level} options={[{ value: 'h2', label: 'Large' }, { value: 'h3', label: 'Medium' }]}
              onChange={(v) => onChange({ ...block, level: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TEXT
   ============================================================ */
function TextBlock({ block, editing, onChange }) {
  return (
    <Editable className="blk-text" editing={editing} rich html={block.html} placeholder="Write something…"
      onCommit={(v) => onChange({ ...block, html: v })} />
  );
}

/* ============================================================
   IMAGE
   ============================================================ */
function ImageBlock({ block, editing, onChange }) {
  const fileRef = useRef(null);
  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onChange({ ...block, src: r.result });
    r.readAsDataURL(f);
  }
  return (
    <div className="blk-image">
      <figure>
        {block.src
          ? <img src={block.src} alt={block.alt || ''} />
          : <div className="img-placeholder"><Icon name="image" size={30} />{editing ? 'Add an image below' : 'No image'}</div>}
        {(block.caption || editing) && (
          <Editable tag="figcaption" editing={editing} html={block.caption} placeholder="Caption (optional)"
            onCommit={(v) => onChange({ ...block, caption: v })} />
        )}
      </figure>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="image" size={14} /> Image source</div>
          <div className="field">
            <span className="field__lab">Image URL</span>
            <input className="inp" value={block.src && block.src.startsWith('data:') ? '' : block.src}
              placeholder="https://… or upload a file"
              onChange={(e) => onChange({ ...block, src: e.target.value })} />
          </div>
          <div className="field">
            <button type="button" className="miniadd" onClick={() => fileRef.current && fileRef.current.click()}>
              <Icon name="upload" size={15} /> Upload image
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            {block.src && block.src.startsWith('data:') && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--gray)' }}>Uploaded ✓</span>}
          </div>
          <div className="field">
            <span className="field__lab">Alt text (accessibility)</span>
            <input className="inp" value={block.alt} placeholder="Describe the image"
              onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EMBED / VIDEO
   ============================================================ */
function EmbedBlock({ block, editing, onChange }) {
  const fileRef = useRef(null);
  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onChange({ ...block, upload: r.result });
    r.readAsDataURL(f);
  }
  const parsed = (block.mode === 'code' || block.mode === 'upload') ? null : parseEmbed(block.url);
  return (
    <div className="blk-embed">
      {block.mode === 'code' && block.code ? (
        <div className="embed-frame" dangerouslySetInnerHTML={{ __html: block.code }}></div>
      ) : block.mode === 'upload' && block.upload ? (
        <div className="embed-frame"><video src={block.upload} controls></video></div>
      ) : parsed ? (
        parsed.type === 'video'
          ? <div className="embed-frame"><video src={parsed.src} controls></video></div>
          : <div className="embed-frame"><iframe src={parsed.src} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
      ) : (
        <div className="embed-placeholder"><Icon name="play" size={34} />{editing ? 'Add a video or embed below' : 'No media'}</div>
      )}
      {(block.caption || editing) && (
        <Editable tag="div" className="embed-caption" editing={editing} html={block.caption} placeholder="Caption (optional)"
          onCommit={(v) => onChange({ ...block, caption: v })} />
      )}
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="play" size={14} /> Media source</div>
          <div className="field">
            <Seg value={block.mode} options={[{ value: 'upload', label: 'Upload video' }, { value: 'video', label: 'Video link' }, { value: 'code', label: 'Embed code' }]}
              onChange={(v) => onChange({ ...block, mode: v })} />
          </div>
          {block.mode === 'code' ? (
            <div className="field">
              <span className="field__lab">Paste embed / iframe code</span>
              <textarea className="ta" value={block.code} placeholder="<iframe …></iframe>"
                onChange={(e) => onChange({ ...block, code: e.target.value })}></textarea>
            </div>
          ) : block.mode === 'upload' ? (
            <div className="field">
              <button type="button" className="miniadd" onClick={() => fileRef.current && fileRef.current.click()}>
                <Icon name="upload" size={15} /> {block.upload ? 'Replace video' : 'Upload video file'}
              </button>
              <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />
              {block.upload && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--gray)' }}>Uploaded ✓</span>}
              <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '8px 0 0' }}>MP4 or WebM works best. Large files increase the course size.</p>
            </div>
          ) : (
            <div className="field">
              <span className="field__lab">YouTube, Vimeo, or MP4 link</span>
              <input className="inp" value={block.url} placeholder="https://youtu.be/… or https://….mp4"
                onChange={(e) => onChange({ ...block, url: e.target.value })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STATEMENT / CALLOUT / QUOTE
   ============================================================ */
function StatementBlock({ block, editing, onChange }) {
  const style = { '--accent': accentColor(block.accent) };
  return (
    <div className="blk-statement">
      <div className={'statement ' + block.variant} style={style}>
        {block.variant === 'quote' ? (
          <Editable className="statement__text" editing={editing} html={block.text} placeholder="Quote or statement…"
            onCommit={(v) => onChange({ ...block, text: v })} />
        ) : (
          <React.Fragment>
            {(block.label || editing) && (
              <Editable className="statement__label" editing={editing} html={block.label} placeholder="LABEL"
                onCommit={(v) => onChange({ ...block, label: v })} />
            )}
            {(block.title || editing) && (
              <Editable className="statement__title" editing={editing} html={block.title} placeholder="Title (optional)"
                onCommit={(v) => onChange({ ...block, title: v })} />
            )}
            <Editable className="statement__text" editing={editing} rich html={block.text} placeholder="Statement text…"
              onCommit={(v) => onChange({ ...block, text: v })} />
          </React.Fragment>
        )}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="quote" size={14} /> Style</div>
          <div className="field">
            <Seg value={block.variant} options={[{ value: 'callout', label: 'Callout' }, { value: 'quote', label: 'Quote' }]}
              onChange={(v) => onChange({ ...block, variant: v })} />
          </div>
          <div className="field">
            <span className="field__lab">Accent colour</span>
            <Swatches value={block.accent} onChange={(v) => onChange({ ...block, accent: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FLIP CARDS
   ============================================================ */
function FlipBlock({ block, editing, onChange }) {
  const [flipped, setFlipped] = useState({});
  function toggle(id) { setFlipped(f => ({ ...f, [id]: !f[id] })); }
  function setCard(i, patch) {
    const cards = block.cards.map((c, j) => j === i ? { ...c, ...patch } : c);
    onChange({ ...block, cards });
  }
  function addCard() { onChange({ ...block, cards: [...block.cards, { id: uid('c'), accent: 'blue', front: 'New card', back: 'Definition.' }] }); }
  function delCard(i) { onChange({ ...block, cards: block.cards.filter((_, j) => j !== i) }); }
  return (
    <div className="blk-flip">
      <div className="flipgrid">
        {block.cards.map(c => (
          <button key={c.id} type="button" className={'flip' + (flipped[c.id] ? ' is-flipped' : '')}
            style={{ '--cardaccent': accentColor(c.accent) }} onClick={() => toggle(c.id)}>
            <div className="flip__inner">
              <div className="flip__face flip__front">
                <div className="flip__icon"><Icon name={c.icon || 'layers'} size={24} /></div>
                <div className="flip__title" dangerouslySetInnerHTML={{ __html: c.front }}></div>
                <div className="flip__hint"><Icon name="reset" size={13} /> Hover or tap to flip</div>
              </div>
              <div className="flip__face flip__back">
                {c.kicker ? <div className="flip__kicker" dangerouslySetInnerHTML={{ __html: c.kicker }}></div> : null}
                <div className="flip__backtitle" dangerouslySetInnerHTML={{ __html: c.front }}></div>
                <p dangerouslySetInnerHTML={{ __html: c.back }}></p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="flip" size={14} /> Cards</div>
          {block.cards.map((c, i) => (
            <div className="subitem" key={c.id}>
              <button type="button" className="subitem__del" onClick={() => delCard(i)} aria-label="Delete card"><Icon name="trash" size={14} /></button>
              <div className="subitem__num">Card {i + 1}</div>
              <div className="field">
                <span className="field__lab">Front (term)</span>
                <input className="inp" value={c.front} onChange={(e) => setCard(i, { front: e.target.value })} />
              </div>
              <div className="field">
                <span className="field__lab">Back kicker (optional)</span>
                <input className="inp" value={c.kicker || ''} placeholder="e.g. The physical foundation" onChange={(e) => setCard(i, { kicker: e.target.value })} />
              </div>
              <div className="field">
                <span className="field__lab">Back (definition)</span>
                <textarea className="ta" value={c.back} onChange={(e) => setCard(i, { back: e.target.value })}></textarea>
              </div>
              <div className="field">
                <span className="field__lab">Icon</span>
                <IconPicker value={c.icon || 'layers'} onChange={(v) => setCard(i, { icon: v })} />
              </div>
              <div className="field">
                <span className="field__lab">Accent</span>
                <Swatches value={c.accent} onChange={(v) => setCard(i, { accent: v })} />
              </div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addCard}><Icon name="plus" size={15} /> Add card</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TABS
   ============================================================ */
function TabsBlock({ block, editing, onChange }) {
  const [active, setActive] = useState(0);
  const cur = Math.min(active, block.items.length - 1);
  function setItem(i, patch) { onChange({ ...block, items: block.items.map((t, j) => j === i ? { ...t, ...patch } : t) }); }
  function addItem() { onChange({ ...block, items: [...block.items, { id: uid('t'), label: 'New tab', html: 'Tab content.' }] }); }
  function delItem(i) {
    const items = block.items.filter((_, j) => j !== i);
    onChange({ ...block, items });
    if (cur >= items.length) setActive(Math.max(0, items.length - 1));
  }
  return (
    <div className="blk-tabs" data-tabs>
      <div className="tabs__list">
        {block.items.map((t, i) => (
          <button key={t.id} type="button" className={'tab' + (i === cur ? ' is-active' : '')}
            onClick={() => setActive(i)} dangerouslySetInnerHTML={{ __html: t.label }}></button>
        ))}
      </div>
      {block.items[cur] && (
        <Editable key={block.items[cur].id} className="tabpanel" editing={editing} rich html={block.items[cur].html}
          placeholder="Tab content…" onCommit={(v) => setItem(cur, { html: v })} />
      )}
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="tabs" size={14} /> Tabs · editing content for the active tab above</div>
          {block.items.map((t, i) => (
            <div className="field" key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="inp" value={t.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder={'Tab ' + (i + 1) + ' label'} />
              <button type="button" className="subitem__del" style={{ position: 'static' }} onClick={() => delItem(i)} aria-label="Delete tab"><Icon name="trash" size={14} /></button>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addItem}><Icon name="plus" size={15} /> Add tab</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACCORDION
   ============================================================ */
function AccordionBlock({ block, editing, onChange }) {
  const [open, setOpen] = useState({});
  const style = { '--accent': accentColor(block.accent) };
  function setItem(i, patch) { onChange({ ...block, items: block.items.map((t, j) => j === i ? { ...t, ...patch } : t) }); }
  function addItem() { onChange({ ...block, items: [...block.items, { id: uid('a'), title: 'New item', html: 'Hidden content.' }] }); }
  function delItem(i) { onChange({ ...block, items: block.items.filter((_, j) => j !== i) }); }
  return (
    <div className="blk-accordion" style={style}>
      <div className="accordion">
        {block.items.map((it, i) => (
          <div className={'acc' + (open[it.id] ? ' is-open' : '')} key={it.id}>
            <button type="button" className="acc__head" onClick={() => setOpen(o => ({ ...o, [it.id]: !o[it.id] }))}>
              <span className="acc__marker"></span>
              <span className="acc__htext">
                <span className="acc__title" dangerouslySetInnerHTML={{ __html: it.title }}></span>
                {it.sub ? <span className="acc__sub" dangerouslySetInnerHTML={{ __html: it.sub }}></span> : null}
              </span>
              <Icon name="down" className="acc__chev" />
            </button>
            <div className="acc__body"><div className="acc__bodyinner">
              <Editable className="acc__content" editing={editing} rich html={it.html} placeholder="Content…"
                onCommit={(v) => setItem(i, { html: v })} />
            </div></div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="accordion" size={14} /> Accordion</div>
          <div className="field">
            <span className="field__lab">Accent colour</span>
            <Swatches value={block.accent} onChange={(v) => onChange({ ...block, accent: v })} />
          </div>
          {block.items.map((it, i) => (
            <div className="field" key={it.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="inp" value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} placeholder={'Item ' + (i + 1) + ' title'} />
              <input className="inp" value={it.sub || ''} onChange={(e) => setItem(i, { sub: e.target.value })} placeholder="Subtitle (optional)" />
              <button type="button" className="subitem__del" style={{ position: 'static' }} onClick={() => delItem(i)} aria-label="Delete item"><Icon name="trash" size={14} /></button>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addItem}><Icon name="plus" size={15} /> Add item</button>
          <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '12px 0 0' }}>Open a row above to edit its content inline.</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MULTIPLE CHOICE
   ============================================================ */
function McqBlock({ block, editing, onChange, answer, onAnswer }) {
  const chosen = answer && answer.val;
  const style = { '--accent': accentColor('magenta') };
  function setOpt(i, patch) { onChange({ ...block, options: block.options.map((o, j) => j === i ? { ...o, ...patch } : o) }); }
  function addOpt() { onChange({ ...block, options: [...block.options, { id: uid('o'), text: 'New option', feedback: '' }] }); }
  function delOpt(i) {
    const o = block.options[i];
    const patch = { options: block.options.filter((_, j) => j !== i) };
    if (block.correct === o.id) patch.correct = null;
    onChange({ ...block, ...patch });
  }
  const answered = !editing && !!chosen;
  return (
    <div className="blk-mcq">
      <div className="mcq" style={style}>
        <div className="mcq__tag"><Icon name="check" size={15} /> {block.graded ? 'Knowledge check' : 'Quick check'}</div>
        <Editable className="mcq__q" editing={editing} html={block.question} placeholder="Question…"
          onCommit={(v) => onChange({ ...block, question: v })} />
        <div className="mc-opts">
          {block.options.map((o, i) => {
            const isCorrect = block.correct === o.id;
            let cls = 'mc-opt';
            if (answered) {
              if (isCorrect) cls += ' is-correct';
              else if (o.id === chosen) cls += ' is-wrong';
              else cls += ' is-dim';
              cls += ' is-answered';
            }
            return (
              <div key={o.id} className={cls} role="button" tabIndex={editing || answered ? -1 : 0}
                onClick={() => { if (!editing && !answered) onAnswer(block.id, o.id); }}
                onKeyDown={(e) => { if (!editing && !answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAnswer(block.id, o.id); } }}>
                <span className="mc-opt__radio" data-letter={'ABCDEFGH'[i]}>{answered && (isCorrect || o.id === chosen) && <Icon name={isCorrect ? 'check' : 'close'} size={13} />}</span>
                <Editable tag="span" editing={editing} html={o.text} placeholder="Option text"
                  onCommit={(v) => setOpt(i, { text: v })} style={{ flex: 1 }} />
                {editing && (
                  <button type="button" className={'correct-toggle' + (isCorrect ? ' on' : '')}
                    onClick={(e) => { e.stopPropagation(); onChange({ ...block, correct: o.id }); }}>
                    <Icon name="check" size={13} /> {isCorrect ? 'Correct' : 'Mark correct'}
                  </button>
                )}
                {editing && block.options.length > 2 && (
                  <button type="button" className="subitem__del" style={{ position: 'static' }} onClick={(e) => { e.stopPropagation(); delOpt(i); }} aria-label="Delete option"><Icon name="trash" size={13} /></button>
                )}
              </div>
            );
          })}
        </div>
        {answered && (() => {
          const ch = block.options.find(o => o.id === chosen);
          const ok = chosen === block.correct;
          return <div className={'mc-fb show ' + (ok ? 'ok' : 'no')}><b>{ok ? 'Correct. ' : 'Not quite. '}</b>{ch && ch.feedback}</div>;
        })()}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="check" size={14} /> Question setup</div>
          {block.correct == null && <p style={{ fontSize: 13, color: 'var(--wrong)', margin: '0 0 12px', fontWeight: 600 }}>⚠ Mark which option is correct using the buttons above.</p>}
          {block.options.map((o, i) => (
            <div className="field" key={o.id}>
              <span className="field__lab">Feedback for “{o.text.replace(/<[^>]+>/g, '') || ('Option ' + (i + 1))}”</span>
              <input className="inp" value={o.feedback} placeholder="Shown when this option is picked"
                onChange={(e) => setOpt(i, { feedback: e.target.value })} />
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addOpt}><Icon name="plus" size={15} /> Add option</button>
          <div className="field" style={{ marginTop: 16 }}>
            <label className={'correct-toggle' + (block.graded ? ' on' : '')} style={{ borderColor: block.graded ? 'var(--blue)' : undefined, background: block.graded ? 'color-mix(in srgb,var(--blue) 12%,#fff)' : undefined, color: block.graded ? 'var(--blue)' : undefined }}>
              <input type="checkbox" checked={block.graded} onChange={(e) => onChange({ ...block, graded: e.target.checked })} style={{ display: 'none' }} />
              <Icon name="award" size={14} /> {block.graded ? 'Counts toward score' : 'Practice only (not scored)'}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DIVIDER
   ============================================================ */
function DividerBlock({ block, editing, onChange }) {
  return (
    <div className="blk-divider">
      {block.style === 'space' ? <div style={{ height: 40 }}></div> : <hr />}
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="divider" size={14} /> Divider</div>
          <Seg value={block.style} options={[{ value: 'line', label: 'Line' }, { value: 'space', label: 'Blank space' }]}
            onChange={(v) => onChange({ ...block, style: v })} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DISPATCH
   ============================================================ */
const BLOCK_COMPONENTS = {
  heading: HeadingBlock, text: TextBlock, image: ImageBlock, embed: EmbedBlock,
  statement: StatementBlock, flip: FlipBlock, tabs: TabsBlock, accordion: AccordionBlock,
  mcq: McqBlock, divider: DividerBlock,
};
function BlockBody(props) {
  const extra = (typeof window !== 'undefined' && window.EXTRA_BLOCKS) || {};
  const C = BLOCK_COMPONENTS[props.block.type] || extra[props.block.type] || TextBlock;
  return <C {...props} />;
}

Object.assign(window, { Editable, parseEmbed, Swatches, Seg, IconPicker, BlockBody });


export {}; // marks this file as an ES module for Vite
