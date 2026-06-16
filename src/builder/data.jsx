/* ============================================================
   Course Builder — data model, storage, icons, block factory
   ============================================================ */

const STORE_KEY = 'sutherland_course_builder_v4';
const PROGRESS_KEY = 'sutherland_course_progress_v4';

function uid(prefix) {
  return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9);
}

/* ---------- persistence ---------- */
function loadCourse() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultCourse();
}
function saveCourse(course) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(course)); } catch (e) {}
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { completed: {}, answers: {} };
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
}

/* ---------- accent palette (brand) ---------- */
const ACCENTS = [
  { key: 'blue',    color: '#2E79BB' },
  { key: 'magenta', color: '#DE1B54' },
  { key: 'green',   color: '#57a93c' },
  { key: 'orange',  color: '#ef8f2f' },
  { key: 'indigo',  color: '#26235D' },
  { key: 'slate',   color: '#3a4358' },
];
function accentColor(key) {
  const a = ACCENTS.find(x => x.key === key);
  return a ? a.color : '#2E79BB';
}

/* ---------- block factory ---------- */
function newBlock(type) {
  const id = uid('b');
  switch (type) {
    case 'heading':
      return { id, type, level: 'h2', text: 'New heading', eyebrow: '' };
    case 'text':
      return { id, type, html: 'Start writing. Click to edit this text — you can <strong>bold</strong> with the toolbar, or just type.' };
    case 'image':
      return { id, type, src: '', alt: '', caption: '' };
    case 'embed':
      return { id, type, mode: 'video', url: '', code: '', upload: '', caption: '' };
    case 'statement':
      return { id, type, variant: 'callout', accent: 'blue', label: 'Note', title: 'Make a point', text: 'Use a statement to emphasise an idea, give an example, or pull out a key quote.' };
    case 'flip':
      return { id, type, cards: [
        { id: uid('c'), accent: 'blue',    icon: 'layers', kicker: '', front: 'Term one', back: 'The explanation that appears when a learner flips this card.' },
        { id: uid('c'), accent: 'magenta', icon: 'zap',    kicker: '', front: 'Term two', back: 'Another definition. Add or remove cards as you need.' },
      ] };
    case 'tabs':
      return { id, type, items: [
        { id: uid('t'), label: 'Tab one', html: 'Content for the first tab.' },
        { id: uid('t'), label: 'Tab two', html: 'Content for the second tab.' },
      ] };
    case 'accordion':
      return { id, type, accent: 'orange', items: [
        { id: uid('a'), title: 'First item', sub: '', html: 'Hidden content that expands when clicked.' },
        { id: uid('a'), title: 'Second item', sub: '', html: 'Another collapsible row.' },
      ] };
    case 'mcq':
      return { id, type, question: 'Ask a question here.', graded: true,
        options: [
          { id: uid('o'), text: 'First option', feedback: 'Feedback shown when this option is chosen.' },
          { id: uid('o'), text: 'Second option', feedback: 'Feedback shown when this option is chosen.' },
          { id: uid('o'), text: 'Third option', feedback: 'Feedback shown when this option is chosen.' },
        ],
        correct: null };
    case 'stepper':
      return { id, type, steps: [
        { id: uid('s'), icon: 'building', name: 'Stage one',   what: 'Describe what happens at this stage.', agent: 'Why this stage matters to the agent.' },
        { id: uid('s'), icon: 'clock',    name: 'Stage two',   what: 'Describe what happens at this stage.', agent: 'Why this stage matters to the agent.' },
        { id: uid('s'), icon: 'check',    name: 'Stage three', what: 'Describe what happens at this stage.', agent: 'Why this stage matters to the agent.' },
      ] };
    case 'hotspots':
      return { id, type, intro: 'Tap each point to see what is happening at that step.', nodes: [
        { id: uid('h'), icon: 'smartphone', label: 'Step one',   layer: 'Category', title: 'Headline for step one',   body: 'What happens at this point and why it matters.' },
        { id: uid('h'), icon: 'radio',      label: 'Step two',   layer: 'Category', title: 'Headline for step two',   body: 'What happens at this point and why it matters.' },
        { id: uid('h'), icon: 'server',     label: 'Step three', layer: 'Category', title: 'Headline for step three', body: 'What happens at this point and why it matters.' },
      ] };
    case 'glossary':
      return { id, type, terms: [
        { id: uid('g'), term: 'First term',  def: 'Definition of the first term.' },
        { id: uid('g'), term: 'Second term', def: 'Definition of the second term.' },
        { id: uid('g'), term: 'Third term',  def: 'Definition of the third term.' },
      ] };
    case 'matching': {
      const oA = uid('o'), oB = uid('o'), oC = uid('o');
      return { id, type, graded: true, instr: 'Match each scenario to the correct category.',
        optionsList: [
          { id: oA, label: 'Category A' },
          { id: oB, label: 'Category B' },
          { id: oC, label: 'Category C' },
        ],
        rows: [
          { id: uid('r'), q: 'First scenario to match.',  correct: oA },
          { id: uid('r'), q: 'Second scenario to match.', correct: oC },
          { id: uid('r'), q: 'Third scenario to match.',  correct: oB },
        ] };
    }
    case 'classify': {
      const cA = uid('o'), cB = uid('o'), cC = uid('o');
      return { id, type, graded: true, instr: 'Read each statement and choose the category it reflects.',
        categories: [
          { id: cA, label: 'Category A' },
          { id: cB, label: 'Category B' },
          { id: cC, label: 'Category C' },
        ],
        items: [
          { id: uid('i'), q: 'First statement to classify.',  correct: cA, explain: 'Why this is the right category.' },
          { id: uid('i'), q: 'Second statement to classify.', correct: cC, explain: 'Why this is the right category.' },
        ] };
    }
    case 'divider':
      return { id, type, style: 'line' };
    default:
      return { id, type: 'text', html: '' };
  }
}

