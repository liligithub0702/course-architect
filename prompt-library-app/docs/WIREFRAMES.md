# Wireframes — screen by screen

Visual versions live in [`wireframes.html`](wireframes.html) (open in a browser).
Seven screens follow the product loop in order.

## Screen 1 · Home — start from the task, not the shelf

- Big free-text box: **"What are you working on?"** → the recommender parses task
  type, audience, and stage from it. Optional: link a live project for richer context.
- Task chips (Scripting · Course outline · Curriculum design · Research · Storyboard ·
  Assessments · QA) — the fixed taxonomy; clicking one is a shortcut into the filtered library.
- **Recommended for you** cards: title, match reasons ("Matches: compliance · retail
  audience · your module template"), success score + usage count, Use / Preview.
- Recently used row: one-click re-run with previous variables.

Key decisions: recommendations always explain *why*; success % comes straight from the
feedback loop.

## Screen 2 · Library — the browsable shelf

- Left filter rail: task type, project stage (Discover/Design/Develop/Deliver),
  minimum success score, tags.
- Toolbar: search + sort, **defaulting to "Best performing"** — the shelf leads with what works.
- Prompt cards: category, title, one-liner, success meter, uses, version number, and a
  **"Standards-ready" badge** (= has slots the app auto-fills from the standards brain).

Key decision: high version numbers are a feature, not noise — they show the improvement
loop working.

## Screen 3 · Prompt detail — anatomy of a proven prompt

- Header: category, title, version/owner/updated, primary action **Use this prompt** (+ Copy raw).
- Left: the prompt body with highlighted `{{variable_slots}}` and a visually distinct
  **House standards — auto-injected** block (tone of voice vN, templates, accessibility cues).
- Right sidebar:
  - **Why this works** — a human curator's note; the library doubles as prompt-craft training.
  - **Performance** — worked as-is / minor edits / didn't work breakdown.
  - **Version history** — which feedback drove each change. Nothing changes silently.
  - **Related prompts.**

## Screen 4 · Composer — fill the slots, get the assembled prompt

- Left: a form generated from the prompt's declared slots (audience, duration, source
  material, optional tone override).
- Right: live-assembled preview — intro + filled slots + standards block (expandable so
  people can inspect exactly what's sent), token estimate.
- Actions: **Copy prompt** (V1) · Open in Claude (V3).
- Footer notice: "After you use it, we'll ask how it went — 10 seconds." The feedback
  ask is announced up front, framed as making the tool smarter.

## Screen 5 · Feedback — the ten-second check-in

- Modal after use: **"How did the prompt do?"**
  - Outcomes (one tap = complete response): 🎯 Nailed it / ✏️ Minor edits / 🔧 Heavy edits / ✖ Didn't work.
  - Optional: "What did you change?" free text.
  - Optional: issue chips — too long · wrong pacing · tone off · missed structure · made things up.
  - Optional: paste your final edited prompt.
- Everything below the outcome row is optional — protect the feedback rate at all costs.

## Screen 6 · Standards hub — what the recommender knows

- Doc list with status: Style guide (Synced · v3), Tone of voice (Synced), Course
  templates (**Stale — 60 days**), Ways of working (Synced), Accessibility checklist
  (**Missing** → Add doc). Each shows "used in N prompts".
- Side panel: plain-language explainer of how these docs shape recommendations, and a
  **"Test the brain"** box ("What tone do we use for compliance courses?") that shows
  which doc answers.

Key decisions: staleness detection is the quiet killer-feature; the brain shows gaps honestly.

## Screen 7 · Insights & curation — the shelf-keeper's cockpit

- KPI tiles: prompts live · uses this month · % worked as-is · **feedback rate** (a
  first-class KPI).
- **Improvement queue**: cards like "Course outline v3 — 12 users trimmed the intro.
  Draft revision ready → Review draft v4", or "Scenario MCQ — 'made things up' flagged
  5×, success ▼ 84→79% → Investigate".
- **Submissions queue**: community-submitted prompts pending review (submitted ≠ published).
- Prompt performance table: uses, success, trend.

Key decision: the app drafts revisions, a curator approves — human-in-the-loop by design.
