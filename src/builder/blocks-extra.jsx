/* ============================================================
   Course Builder — folded-in interactive blocks
   Process steps · Hotspot diagram · Glossary · Matching · Classify
   Registered on window.EXTRA_BLOCKS; BlockBody() picks them up.
   Relies on globals from data.jsx / blocks.jsx:
   Icon, IconPicker, Editable, Swatches, Seg, accentColor, uid, FLIP_ICONS
   ============================================================ */

/* ============================================================
   PROCESS STEPS (stepper / timeline)
   ============================================================ */
function StepperBlock({ block, editing, onChange }) {
  const [cur, setCur] = useState(0);
  const steps = block.steps || [];
  const c = Math.max(0, Math.min(cur, steps.length - 1));
  function setStep(i, patch) { onChange({ ...block, steps: steps.map((s, j) => j === i ? { ...s, ...patch } : s) }); }
  function add() { onChange({ ...block, steps: [...steps, { id: uid('s'), icon: 'check', name: 'New stage', what: 'What happens at this stage.', agent: '' }] }); }
  function del(i) { const ns = steps.filter((_, j) => j !== i); onChange({ ...block, steps: ns }); if (c >= ns.length) setCur(Math.max(0, ns.length - 1)); }
  const step = steps[c];
  return (
    <div className="blk-stepper">
      <div className="bx-timeline">
        {steps.map((s, i) => (
          <button key={s.id} type="button" className={'bx-tstep' + (i <= c ? ' is-active' : '')} onClick={() => setCur(i)}>
            <span className="bx-tstep__line"></span>
            <span className="bx-tstep__dot"><Icon name={s.icon || 'check'} size={18} /></span>
            <span className="bx-tstep__name" dangerouslySetInnerHTML={{ __html: s.name }}></span>
          </button>
        ))}
      </div>
      {step && (
        <div className="bx-tdetail">
          <div>
            <div className="bx-tdetail__num">Stage {('0' + (c + 1)).slice(-2)} · What happens</div>
            <h3 dangerouslySetInnerHTML={{ __html: step.name }}></h3>
            <p dangerouslySetInnerHTML={{ __html: step.what }}></p>
          </div>
          {step.agent ? (
            <div className="bx-tdetail__agent">
              <div className="bx-flab">Agent relevance</div>
              <p dangerouslySetInnerHTML={{ __html: step.agent }}></p>
            </div>
          ) : null}
        </div>
      )}
      <div className="bx-stepnav">
        <button className="bx-btn ghost" disabled={c === 0} onClick={() => setCur(c - 1)}><Icon name="arrowLeft" size={16} /> Previous</button>
        <button className="bx-btn primary" disabled={c >= steps.length - 1} onClick={() => setCur(c + 1)}>Next <Icon name="arrowRight" size={16} /></button>
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="sliders" size={14} /> Process steps</div>
          {steps.map((s, i) => (
            <div className="subitem" key={s.id}>
              <button type="button" className="subitem__del" onClick={() => del(i)} aria-label="Delete stage"><Icon name="trash" size={14} /></button>
              <div className="subitem__num">Stage {i + 1}</div>
              <div className="field"><span className="field__lab">Name</span><input className="inp" value={s.name} onChange={(e) => setStep(i, { name: e.target.value })} /></div>
              <div className="field"><span className="field__lab">What happens</span><textarea className="ta" value={s.what} onChange={(e) => setStep(i, { what: e.target.value })}></textarea></div>
              <div className="field"><span className="field__lab">Agent relevance (optional)</span><textarea className="ta" value={s.agent || ''} onChange={(e) => setStep(i, { agent: e.target.value })}></textarea></div>
              <div className="field"><span className="field__lab">Icon</span><IconPicker value={s.icon || 'check'} onChange={(v) => setStep(i, { icon: v })} /></div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={add}><Icon name="plus" size={15} /> Add stage</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HOTSPOT DIAGRAM
   ============================================================ */
function HotspotsBlock({ block, editing, onChange }) {
  const [active, setActive] = useState(null);
  const nodes = block.nodes || [];
  function setNode(i, patch) { onChange({ ...block, nodes: nodes.map((n, j) => j === i ? { ...n, ...patch } : n) }); }
  function add() { onChange({ ...block, nodes: [...nodes, { id: uid('h'), icon: 'check', label: 'New step', layer: 'Category', title: 'Headline', body: 'What happens here.' }] }); }
  function del(i) { onChange({ ...block, nodes: nodes.filter((_, j) => j !== i) }); setActive(null); }
  const cur = nodes.find(n => n.id === active);
  return (
    <div className="blk-hotspots">
      {(block.intro || editing) && (
        <Editable className="bx-hsintro" editing={editing} html={block.intro} placeholder="Intro line…"
          onCommit={(v) => onChange({ ...block, intro: v })} />
      )}
      <div className="bx-hsflow">
        {nodes.map((n, i) => (
          <React.Fragment key={n.id}>
            {i > 0 && <span className="bx-hsarrow"><Icon name="arrowRight" size={18} /></span>}
            <div className="bx-hsnode">
              <button type="button" className={'bx-hsbtn' + (active === n.id ? ' is-active' : '')}
                onClick={() => setActive(active === n.id ? null : n.id)} aria-label={(n.label || '').replace(/<[^>]+>/g, '')}>
                <Icon name={n.icon || 'check'} size={22} />
              </button>
              <span className="bx-hslabel" dangerouslySetInnerHTML={{ __html: n.label }}></span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="bx-hsinfo">
        {cur ? (
          <React.Fragment>
            {cur.layer ? <div className="bx-hslayer" dangerouslySetInnerHTML={{ __html: cur.layer }}></div> : null}
            <h4 dangerouslySetInnerHTML={{ __html: cur.title }}></h4>
            <p dangerouslySetInnerHTML={{ __html: cur.body }}></p>
          </React.Fragment>
        ) : <p className="bx-hsempty">Tap any point above to see what is happening at that step.</p>}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="radio" size={14} /> Hotspot points</div>
          {nodes.map((n, i) => (
            <div className="subitem" key={n.id}>
              <button type="button" className="subitem__del" onClick={() => del(i)} aria-label="Delete point"><Icon name="trash" size={14} /></button>
              <div className="subitem__num">Point {i + 1}</div>
              <div className="field"><span className="field__lab">Label (under the icon)</span><input className="inp" value={n.label} onChange={(e) => setNode(i, { label: e.target.value })} /></div>
              <div className="field"><span className="field__lab">Category / layer label</span><input className="inp" value={n.layer || ''} onChange={(e) => setNode(i, { layer: e.target.value })} /></div>
              <div className="field"><span className="field__lab">Headline</span><input className="inp" value={n.title} onChange={(e) => setNode(i, { title: e.target.value })} /></div>
              <div className="field"><span className="field__lab">Explanation</span><textarea className="ta" value={n.body} onChange={(e) => setNode(i, { body: e.target.value })}></textarea></div>
              <div className="field"><span className="field__lab">Icon</span><IconPicker value={n.icon || 'check'} onChange={(v) => setNode(i, { icon: v })} /></div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={add}><Icon name="plus" size={15} /> Add point</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GLOSSARY (searchable terms)
   ============================================================ */
function GlossaryBlock({ block, editing, onChange }) {
  const [q, setQ] = useState('');
  const terms = block.terms || [];
  function setTerm(i, patch) { onChange({ ...block, terms: terms.map((t, j) => j === i ? { ...t, ...patch } : t) }); }
  function add() { onChange({ ...block, terms: [...terms, { id: uid('g'), term: 'New term', def: 'Definition.' }] }); }
  function del(i) { onChange({ ...block, terms: terms.filter((_, j) => j !== i) }); }
  const ql = q.trim().toLowerCase();
  const shown = terms.filter(t => !ql || (((t.term || '') + ' ' + (t.def || '')).replace(/<[^>]+>/g, '').toLowerCase().indexOf(ql) !== -1));
  return (
    <div className="blk-glossary">
      <div className="bx-gsearch">
        <Icon name="search" size={18} />
        <input type="text" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search glossary" />
      </div>
      <div className="bx-glist">
        {shown.map(t => (
          <div className="bx-term" key={t.id}>
            <div className="bx-term__t" dangerouslySetInnerHTML={{ __html: t.term }}></div>
            <div className="bx-term__d" dangerouslySetInnerHTML={{ __html: t.def }}></div>
          </div>
        ))}
        {shown.length === 0 && <p className="bx-hsempty">No terms match “{q}”.</p>}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="book" size={14} /> Glossary terms</div>
          {terms.map((t, i) => (
            <div className="subitem" key={t.id}>
              <button type="button" className="subitem__del" onClick={() => del(i)} aria-label="Delete term"><Icon name="trash" size={14} /></button>
              <div className="field"><span className="field__lab">Term</span><input className="inp" value={t.term} onChange={(e) => setTerm(i, { term: e.target.value })} /></div>
              <div className="field"><span className="field__lab">Definition</span><textarea className="ta" value={t.def} onChange={(e) => setTerm(i, { def: e.target.value })}></textarea></div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={add}><Icon name="plus" size={15} /> Add term</button>
        </div>
      )}
    </div>
  );
}

/* ---------- shared: option-set editor for matching/classify ---------- */
function OptionSetEditor({ label, options, onChange }) {
  function set(i, v) { onChange(options.map((o, j) => j === i ? { ...o, label: v } : o)); }
  function add() { onChange([...options, { id: uid('o'), label: 'New option' }]); }
  function del(i) { onChange(options.filter((_, j) => j !== i)); }
  return (
    <div className="field">
      <span className="field__lab">{label}</span>
      {options.map((o, i) => (
        <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7 }}>
          <input className="inp" value={o.label} onChange={(e) => set(i, e.target.value)} />
          {options.length > 2 && <button type="button" className="subitem__del" style={{ position: 'static' }} onClick={() => del(i)} aria-label="Delete option"><Icon name="trash" size={13} /></button>}
        </div>
      ))}
      <button type="button" className="miniadd" onClick={add}><Icon name="plus" size={14} /> Add option</button>
    </div>
  );
}
function GradedToggle({ graded, onChange }) {
  return (
    <div className="field" style={{ marginTop: 14 }}>
      <label className={'correct-toggle' + (graded ? ' on' : '')} style={{ borderColor: graded ? 'var(--blue)' : undefined, background: graded ? 'color-mix(in srgb,var(--blue) 12%,#fff)' : undefined, color: graded ? 'var(--blue)' : undefined }}>
        <input type="checkbox" checked={graded} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
        <Icon name="award" size={14} /> {graded ? 'Counts toward score' : 'Practice only (not scored)'}
      </label>
    </div>
  );
}
function optText(s) { return (s || '').replace(/<[^>]+>/g, ''); }

/* ============================================================
   MATCHING (graded)
   ============================================================ */
function MatchingBlock({ block, editing, onChange, answer, onAnswer }) {
  const opts = block.optionsList || [];
  const rows = block.rows || [];
  const values = (answer && answer.values) || {};
  const checked = !!(answer && answer.checked);
  function setVal(rowId, v) { onAnswer(block.id, { values: { ...values, [rowId]: v }, checked: false }); }
  function check() { onAnswer(block.id, { values, checked: true }); }
  function reset() { onAnswer(block.id, { values: {}, checked: false }); }
  const allAnswered = rows.length > 0 && rows.every(r => values[r.id]);
  const correctCount = rows.filter(r => values[r.id] === r.correct).length;
  // edit helpers
  function setRow(i, patch) { onChange({ ...block, rows: rows.map((r, j) => j === i ? { ...r, ...patch } : r) }); }
  function addRow() { onChange({ ...block, rows: [...rows, { id: uid('r'), q: 'New scenario.', correct: (opts[0] || {}).id }] }); }
  function delRow(i) { onChange({ ...block, rows: rows.filter((_, j) => j !== i) }); }
  function setOptions(newOpts) {
    const valid = {};
    newOpts.forEach(o => { valid[o.id] = true; });
    onChange({ ...block, optionsList: newOpts, rows: rows.map(r => valid[r.correct] ? r : { ...r, correct: (newOpts[0] || {}).id }) });
  }
  return (
    <div className="blk-kc">
      <div className="bx-kc">
        <div className="bx-kc__tag"><Icon name="link" size={15} /> {block.graded ? 'Knowledge check · Matching' : 'Practice · Matching'}</div>
        <Editable className="bx-kc__instr" editing={editing} html={block.instr} placeholder="Instruction…"
          onCommit={(v) => onChange({ ...block, instr: v })} />
        {rows.map(r => {
          const v = values[r.id];
          let cls = 'bx-mrow';
          if (checked && v) cls += (v === r.correct) ? ' is-correct' : ' is-wrong';
          return (
            <div className={cls} key={r.id}>
              <div className="bx-mrow__q" dangerouslySetInnerHTML={{ __html: r.q }}></div>
              <select className="bx-select" value={v || ''} disabled={editing || checked} onChange={(e) => setVal(r.id, e.target.value)}>
                <option value="">Choose…</option>
                {opts.map(o => <option key={o.id} value={o.id}>{optText(o.label)}</option>)}
              </select>
            </div>
          );
        })}
        {!editing && (
          <div className="bx-kc__actions">
            {!checked
              ? <button className="bx-btn primary" disabled={!allAnswered} onClick={check}>Check answers</button>
              : <button className="bx-btn ghost" onClick={reset}><Icon name="reset" size={14} /> Try again</button>}
            {checked && <span className={'bx-kc__result ' + (correctCount === rows.length ? 'ok' : 'partial')}><Icon name="check" size={15} /> {correctCount} / {rows.length} correct</span>}
          </div>
        )}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="link" size={14} /> Matching setup</div>
          <OptionSetEditor label="Answer options (the categories learners choose from)" options={opts} onChange={setOptions} />
          <div style={{ height: 8 }}></div>
          {rows.map((r, i) => (
            <div className="subitem" key={r.id}>
              <button type="button" className="subitem__del" onClick={() => delRow(i)} aria-label="Delete row"><Icon name="trash" size={14} /></button>
              <div className="subitem__num">Scenario {i + 1}</div>
              <div className="field"><span className="field__lab">Scenario</span><textarea className="ta" value={r.q} onChange={(e) => setRow(i, { q: e.target.value })}></textarea></div>
              <div className="field"><span className="field__lab">Correct answer</span>
                <select className="bx-select" style={{ width: '100%' }} value={r.correct || ''} onChange={(e) => setRow(i, { correct: e.target.value })}>
                  {opts.map(o => <option key={o.id} value={o.id}>{optText(o.label)}</option>)}
                </select>
              </div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addRow}><Icon name="plus" size={15} /> Add scenario</button>
          <GradedToggle graded={block.graded} onChange={(v) => onChange({ ...block, graded: v })} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CLASSIFY (graded, with per-item explanation)
   ============================================================ */
function ClassifyBlock({ block, editing, onChange, answer, onAnswer }) {
  const cats = block.categories || [];
  const items = block.items || [];
  const values = (answer && answer.values) || {};
  const checked = !!(answer && answer.checked);
  function setVal(itemId, v) { onAnswer(block.id, { values: { ...values, [itemId]: v }, checked: false }); }
  function check() { onAnswer(block.id, { values, checked: true }); }
  function reset() { onAnswer(block.id, { values: {}, checked: false }); }
  const allAnswered = items.length > 0 && items.every(it => values[it.id]);
  const correctCount = items.filter(it => values[it.id] === it.correct).length;
  function setItem(i, patch) { onChange({ ...block, items: items.map((it, j) => j === i ? { ...it, ...patch } : it) }); }
  function addItem() { onChange({ ...block, items: [...items, { id: uid('i'), q: 'New statement.', correct: (cats[0] || {}).id, explain: '' }] }); }
  function delItem(i) { onChange({ ...block, items: items.filter((_, j) => j !== i) }); }
  function setCats(newCats) {
    const valid = {};
    newCats.forEach(c => { valid[c.id] = true; });
    onChange({ ...block, categories: newCats, items: items.map(it => valid[it.correct] ? it : { ...it, correct: (newCats[0] || {}).id }) });
  }
  return (
    <div className="blk-kc">
      <div className="bx-kc">
        <div className="bx-kc__tag"><Icon name="layers" size={15} /> {block.graded ? 'Knowledge check · Classify' : 'Practice · Classify'}</div>
        <Editable className="bx-kc__instr" editing={editing} html={block.instr} placeholder="Instruction…"
          onCommit={(v) => onChange({ ...block, instr: v })} />
        {items.map(it => {
          const v = values[it.id];
          const ok = v === it.correct;
          return (
            <div className="bx-citem" key={it.id}>
              <div className="bx-citem__q" dangerouslySetInnerHTML={{ __html: it.q }}></div>
              <select className="bx-select" style={{ width: '100%', maxWidth: 340 }} value={v || ''} disabled={editing || checked} onChange={(e) => setVal(it.id, e.target.value)}>
                <option value="">Choose category…</option>
                {cats.map(c => <option key={c.id} value={c.id}>{optText(c.label)}</option>)}
              </select>
              {checked && v && (
                <div className={'bx-cfb ' + (ok ? 'ok' : 'no')}>
                  <b>{ok ? 'Correct. ' : 'Review: '}</b>{it.explain}
                </div>
              )}
            </div>
          );
        })}
        {!editing && (
          <div className="bx-kc__actions">
            {!checked
              ? <button className="bx-btn primary" disabled={!allAnswered} onClick={check}>Check answers</button>
              : <button className="bx-btn ghost" onClick={reset}><Icon name="reset" size={14} /> Try again</button>}
            {checked && <span className={'bx-kc__result ' + (correctCount === items.length ? 'ok' : 'partial')}><Icon name="check" size={15} /> {correctCount} / {items.length} correct</span>}
          </div>
        )}
      </div>
      {editing && (
        <div className="editpanel">
          <div className="editpanel__title"><Icon name="layers" size={14} /> Classify setup</div>
          <OptionSetEditor label="Categories (learners sort into these)" options={cats} onChange={setCats} />
          <div style={{ height: 8 }}></div>
          {items.map((it, i) => (
            <div className="subitem" key={it.id}>
              <button type="button" className="subitem__del" onClick={() => delItem(i)} aria-label="Delete statement"><Icon name="trash" size={14} /></button>
              <div className="subitem__num">Statement {i + 1}</div>
              <div className="field"><span className="field__lab">Statement</span><textarea className="ta" value={it.q} onChange={(e) => setItem(i, { q: e.target.value })}></textarea></div>
              <div className="field"><span className="field__lab">Correct category</span>
                <select className="bx-select" style={{ width: '100%' }} value={it.correct || ''} onChange={(e) => setItem(i, { correct: e.target.value })}>
                  {cats.map(c => <option key={c.id} value={c.id}>{optText(c.label)}</option>)}
                </select>
              </div>
              <div className="field"><span className="field__lab">Explanation (shown after checking)</span><textarea className="ta" value={it.explain || ''} onChange={(e) => setItem(i, { explain: e.target.value })}></textarea></div>
            </div>
          ))}
          <button type="button" className="miniadd" onClick={addItem}><Icon name="plus" size={15} /> Add statement</button>
          <GradedToggle graded={block.graded} onChange={(v) => onChange({ ...block, graded: v })} />
        </div>
      )}
    </div>
  );
}

/* ---------- register ---------- */
window.EXTRA_BLOCKS = {
  stepper: StepperBlock,
  hotspots: HotspotsBlock,
  glossary: GlossaryBlock,
  matching: MatchingBlock,
  classify: ClassifyBlock,
};


export {}; // marks this file as an ES module for Vite