/* ---------- block library (the "add block" menu) ---------- */
const BLOCK_LIBRARY = [
  { type: 'heading',   label: 'Heading',          group: 'Text',        icon: 'heading' },
  { type: 'text',      label: 'Text',             group: 'Text',        icon: 'text' },
  { type: 'statement', label: 'Statement / Quote', group: 'Text',       icon: 'quote' },
  { type: 'image',     label: 'Image',            group: 'Media',       icon: 'image' },
  { type: 'embed',     label: 'Video / Embed',    group: 'Media',       icon: 'play' },
  { type: 'mcq',       label: 'Multiple choice',  group: 'Interactive', icon: 'check' },
  { type: 'flip',      label: 'Flip cards',       group: 'Interactive', icon: 'flip' },
  { type: 'tabs',      label: 'Tabs',             group: 'Interactive', icon: 'tabs' },
  { type: 'accordion', label: 'Accordion',        group: 'Interactive', icon: 'accordion' },
  { type: 'stepper',   label: 'Process steps',    group: 'Interactive', icon: 'sliders' },
  { type: 'hotspots',  label: 'Hotspot diagram',  group: 'Interactive', icon: 'radio' },
  { type: 'matching',  label: 'Matching',         group: 'Activities',  icon: 'link' },
  { type: 'classify',  label: 'Classify',         group: 'Activities',  icon: 'layers' },
  { type: 'glossary',  label: 'Glossary',         group: 'Reference',   icon: 'book' },
  { type: 'divider',   label: 'Divider',          group: 'Layout',      icon: 'divider' },
];

