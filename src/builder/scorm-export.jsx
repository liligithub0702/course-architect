/* ============================================================
   SCORM 1.2 Export
   ------------------------------------------------------------
   Generates a self-contained SCORM 1.2 ZIP package from the
   current course object. All content is inlined into one HTML
   file so it works in any LMS without external dependencies.

   Usage (from author mode):
     exportScorm(course)   ->  triggers ZIP download
   ============================================================ */

import JSZip from 'jszip'

/* ---------- helpers ---------- */
function strip(html) { return (html || '').replace(/<[^>]+>/g, ''); }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* ---------- block → HTML renderers (vanilla, no React) ---------- */

function renderHeading(b) {
  const Tag = b.level === 'h3' ? 'h3' : 'h2';
  const eyebrow = b.eyebrow ? `<div class="eyebrow"><span class="dot"></span><span>${b.eyebrow}</span></div>` : '';
  return `<div class="blk-heading">${eyebrow}<${Tag}>${b.text || ''}</${Tag}></div>`;
}

function renderText(b) {
  return `<div class="blk-text">${b.html || ''}</div>`;
}

function renderImage(b) {
  if (!b.src) return '';
  const cap = b.caption ? `<figcaption>${b.caption}</figcaption>` : '';
  return `<div class="blk-image"><figure><img src="${esc(b.src)}" alt="${esc(b.alt || '')}" />${cap}</figure></div>`;
}

function renderEmbed(b) {
  let inner = '';
  if (b.mode === 'upload' && b.upload) {
    inner = `<video src="${esc(b.upload)}" controls></video>`;
  } else if (b.mode === 'code' && b.code) {
    inner = b.code;
  } else if (b.url) {
    let m;
    if ((m = b.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)))
      inner = `<iframe src="https://www.youtube.com/embed/${m[1]}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    else if ((m = b.url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      inner = `<iframe src="https://player.vimeo.com/video/${m[1]}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    else if (/\.(mp4|webm|ogg)/i.test(b.url))
      inner = `<video src="${esc(b.url)}" controls></video>`;
    else
      inner = `<iframe src="${esc(b.url)}" allowfullscreen></iframe>`;
  }
  if (!inner) return '';
  const cap = b.caption ? `<div class="embed-caption">${b.caption}</div>` : '';
  return `<div class="blk-embed"><div class="embed-frame">${inner}</div>${cap}</div>`;
}

function renderStatement(b) {
  const COLORS = { indigo: '#26235D', blue: '#2E79BB', green: '#6CC049', magenta: '#DE1B54', orange: '#F99F42' };
  const color = COLORS[b.accent] || COLORS.indigo;
  if (b.variant === 'quote') {
    return `<div class="blk-statement"><div class="statement quote" style="--accent:${color}">${b.text || ''}</div></div>`;
  }
  const label = b.label ? `<div class="statement__label">${b.label}</div>` : '';
  const title = b.title ? `<div class="statement__title">${b.title}</div>` : '';
  return `<div class="blk-statement"><div class="statement callout" style="--accent:${color}">${label}${title}<div class="statement__text">${b.text || ''}</div></div></div>`;
}

function renderFlip(b, bid) {
  const COLORS = { indigo: '#26235D', blue: '#2E79BB', green: '#6CC049', magenta: '#DE1B54', orange: '#F99F42' };
  const cards = (b.cards || []).map((c, i) => {
    const color = COLORS[c.accent] || COLORS.blue;
    const kicker = c.kicker ? `<div class="flip__kicker">${c.kicker}</div>` : '';
    return `
      <button type="button" class="flip" style="--cardaccent:${color}" onclick="this.classList.toggle('is-flipped')" aria-label="${esc(strip(c.front))}">
        <div class="flip__inner">
          <div class="flip__face flip__front">
            <div class="flip__title">${c.front || ''}</div>
            <div class="flip__hint">Tap to flip</div>
          </div>
          <div class="flip__face flip__back">
            ${kicker}
            <div class="flip__backtitle">${c.front || ''}</div>
            <p>${c.back || ''}</p>
          </div>
        </div>
      </button>`;
  }).join('');
  return `<div class="blk-flip"><div class="flipgrid">${cards}</div></div>`;
}

function renderTabs(b, bid) {
  const items = b.items || [];
  const tabBtns = items.map((t, i) =>
    `<button type="button" class="tab${i === 0 ? ' is-active' : ''}" onclick="switchTab('${bid}',${i})">${t.label || ''}</button>`
  ).join('');
  const panels = items.map((t, i) =>
    `<div class="tabpanel" id="${bid}-tab-${i}" style="display:${i === 0 ? 'block' : 'none'}">${t.html || ''}</div>`
  ).join('');
  return `<div class="blk-tabs" id="${bid}"><div class="tabs__list">${tabBtns}</div>${panels}</div>`;
}

function renderAccordion(b, bid) {
  const COLORS = { indigo: '#26235D', blue: '#2E79BB', green: '#6CC049', magenta: '#DE1B54', orange: '#F99F42' };
  const color = COLORS[b.accent] || COLORS.indigo;
  const items = (b.items || []).map((it, i) => {
    const sub = it.sub ? `<span class="acc__sub">${it.sub}</span>` : '';
    return `
      <div class="acc" id="${bid}-acc-${i}">
        <button type="button" class="acc__head" onclick="toggleAcc('${bid}-acc-${i}')">
          <span class="acc__marker"></span>
          <span class="acc__htext"><span class="acc__title">${it.title || ''}</span>${sub}</span>
          <span class="acc__chev">▾</span>
        </button>
        <div class="acc__body"><div class="acc__bodyinner"><div class="acc__content">${it.html || ''}</div></div></div>
      </div>`;
  }).join('');
  return `<div class="blk-accordion" style="--accent:${color}"><div class="accordion">${items}</div></div>`;
}

