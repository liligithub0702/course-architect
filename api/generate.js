/* ============================================================
   Backend function — POST /api/generate
   ------------------------------------------------------------
   Runs on Vercel's servers (NOT in the browser). It:
     1. checks the shared team password,
     2. uses YOUR Anthropic key (stored as a Vercel secret),
     3. asks Claude to turn an outline into a course,
     4. returns Claude's raw text to the browser.
   The key never reaches the browser or the GitHub repo.
   ============================================================ */

const AI_MODEL = 'claude-sonnet-4-6';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, password } = req.body || {};

  // 1. password gate
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: 'Server is missing APP_PASSWORD. Ask the admin to set it in Vercel.' });
  }
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong team password.' });
  }

  // 2. validate input
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No outline text provided.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Ask the admin to set it in Vercel.' });
  }

  // 3. call Claude with YOUR key (server-side secret)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-beta': 'output-128k-2025-02-19',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 16000,
        messages: [{ role: 'user', content: COURSE_PROMPT + text }],
      }),
    });

    if (!r.ok) {
      let msg = 'Anthropic error ' + r.status;
      try { const e = await r.json(); msg = e.error?.message || msg; } catch (_) {}
      return res.status(r.status).json({ error: msg });
    }

    const data = await r.json();
    const raw = (data.content && data.content[0]?.text) || '';
    return res.status(200).json({ raw });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