/* ---------- default course ---------- */
function defaultCourse() {
  if (typeof window !== 'undefined' && typeof window.buildModule21Course === 'function') {
    return window.buildModule21Course();
  }
  return blankCourse();
}
function blankCourse() {
  return {
    meta: {
      title: 'Untitled course',
      subtitle: 'A short description of what this course covers.',
      kicker: 'Training · Self-paced',
      cover: '',
      accent: 'indigo',
      facts: [
        { k: 'Delivery', v: 'Self-paced' },
        { k: 'Duration', v: '60 minutes' },
        { k: 'Competency', v: 'Domain Knowledge' },
        { k: 'Stage', v: 'Understand' },
      ],
    },
    lessons: [
      { id: uid('l'), kind: 'section', title: 'Getting started', blocks: [] },
      { id: uid('l'), kind: 'lesson', title: 'Welcome', blocks: [
        newHeading('Welcome to the course', 'Introduction'),
        { id: uid('b'), type: 'text', html: 'This is a starter lesson. Turn on <strong>Edit</strong> in the top bar to change anything — click text to rewrite it, hover a block for controls, or use the <strong>+ Add block</strong> button to build out the lesson.' },
        { id: uid('b'), type: 'statement', variant: 'callout', accent: 'blue', label: 'Tip', title: 'Build it like Rise', text: 'Add lessons and sections in the left menu. Each lesson ends with a Continue button so learners move through at their own pace.' },
      ] },
      { id: uid('l'), kind: 'lesson', title: 'Your first lesson', blocks: [
        newHeading('Your first lesson', ''),
        { id: uid('b'), type: 'text', html: 'Replace this with your content. Add images, videos, flip cards, tabs, accordions, and questions from the block menu.' },
      ] },
      { id: uid('l'), kind: 'lesson', title: 'Knowledge check', blocks: [
        newHeading('Check your understanding', 'Quiz'),
        { id: uid('b'), type: 'mcq', question: 'Edit this question, then mark the correct answer in Edit mode.', graded: true,
          options: [
            { id: uid('o'), text: 'Option A', feedback: 'Explain why this is or isn\u2019t right.' },
            { id: uid('o'), text: 'Option B', feedback: 'Explain why this is or isn\u2019t right.' },
            { id: uid('o'), text: 'Option C', feedback: 'Explain why this is or isn\u2019t right.' },
          ], correct: null },
      ] },
    ],
  };
}
function newHeading(text, eyebrow) {
  return { id: uid('b'), type: 'heading', level: 'h2', text, eyebrow: eyebrow || '' };
}

/* ---------- icons (lucide-style strokes) ---------- */
const ICON_PATHS = {
  heading: 'M6 4v16M18 4v16M6 12h12',
  text: 'M4 6h16M4 12h16M4 18h10',
  quote: 'M7 7h4v4a4 4 0 0 1-4 4M13 7h4v4a4 4 0 0 1-4 4',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  play: 'M8 5v14l11-7z',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  flip: 'M3 7h12v12H3zM7 3h14v12',
  tabs: 'M3 8h6V4h12v16H3zM9 8v12',
  accordion: 'M4 5h16M4 12h16M4 19h16',
  divider: 'M4 12h16',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M5 12l7 7 7-7',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  drag: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 2.6 15H2.5a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4 8.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  close: 'M18 6L6 18M6 6l12 12',
  menu: 'M3 6h18M3 12h18M3 18h18',
  book: 'M4 4h11a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4zM4 4v13.5',
  section: 'M4 6h16M4 18h16',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.5L7 22l5-3 5 3-1.2-8.5',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-7h8v7',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  bold: 'M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z',
  italic: 'M19 4h-9M14 20H5M15 4L9 20',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  server: 'M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  layers: 'M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
  database: 'M12 2c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3zM3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6',
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h.01M9 11h.01M9 15h.01M14 7h.01M14 11h.01M14 15h.01',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
  smartphone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
  radio: 'M12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4M4.93 4.93a10 10 0 0 0 0 14.14M19.07 4.93a10 10 0 0 1 0 14.14M7.76 7.76a6 6 0 0 0 0 8.48M16.24 7.76a6 6 0 0 1 0 8.48',
  cpu: 'M6 6h12v12H6zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  shield: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z',
  cable: 'M4 9V5a2 2 0 0 1 4 0v14a2 2 0 0 0 4 0V5a2 2 0 0 1 4 0v4M2 9h6M16 9h6',
};

/* curated icon set for flip cards */
const FLIP_ICONS = ['layers','wifi','server','globe','zap','database','building','clock','smartphone','radio','cpu','sliders','cloud','shield','book','award','play','section'];

function Icon({ name, size, stroke, fill, style, className }) {
  const d = ICON_PATHS[name] || '';
  const isFill = name === 'play';
  return (
    <svg viewBox="0 0 24 24" width={size || 18} height={size || 18}
      fill={isFill ? (fill || 'currentColor') : 'none'}
      stroke={isFill ? 'none' : (stroke || 'currentColor')}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      <path d={d}></path>
    </svg>
  );
}

Object.assign(window, {
  STORE_KEY, PROGRESS_KEY, uid,
  loadCourse, saveCourse, loadProgress, saveProgress,
  ACCENTS, accentColor, newBlock, BLOCK_LIBRARY, defaultCourse,
  Icon, FLIP_ICONS,
});


export {}; // marks this file as an ES module for Vite