function renderMcq(b, bid) {
  const opts = (b.options || []).map((o, i) =>
    `<div class="mc-opt" id="${bid}-opt-${o.id}" onclick="answerMcq('${bid}','${esc(o.id)}','${esc(b.correct || '')}','${esc(o.feedback || '')}',${!!b.graded})">
      <span class="mc-opt__radio"></span>
      <span>${o.text || ''}</span>
    </div>`
  ).join('');
  const tag = b.graded ? 'Knowledge check' : 'Quick check';
  return `
    <div class="blk-mcq">
      <div class="mcq">
        <div class="mcq__tag">${tag}</div>
        <div class="mcq__q">${b.question || ''}</div>
        <div class="mc-opts" id="${bid}-opts">${opts}</div>
        <div class="mc-fb" id="${bid}-fb"></div>
      </div>
    </div>`;
}

function renderDivider(b) {
  if (b.style === 'space') return `<div style="height:40px"></div>`;
  return `<div class="blk-divider"><hr /></div>`;
}

function renderStepper(b, bid) {
  const steps = b.steps || [];
  const dots = steps.map((s, i) =>
    `<button type="button" class="bx-tstep${i === 0 ? ' is-active' : ''}" id="${bid}-dot-${i}" onclick="gotoStep('${bid}',${i},${steps.length})"
      aria-label="${esc(strip(s.name))}">
      <span class="bx-tstep__line"></span>
      <span class="bx-tstep__dot"></span>
      <span class="bx-tstep__name">${s.name || ''}</span>
    </button>`
  ).join('');
  const panels = steps.map((s, i) => {
    const agent = s.agent ? `<div class="bx-tdetail__agent"><div class="bx-flab">Agent relevance</div><p>${s.agent}</p></div>` : '';
    return `<div class="bx-tdetail" id="${bid}-panel-${i}" style="display:${i === 0 ? 'flex' : 'none'}">
      <div>
        <div class="bx-tdetail__num">Stage ${String(i + 1).padStart(2, '0')} · What happens</div>
        <h3>${s.name || ''}</h3>
        <p>${s.what || ''}</p>
      </div>${agent}
    </div>`;
  }).join('');
  return `
    <div class="blk-stepper" id="${bid}">
      <div class="bx-timeline">${dots}</div>
      ${panels}
      <div class="bx-stepnav">
        <button class="bx-btn ghost" id="${bid}-prev" onclick="gotoStep('${bid}',-1,${steps.length})" disabled>← Previous</button>
        <button class="bx-btn primary" id="${bid}-next" onclick="gotoStep('${bid}',1,${steps.length})" ${steps.length <= 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>`;
}

function renderHotspots(b, bid) {
  const nodes = b.nodes || [];
  const intro = b.intro ? `<div class="bx-hsintro">${b.intro}</div>` : '';
  const flow = nodes.map((n, i) => {
    const arr = i > 0 ? `<span class="bx-hsarrow">→</span>` : '';
    return `${arr}<div class="bx-hsnode">
      <button type="button" class="bx-hsbtn" id="${bid}-hs-${n.id}" onclick="selectHotspot('${bid}','${esc(n.id)}')" aria-label="${esc(strip(n.label))}">●</button>
      <span class="bx-hslabel">${n.label || ''}</span>
    </div>`;
  }).join('');
  const panels = nodes.map(n => {
    const layer = n.layer ? `<div class="bx-hslayer">${n.layer}</div>` : '';
    return `<div id="${bid}-hsinfo-${n.id}" style="display:none">${layer}<h4>${n.title || ''}</h4><p>${n.body || ''}</p></div>`;
  }).join('');
  return `
    <div class="blk-hotspots" id="${bid}">
      ${intro}
      <div class="bx-hsflow">${flow}</div>
      <div class="bx-hsinfo">
        <div id="${bid}-hsempty" class="bx-hsempty">Tap any point above to see details.</div>
        ${panels}
      </div>
    </div>`;
}

function renderGlossary(b, bid) {
  const terms = b.terms || [];
  const rows = terms.map(t =>
    `<div class="bx-term" data-search="${esc((strip(t.term) + ' ' + strip(t.def)).toLowerCase())}">
      <div class="bx-term__t">${t.term || ''}</div>
      <div class="bx-term__d">${t.def || ''}</div>
    </div>`
  ).join('');
  return `
    <div class="blk-glossary" id="${bid}">
      <div class="bx-gsearch">
        <input type="text" placeholder="Search terms…" oninput="filterGlossary('${bid}',this.value)" aria-label="Search glossary" />
      </div>
      <div class="bx-glist" id="${bid}-list">${rows}</div>
    </div>`;
}

function renderMatching(b, bid) {
  const opts = b.optionsList || [];
  const rows = (b.rows || []).map(r => {
    const optHtml = opts.map(o => `<option value="${esc(o.id)}">${esc(strip(o.label))}</option>`).join('');
    return `<div class="bx-mrow" id="${bid}-mrow-${r.id}">
      <div class="bx-mrow__q">${r.q || ''}</div>
      <select class="bx-select" onchange="setMatchVal('${bid}','${esc(r.id)}',this.value)">
        <option value="">Choose…</option>${optHtml}
      </select>
    </div>`;
  }).join('');
  const correctMap = JSON.stringify(Object.fromEntries((b.rows || []).map(r => [r.id, r.correct])));
  return `
    <div class="blk-kc" id="${bid}">
      <div class="bx-kc">
        <div class="bx-kc__tag">Matching</div>
        <div class="bx-kc__instr">${b.instr || ''}</div>
        <div id="${bid}-rows">${rows}</div>
        <input type="hidden" id="${bid}-correct" value='${esc(correctMap)}' />
        <div class="bx-kc__actions">
          <button class="bx-btn primary" onclick="checkMatching('${bid}',${b.rows ? b.rows.length : 0})">Check answers</button>
          <button class="bx-btn ghost" onclick="resetMatching('${bid}')">↺ Try again</button>
          <span class="bx-kc__result" id="${bid}-result" style="display:none"></span>
        </div>
      </div>
    </div>`;
}

function renderClassify(b, bid) {
  const cats = b.categories || [];
  const items = (b.items || []).map(it => {
    const catHtml = cats.map(c => `<option value="${esc(c.id)}">${esc(strip(c.label))}</option>`).join('');
    return `<div class="bx-citem" id="${bid}-citem-${it.id}">
      <div class="bx-citem__q">${it.q || ''}</div>
      <select class="bx-select" onchange="setClassifyVal('${bid}','${esc(it.id)}',this.value)">
        <option value="">Choose category…</option>${catHtml}
      </select>
      <div class="bx-cfb" id="${bid}-cfb-${it.id}" style="display:none"></div>
    </div>`;
  }).join('');
  const correctMap = JSON.stringify(Object.fromEntries((b.items || []).map(it => [it.id, it.correct])));
  const explainMap = JSON.stringify(Object.fromEntries((b.items || []).map(it => [it.id, it.explain || ''])));
  return `
    <div class="blk-kc" id="${bid}">
      <div class="bx-kc">
        <div class="bx-kc__tag">Classify</div>
        <div class="bx-kc__instr">${b.instr || ''}</div>
        ${items}
        <input type="hidden" id="${bid}-correct" value='${esc(correctMap)}' />
        <input type="hidden" id="${bid}-explain" value='${esc(explainMap)}' />
        <div class="bx-kc__actions">
          <button class="bx-btn primary" onclick="checkClassify('${bid}',${b.items ? b.items.length : 0})">Check answers</button>
          <button class="bx-btn ghost" onclick="resetClassify('${bid}')">↺ Try again</button>
          <span class="bx-kc__result" id="${bid}-result" style="display:none"></span>
        </div>
      </div>
    </div>`;
}

function renderBlock(b) {
  const bid = b.id || ('b' + Math.random().toString(36).slice(2, 7));
  switch (b.type) {
    case 'heading':   return renderHeading(b);
    case 'text':      return renderText(b);
    case 'image':     return renderImage(b);
    case 'embed':     return renderEmbed(b);
    case 'statement': return renderStatement(b);
    case 'flip':      return renderFlip(b, bid);
    case 'tabs':      return renderTabs(b, bid);
    case 'accordion': return renderAccordion(b, bid);
    case 'mcq':       return renderMcq(b, bid);
    case 'divider':   return renderDivider(b);
    case 'stepper':   return renderStepper(b, bid);
    case 'hotspots':  return renderHotspots(b, bid);
    case 'glossary':  return renderGlossary(b, bid);
    case 'matching':  return renderMatching(b, bid);
    case 'classify':  return renderClassify(b, bid);
    default:          return `<div class="blk-text">${b.html || b.text || ''}</div>`;
  }
}

/* ---------- page renderers ---------- */

function renderCoverPage(course, accent) {
  const m = course.meta || {};
  const facts = (m.facts || []).map(f =>
    `<div class="metachip2"><span class="metachip2__k">${f.k || ''}</span><span class="metachip2__v">${f.v || ''}</span></div>`
  ).join('');
  const factsRow = facts ? `<div class="hero2__meta">${facts}</div>` : '';
  const img = m.cover ? `<img class="hero2__img" src="${esc(m.cover)}" alt="" />` : `<div class="hero2__grid"></div>`;
  return `
    <div class="page" id="page-cover">
      <div class="canvas canvas--hero" style="--accent:${accent}">
        <div class="hero2">
          ${img}
          <div class="hero2__inner">
            <div class="hero2__module">${m.kicker || ''}</div>
            <h1 class="hero2__title">${m.title || 'Untitled Course'}</h1>
            <p class="hero2__sub">${m.subtitle || ''}</p>
            ${factsRow}
            <button class="hero2__cta" onclick="startCourse()">Begin the module →</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderLessonPage(lesson, index, isLast, accent) {
  const blocks = (lesson.blocks || []).map(renderBlock).join('\n');
  const prevBtn = index === 0
    ? `<button class="lessonfoot__prev" style="visibility:hidden">← Previous</button>`
    : `<button class="lessonfoot__prev" onclick="navigate(-1)">← Previous</button>`;
  const nextLabel = isLast ? 'Finish course' : 'Complete &amp; continue →';
  return `
    <div class="page" id="page-${lesson.id}" style="display:none">
      <div class="canvas" style="--accent:${accent}">
        <div class="lessonhead">
          <div class="lessonhead__kicker"><span class="dot"></span><span>Lesson ${index + 1}</span></div>
          <h1>${lesson.title || ''}</h1>
        </div>
        <div class="blocks">${blocks}</div>
        <div class="lessonfoot">
          ${prevBtn}
          <span class="lessonfoot__spacer"></span>
          <button class="lessonfoot__cta" onclick="navigate(1)">${nextLabel}</button>
        </div>
      </div>
    </div>`;
}

function renderCompletePage(accent, totalLessons) {
  return `
    <div class="page" id="page-complete" style="display:none">
      <div class="canvas" style="--accent:${accent}">
        <div class="complete">
          <div class="complete__award">🏆</div>
          <h1>Course complete</h1>
          <p class="complete__sub">You've worked through every lesson. Well done!</p>
          <div class="complete__stats">
            <div class="complete__stat"><div class="n" id="stat-done">0/${totalLessons}</div><div class="l">Lessons done</div></div>
            <div class="complete__stat"><div class="n" id="stat-score">—</div><div class="l">Quiz score</div></div>
          </div>
          <div class="complete__actions">
            <button class="btn-ghost" onclick="restartCourse()">↺ Restart course</button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---------- collect graded question data for SCORM scoring ---------- */
function collectGradedQuestions(course) {
  const questions = [];
  for (const lesson of course.lessons || []) {
    for (const b of lesson.blocks || []) {
      if (b.graded) {
        if (b.type === 'mcq' && b.correct) questions.push({ id: b.id, type: 'mcq', correct: b.correct });
        if (b.type === 'matching') (b.rows || []).forEach(r => questions.push({ id: b.id + ':' + r.id, type: 'row', correct: r.correct }));
        if (b.type === 'classify') (b.items || []).forEach(it => questions.push({ id: b.id + ':' + it.id, type: 'item', correct: it.correct }));
      }
    }
  }
  return questions;
}

/* ---------- CSS ---------- */
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --indigo: #26235D; --indigo-dark: #1A1842; --magenta: #DE1B54;
  --blue: #2E79BB; --green: #6CC049; --orange: #F99F42;
  --bg: #F4F5F8; --card: #fff; --text: #1D2230; --gray: #6E7486;
  --accent: #26235D;
  font-family: system-ui, -apple-system, 'Hanken Grotesk', sans-serif;
}
body { background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }

/* layout */
.sidebar { width: 260px; min-width: 260px; background: var(--indigo-dark); color: #fff; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; flex-shrink: 0; }
.sidebar__head { padding: 20px 18px 12px; border-bottom: 1px solid rgba(255,255,255,.1); }
.sidebar__wordmark { font-size: 13px; font-weight: 700; letter-spacing: .04em; opacity: .6; }
.sidebar__title { display: block; font-size: 15px; font-weight: 700; margin-top: 6px; line-height: 1.3; }
.sidebar__progress { padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
.sidebar__ptrack { height: 4px; background: rgba(255,255,255,.15); border-radius: 2px; }
.sidebar__pfill { height: 4px; background: var(--magenta); border-radius: 2px; transition: width .4s; }
.sidebar__pmeta { display: flex; justify-content: space-between; font-size: 11.5px; opacity: .55; margin-top: 5px; }
.lessonlist { flex: 1; padding: 8px 0; }
.navsection { padding: 10px 18px 4px; font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .4; }
.navitem { padding: 8px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13.5px; border-radius: 0; transition: background .15s; }
.navitem:hover { background: rgba(255,255,255,.06); }
.navitem.is-active { background: rgba(255,255,255,.12); }
.navitem.is-done .navitem__check { color: var(--green); }
.navitem__check { width: 16px; min-width: 16px; font-size: 12px; }
.navitem__label { flex: 1; opacity: .85; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { display: flex; align-items: center; gap: 10px; padding: 0 20px; height: 54px; background: #fff; border-bottom: 1px solid #E5E8EE; flex-shrink: 0; }
.topbar__crumb { font-size: 13px; color: var(--gray); }
.topbar__spacer { flex: 1; }
.topbar__pct { font-size: 13px; font-weight: 700; color: var(--accent); }
.scroll { flex: 1; overflow-y: auto; }

/* canvas */
.canvas { max-width: 760px; margin: 0 auto; padding: 36px 32px 80px; }
.canvas--hero { max-width: 100%; padding: 0; }
.lessonhead { margin-bottom: 32px; }
.lessonhead__kicker { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }
.lessonhead h1 { font-size: 2rem; font-weight: 800; line-height: 1.2; }
.blocks { display: flex; flex-direction: column; gap: 24px; }
.lessonfoot { display: flex; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E8EE; }
.lessonfoot__prev { background: none; border: 1.5px solid #D0D5DE; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--gray); }
.lessonfoot__prev:hover { border-color: var(--accent); color: var(--accent); }
.lessonfoot__spacer { flex: 1; }
.lessonfoot__cta { background: var(--accent); color: #fff; border: none; padding: 11px 22px; border-radius: 9px; cursor: pointer; font-size: 14px; font-weight: 700; transition: opacity .15s; }
.lessonfoot__cta:hover { opacity: .88; }

/* hero / cover */
.hero2 { position: relative; min-height: 420px; display: flex; align-items: flex-end; overflow: hidden; }
.hero2__grid { position: absolute; inset: 0; background: var(--indigo-dark); }
.hero2__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero2__inner { position: relative; z-index: 2; padding: 48px 52px; color: #fff; max-width: 700px; }
.hero2__module { font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; opacity: .65; margin-bottom: 10px; }
.hero2__title { font-size: 2.6rem; font-weight: 800; line-height: 1.15; margin-bottom: 12px; }
.hero2__sub { font-size: 1.05rem; opacity: .8; max-width: 520px; margin-bottom: 20px; line-height: 1.6; }
.hero2__meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.metachip2 { background: rgba(255,255,255,.12); border-radius: 6px; padding: 5px 11px; font-size: 12.5px; display: flex; gap: 6px; }
.metachip2__k { opacity: .65; }
.metachip2__v { font-weight: 700; }
.hero2__cta { background: var(--magenta); color: #fff; border: none; padding: 13px 26px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 700; transition: opacity .15s; }
.hero2__cta:hover { opacity: .88; }

/* complete */
.complete { text-align: center; padding: 60px 20px; }
.complete__award { font-size: 52px; margin-bottom: 16px; }
.complete h1 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
.complete__sub { color: var(--gray); max-width: 420px; margin: 0 auto 28px; }
.complete__stats { display: flex; gap: 32px; justify-content: center; margin-bottom: 32px; }
.complete__stat .n { font-size: 2rem; font-weight: 800; color: var(--accent); }
.complete__stat .l { font-size: 13px; color: var(--gray); }
.complete__actions { display: flex; gap: 12px; justify-content: center; }
.btn-ghost { background: none; border: 1.5px solid #D0D5DE; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--gray); }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* blocks */
.blk-heading { margin-bottom: 4px; }
.blk-heading h2 { font-size: 1.65rem; font-weight: 800; }
.blk-heading h3 { font-size: 1.25rem; font-weight: 700; }
.eyebrow { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
.blk-text { font-size: 1rem; line-height: 1.7; color: #2D3247; }
.blk-text p { margin-bottom: .9em; }
.blk-text ul, .blk-text ol { margin: .5em 0 .9em 1.4em; }
.blk-image figure { text-align: center; }
.blk-image img { max-width: 100%; border-radius: 10px; }
.blk-image figcaption { font-size: 13px; color: var(--gray); margin-top: 8px; }
.blk-embed .embed-frame { position: relative; padding-bottom: 56.25%; height: 0; background: #000; border-radius: 10px; overflow: hidden; }
.blk-embed .embed-frame iframe, .blk-embed .embed-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.embed-caption { font-size: 13px; color: var(--gray); margin-top: 8px; }

/* statement / callout */
.statement { padding: 18px 22px; border-radius: 10px; border-left: 4px solid var(--accent); background: color-mix(in srgb, var(--accent) 6%, #fff); }
.statement__label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.statement__title { font-weight: 700; margin-bottom: 6px; }
.statement.quote { border-left-color: var(--accent); font-size: 1.1rem; font-style: italic; }

/* flip cards */
.flipgrid { display: flex; flex-wrap: wrap; gap: 14px; }
.flip { width: 180px; min-height: 160px; perspective: 900px; background: none; border: none; cursor: pointer; padding: 0; }
.flip__inner { position: relative; width: 100%; height: 160px; transform-style: preserve-3d; transition: transform .45s; }
.flip.is-flipped .flip__inner { transform: rotateY(180deg); }
.flip__face { position: absolute; inset: 0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: center; backface-visibility: hidden; }
.flip__front { background: color-mix(in srgb, var(--cardaccent) 10%, #fff); border: 1.5px solid color-mix(in srgb, var(--cardaccent) 20%, #fff); }
.flip__back { background: var(--cardaccent); color: #fff; transform: rotateY(180deg); }
.flip__title { font-weight: 700; font-size: 15px; }
.flip__hint { font-size: 11px; opacity: .5; margin-top: 8px; }
.flip__kicker { font-size: 10px; opacity: .7; margin-bottom: 4px; letter-spacing: .06em; text-transform: uppercase; }
.flip__backtitle { font-weight: 700; font-size: 13px; margin-bottom: 6px; opacity: .85; }
.flip__back p { font-size: 13px; opacity: .9; line-height: 1.5; }

/* tabs */
.tabs__list { display: flex; gap: 0; border-bottom: 2px solid #E5E8EE; margin-bottom: 16px; }
.tab { background: none; border: none; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--gray); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .15s; }
.tab.is-active { color: var(--accent); border-bottom-color: var(--accent); }
.tabpanel { font-size: 15px; line-height: 1.7; }

/* accordion */
.acc { border: 1.5px solid #E5E8EE; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
.acc__head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 13px 16px; background: #fff; border: none; cursor: pointer; text-align: left; font-size: 14.5px; font-weight: 600; }
.acc__head:hover { background: #F9FAFB; }
.acc__marker { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.acc__htext { flex: 1; }
.acc__sub { display: block; font-size: 12.5px; font-weight: 400; color: var(--gray); }
.acc__chev { font-size: 16px; transition: transform .25s; opacity: .5; }
.acc.is-open .acc__chev { transform: rotate(180deg); }
.acc__body { max-height: 0; overflow: hidden; transition: max-height .3s ease; }
.acc.is-open .acc__body { max-height: 600px; }
.acc__bodyinner { padding: 12px 16px 16px 36px; }
.acc__content { font-size: 14.5px; line-height: 1.7; }

/* mcq */
.mcq { background: #fff; border: 1.5px solid #E5E8EE; border-radius: 12px; padding: 22px 24px; }
.mcq__tag { font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--magenta); margin-bottom: 10px; }
.mcq__q { font-size: 16px; font-weight: 700; margin-bottom: 16px; line-height: 1.4; }
.mc-opts { display: flex; flex-direction: column; gap: 8px; }
.mc-opt { display: flex; align-items: flex-start; gap: 12px; padding: 11px 14px; border: 1.5px solid #E5E8EE; border-radius: 8px; cursor: pointer; transition: border-color .15s, background .15s; }
.mc-opt:hover:not(.is-answered) { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, #fff); }
.mc-opt__radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #C7CBD6; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
.mc-opt.is-correct .mc-opt__radio { background: var(--green); border-color: var(--green); color: #fff; }
.mc-opt.is-wrong .mc-opt__radio { background: var(--magenta); border-color: var(--magenta); color: #fff; }
.mc-opt.is-correct { border-color: var(--green); background: color-mix(in srgb, var(--green) 8%, #fff); }
.mc-opt.is-wrong { border-color: var(--magenta); background: color-mix(in srgb, var(--magenta) 8%, #fff); }
.mc-opt.is-dim { opacity: .45; }
.mc-fb { font-size: 14px; margin-top: 14px; padding: 10px 14px; border-radius: 8px; display: none; }
.mc-fb.show { display: block; }
.mc-fb.ok { background: color-mix(in srgb, var(--green) 12%, #fff); color: #1a5e2a; }
.mc-fb.no { background: color-mix(in srgb, var(--magenta) 10%, #fff); color: #8a1032; }

/* divider */
.blk-divider hr { border: none; border-top: 1.5px solid #E5E8EE; }

/* stepper */
.bx-timeline { display: flex; gap: 0; margin-bottom: 0; overflow-x: auto; }
.bx-tstep { display: flex; flex-direction: column; align-items: center; flex: 1; background: none; border: none; cursor: pointer; padding: 10px 8px; position: relative; min-width: 80px; }
.bx-tstep__line { position: absolute; top: 22px; left: 50%; width: 100%; height: 2px; background: #E5E8EE; z-index: 0; }
.bx-tstep:last-child .bx-tstep__line { display: none; }
.bx-tstep__dot { width: 32px; height: 32px; border-radius: 50%; background: #E5E8EE; border: 2px solid #E5E8EE; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; font-size: 13px; }
.bx-tstep.is-active .bx-tstep__dot { background: var(--accent); border-color: var(--accent); color: #fff; }
.bx-tstep.is-active .bx-tstep__line { background: var(--accent); }
.bx-tstep__name { font-size: 11.5px; font-weight: 600; margin-top: 6px; text-align: center; color: var(--gray); }
.bx-tstep.is-active .bx-tstep__name { color: var(--accent); }
.bx-tdetail { background: #fff; border: 1.5px solid #E5E8EE; border-radius: 12px; padding: 20px 22px; margin-top: 14px; display: flex; gap: 20px; flex-wrap: wrap; }
.bx-tdetail__num { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.bx-tdetail h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.bx-tdetail p { font-size: 14.5px; line-height: 1.6; color: var(--gray); }
.bx-tdetail__agent { background: color-mix(in srgb, var(--accent) 6%, #fff); padding: 14px; border-radius: 8px; min-width: 180px; }
.bx-flab { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.bx-stepnav { display: flex; gap: 10px; margin-top: 14px; }
.bx-btn { padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; border: none; transition: opacity .15s; }
.bx-btn.primary { background: var(--accent); color: #fff; }
.bx-btn.ghost { background: none; border: 1.5px solid #D0D5DE; color: var(--gray); }
.bx-btn:disabled { opacity: .35; cursor: default; }

/* hotspots */
.bx-hsintro { font-size: 14.5px; color: var(--gray); margin-bottom: 14px; }
.bx-hsflow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.bx-hsnode { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.bx-hsbtn { width: 42px; height: 42px; border-radius: 50%; background: var(--accent); color: #fff; border: 3px solid #fff; box-shadow: 0 0 0 2px var(--accent); cursor: pointer; font-size: 18px; transition: transform .15s; }
.bx-hsbtn:hover, .bx-hsbtn.is-active { transform: scale(1.15); }
.bx-hslabel { font-size: 11.5px; font-weight: 600; color: var(--gray); text-align: center; max-width: 70px; }
.bx-hsarrow { font-size: 20px; color: #C7CBD6; }
.bx-hsinfo { min-height: 80px; background: #fff; border: 1.5px solid #E5E8EE; border-radius: 12px; padding: 18px 20px; }
.bx-hsempty { color: var(--gray); font-size: 14px; }
.bx-hslayer { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.bx-hsinfo h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.bx-hsinfo p { font-size: 14.5px; line-height: 1.6; color: var(--gray); }

/* glossary */
.bx-gsearch { display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid #E5E8EE; border-radius: 9px; padding: 9px 14px; margin-bottom: 12px; }
.bx-gsearch input { border: none; outline: none; flex: 1; font-size: 14.5px; }
.bx-glist { display: flex; flex-direction: column; gap: 8px; }
.bx-term { background: #fff; border: 1.5px solid #E5E8EE; border-radius: 9px; padding: 13px 16px; }
.bx-term__t { font-weight: 700; margin-bottom: 4px; }
.bx-term__d { font-size: 14px; color: var(--gray); line-height: 1.5; }

/* matching / classify */
.bx-kc { background: #fff; border: 1.5px solid #E5E8EE; border-radius: 12px; padding: 22px 24px; }
.bx-kc__tag { font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--blue); margin-bottom: 10px; }
.bx-kc__instr { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.bx-mrow { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F0F1F5; flex-wrap: wrap; }
.bx-mrow__q { flex: 1; min-width: 200px; font-size: 14.5px; }
.bx-mrow.is-correct .bx-select { border-color: var(--green); background: color-mix(in srgb, var(--green) 8%, #fff); }
.bx-mrow.is-wrong .bx-select { border-color: var(--magenta); background: color-mix(in srgb, var(--magenta) 8%, #fff); }
.bx-citem { margin-bottom: 14px; }
.bx-citem__q { font-size: 14.5px; margin-bottom: 6px; }
.bx-select { border: 1.5px solid #D0D5DE; border-radius: 7px; padding: 7px 10px; font-size: 14px; background: #fff; }
.bx-kc__actions { display: flex; align-items: center; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.bx-kc__result { font-size: 13.5px; font-weight: 700; }
.bx-kc__result.ok { color: var(--green); }
.bx-kc__result.partial { color: var(--orange); }
.bx-cfb { padding: 8px 12px; border-radius: 7px; font-size: 13.5px; margin-top: 6px; }
.bx-cfb.ok { background: color-mix(in srgb, var(--green) 10%, #fff); color: #1a5e2a; }
.bx-cfb.no { background: color-mix(in srgb, var(--magenta) 8%, #fff); color: #8a1032; }
`;

/* ---------- interactive JS (runs in the SCORM HTML) ---------- */
const JS = `
var _cur = 0;
var _pages = [];
var _done = {};
var _scores = { correct: 0, total: 0 };
var _gradedQ = {};
var _api = null;

function findApi(w) {
  var depth = 0;
  while (w && depth < 7) {
    if (w.API) return w.API;
    w = (w.parent !== w) ? w.parent : null;
    depth++;
  }
  return null;
}

function scormInit() {
  try {
    _api = findApi(window);
    if (_api) _api.LMSInitialize('');
  } catch(e) {}
}

function scormFinish(passed, score) {
  try {
    if (!_api) return;
    _api.LMSSetValue('cmi.core.lesson_status', passed ? 'passed' : 'completed');
    if (score >= 0) _api.LMSSetValue('cmi.core.score.raw', String(Math.round(score)));
    _api.LMSCommit('');
    _api.LMSFinish('');
  } catch(e) {}
}

function showPage(idx) {
  _pages.forEach(function(p, i) {
    document.getElementById(p).style.display = i === idx ? '' : 'none';
  });
  _cur = idx;
  updateNav();
  updateProgress();
  window.scrollTo && window.scrollTo(0, 0);
  var el = document.querySelector('.scroll');
  if (el) el.scrollTop = 0;
}

function updateNav() {
  document.querySelectorAll('.navitem').forEach(function(el, i) {
    el.classList.toggle('is-active', i === _cur - 1);
    if (_done[i]) el.classList.add('is-done');
  });
}

function updateProgress() {
  var total = _pages.length - 2;
  var done = Object.keys(_done).length;
  var pct = total > 0 ? Math.round(done / total * 100) : 0;
  var fill = document.querySelector('.sidebar__pfill');
  if (fill) fill.style.width = pct + '%';
  var metas = document.querySelectorAll('.sidebar__pmeta span');
  if (metas[0]) metas[0].textContent = pct + '% complete';
  if (metas[1]) metas[1].textContent = done + ' / ' + total + ' lessons';
  var pctEl = document.querySelector('.topbar__pct');
  if (pctEl) pctEl.textContent = pct + '%';
}

function startCourse() { showPage(1); }

function navigate(dir) {
  if (dir === 1 && _cur > 0 && _cur <= _pages.length - 2) {
    _done[_cur - 1] = true;
  }
  var next = _cur + dir;
  if (next < 0 || next >= _pages.length) return;
  if (next === _pages.length - 1) {
    // completion
    var total = _pages.length - 2;
    var done = Object.keys(_done).length;
    var scoreEl = document.getElementById('stat-score');
    var doneEl = document.getElementById('stat-done');
    if (doneEl) doneEl.textContent = done + '/' + total;
    if (scoreEl) scoreEl.textContent = _scores.total > 0
      ? Math.round((_scores.correct / _scores.total) * 100) + '%' : 'N/A';
    var scoreVal = _scores.total > 0 ? Math.round((_scores.correct / _scores.total) * 100) : -1;
    scormFinish(true, scoreVal);
  }
  showPage(next);
}

function restartCourse() {
  _cur = 0; _done = {}; _scores = { correct: 0, total: 0 };
  showPage(0);
}

/* tabs */
function switchTab(bid, idx) {
  var el = document.getElementById(bid);
  if (!el) return;
  el.querySelectorAll('.tab').forEach(function(t, i) { t.classList.toggle('is-active', i === idx); });
  el.querySelectorAll('.tabpanel').forEach(function(p, i) { p.style.display = i === idx ? 'block' : 'none'; });
}

/* accordion */
function toggleAcc(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('is-open');
}

/* mcq */
var _mcqAnswered = {};
function answerMcq(bid, optId, correct, feedback, graded) {
  if (_mcqAnswered[bid]) return;
  _mcqAnswered[bid] = optId;
  var opts = document.getElementById(bid + '-opts');
  if (!opts) return;
  opts.querySelectorAll('.mc-opt').forEach(function(el) {
    var oid = el.id.replace(bid + '-opt-', '');
    el.classList.add('is-answered');
    if (oid === correct) el.classList.add('is-correct');
    else if (oid === optId) el.classList.add('is-wrong');
    else el.classList.add('is-dim');
    var radio = el.querySelector('.mc-opt__radio');
    if (radio && (oid === correct || oid === optId)) radio.textContent = oid === correct ? '✓' : '✗';
  });
  var fb = document.getElementById(bid + '-fb');
  var ok = optId === correct;
  if (fb) {
    fb.className = 'mc-fb show ' + (ok ? 'ok' : 'no');
    fb.innerHTML = '<b>' + (ok ? 'Correct. ' : 'Not quite. ') + '</b>' + feedback;
  }
  if (graded) {
    _scores.total++;
    if (ok) _scores.correct++;
  }
}

/* stepper */
var _stepCur = {};
function gotoStep(bid, dir, total) {
  if (!_stepCur[bid]) _stepCur[bid] = 0;
  var next;
  if (dir === -1 || dir === 1) next = _stepCur[bid] + dir;
  else next = dir;
  next = Math.max(0, Math.min(next, total - 1));
  _stepCur[bid] = next;
  for (var i = 0; i < total; i++) {
    var dot = document.getElementById(bid + '-dot-' + i);
    var panel = document.getElementById(bid + '-panel-' + i);
    if (dot) dot.className = 'bx-tstep' + (i <= next ? ' is-active' : '');
    if (panel) panel.style.display = i === next ? 'flex' : 'none';
  }
  var prev = document.getElementById(bid + '-prev');
  var nxt = document.getElementById(bid + '-next');
  if (prev) prev.disabled = next === 0;
  if (nxt) nxt.disabled = next === total - 1;
}

/* hotspots */
var _hsActive = {};
function selectHotspot(bid, nodeId) {
  var prev = _hsActive[bid];
  if (prev) {
    var pb = document.getElementById(bid + '-hs-' + prev);
    var pi = document.getElementById(bid + '-hsinfo-' + prev);
    if (pb) pb.classList.remove('is-active');
    if (pi) pi.style.display = 'none';
  }
  if (prev === nodeId) { _hsActive[bid] = null; document.getElementById(bid + '-hsempty').style.display = ''; return; }
  _hsActive[bid] = nodeId;
  var btn = document.getElementById(bid + '-hs-' + nodeId);
  var info = document.getElementById(bid + '-hsinfo-' + nodeId);
  var empty = document.getElementById(bid + '-hsempty');
  if (btn) btn.classList.add('is-active');
  if (info) info.style.display = 'block';
  if (empty) empty.style.display = 'none';
}

/* glossary */
function filterGlossary(bid, q) {
  q = q.trim().toLowerCase();
  var list = document.getElementById(bid + '-list');
  if (!list) return;
  list.querySelectorAll('.bx-term').forEach(function(t) {
    t.style.display = (!q || t.dataset.search.indexOf(q) !== -1) ? '' : 'none';
  });
}

/* matching */
var _matchVals = {};
function setMatchVal(bid, rowId, val) {
  if (!_matchVals[bid]) _matchVals[bid] = {};
  _matchVals[bid][rowId] = val;
}
function checkMatching(bid, totalRows) {
  var correctEl = document.getElementById(bid + '-correct');
  if (!correctEl) return;
  var correct = JSON.parse(correctEl.value);
  var vals = _matchVals[bid] || {};
  var ok = 0;
  Object.keys(correct).forEach(function(rowId) {
    var row = document.getElementById(bid + '-mrow-' + rowId);
    if (!row) return;
    var isOk = vals[rowId] === correct[rowId];
    if (isOk) ok++;
    row.classList.toggle('is-correct', isOk);
    row.classList.toggle('is-wrong', !isOk);
  });
  var res = document.getElementById(bid + '-result');
  if (res) {
    res.style.display = '';
    res.className = 'bx-kc__result ' + (ok === totalRows ? 'ok' : 'partial');
    res.textContent = ok + ' / ' + totalRows + ' correct';
  }
}
function resetMatching(bid) {
  _matchVals[bid] = {};
  var el = document.getElementById(bid);
  if (!el) return;
  el.querySelectorAll('.bx-mrow').forEach(function(r) { r.classList.remove('is-correct', 'is-wrong'); });
  el.querySelectorAll('.bx-select').forEach(function(s) { s.value = ''; });
  var res = document.getElementById(bid + '-result');
  if (res) res.style.display = 'none';
}

/* classify */
var _classifyVals = {};
function setClassifyVal(bid, itemId, val) {
  if (!_classifyVals[bid]) _classifyVals[bid] = {};
  _classifyVals[bid][itemId] = val;
}
function checkClassify(bid, totalItems) {
  var correctEl = document.getElementById(bid + '-correct');
  var explainEl = document.getElementById(bid + '-explain');
  if (!correctEl) return;
  var correct = JSON.parse(correctEl.value);
  var explains = explainEl ? JSON.parse(explainEl.value) : {};
  var vals = _classifyVals[bid] || {};
  var ok = 0;
  Object.keys(correct).forEach(function(itemId) {
    var isOk = vals[itemId] === correct[itemId];
    if (isOk) ok++;
    var fb = document.getElementById(bid + '-cfb-' + itemId);
    if (fb) {
      fb.style.display = '';
      fb.className = 'bx-cfb ' + (isOk ? 'ok' : 'no');
      fb.innerHTML = '<b>' + (isOk ? 'Correct. ' : 'Review: ') + '</b>' + (explains[itemId] || '');
    }
  });
  var res = document.getElementById(bid + '-result');
  if (res) {
    res.style.display = '';
    res.className = 'bx-kc__result ' + (ok === totalItems ? 'ok' : 'partial');
    res.textContent = ok + ' / ' + totalItems + ' correct';
  }
}
function resetClassify(bid) {
  _classifyVals[bid] = {};
  var el = document.getElementById(bid);
  if (!el) return;
  el.querySelectorAll('.bx-cfb').forEach(function(f) { f.style.display = 'none'; });
  el.querySelectorAll('.bx-select').forEach(function(s) { s.value = ''; });
  var res = document.getElementById(bid + '-result');
  if (res) res.style.display = 'none';
}

window.addEventListener('load', scormInit);
`;

/* ---------- full HTML generator ---------- */
function generateScormHtml(course) {
  const COLORS = { indigo: '#26235D', blue: '#2E79BB', green: '#6CC049', magenta: '#DE1B54', orange: '#F99F42' };
  const accent = COLORS[course.meta && course.meta.accent] || COLORS.indigo;
  const lessons = (course.lessons || []).filter(l => l.kind === 'lesson');
  const totalLessons = lessons.length;
  const title = strip(course.meta && course.meta.title || 'Course');

  // sidebar nav items (one per lesson, no sections in the SCORM player nav)
  const navItems = lessons.map((l, i) =>
    `<div class="navitem" onclick="showPage(${i + 1})">
      <span class="navitem__check" id="nav-check-${i}"></span>
      <span class="navitem__label">${strip(l.title || 'Lesson ' + (i + 1))}</span>
    </div>`
  ).join('');

  // pages
  const coverHtml = renderCoverPage(course, accent);
  const lessonHtmls = lessons.map((l, i) => renderLessonPage(l, i, i === lessons.length - 1, accent)).join('\n');
  const completeHtml = renderCompletePage(accent, totalLessons);

  // page ids list for JS
  const pageIds = ['page-cover', ...lessons.map(l => 'page-' + l.id), 'page-complete'];
  const pageIdsJs = JSON.stringify(pageIds);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<aside class="sidebar">
  <div class="sidebar__head">
    <span class="sidebar__wordmark">Course Architect</span>
    <div class="sidebar__title">${esc(title)}</div>
  </div>
  <div class="sidebar__progress">
    <div class="sidebar__ptrack"><div class="sidebar__pfill" style="width:0%"></div></div>
    <div class="sidebar__pmeta"><span>0% complete</span><span>0 / ${totalLessons} lessons</span></div>
  </div>
  <nav class="lessonlist">${navItems}</nav>
</aside>
<div class="main">
  <header class="topbar">
    <div class="topbar__crumb">${esc(title)}</div>
    <span class="topbar__spacer"></span>
    <span class="topbar__pct">0%</span>
  </header>
  <div class="scroll">
    ${coverHtml}
    ${lessonHtmls}
    ${completeHtml}
  </div>
</div>
<script>
${JS}
_pages = ${pageIdsJs};
</script>
</body>
</html>`;
}

/* ---------- SCORM 1.2 manifest ---------- */
function buildManifest(course) {
  const title = strip(course.meta && course.meta.title || 'Course');
  const id = 'ca_' + (course.meta && course.meta.libraryId || Math.random().toString(36).slice(2, 9));
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${esc(id)}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${esc(title)}</title>
      <item identifier="item1" identifierref="res1">
        <title>${esc(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;
}

/* ---------- main export function ---------- */
async function exportScorm(course) {
  const title = strip(course.meta && course.meta.title || 'course');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const html = generateScormHtml(course);
  const manifest = buildManifest(course);

  const zip = new JSZip();
  zip.file('imsmanifest.xml', manifest);
  zip.file('index.html', html);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = slug + '-scorm12.zip';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

Object.assign(window, { exportScorm });

export {};
