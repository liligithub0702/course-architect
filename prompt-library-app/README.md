# PromptDeck (working title)

> A prompt library that knows how your team works. Curated prompts for instructional
> design tasks — scripting, course outlining, curriculum design, research — recommended
> by context, grounded in house standards, and improved by every use.

**Status:** brainstorm & wireframe phase. This folder is staged inside `course-architect`
temporarily and is intended to move to its own repository (`id-prompt-library`) once created.

Other name candidates: *Prompt Shelf* · *Playbook* · *The Brief*

## The loop

```
Curate → Recommend → Compose → Use → Feedback → Improve ↺
```

Improved versions feed back into curation — the library gets smarter with every project.

## The problem

Good prompts die in Slack threads. The team already has prompts that work (the
learner-mode CSS brief in course-architect is a great example), but they live in
personal notes, old chats, and memory. New joiners start from zero, and everyone
re-explains the style guide and tone of voice to the model every single time.

**The bet:** a shared library where the proven prompts live, where the app — not the
person — carries the knowledge of house standards, and where every use makes the next
use better.

## Feature pillars

1. **Curated library** — a pre-set, approved collection organised by task type
   (scripting, course outlining, curriculum design, research, storyboarding,
   assessments, QA) and project stage. Every prompt is versioned, owned, and
   templated with variable slots.
2. **Context recommender** — describe what you're working on in plain language; the
   app matches it against the library and ranks by fit *and* track record. Every
   recommendation says *why* it was picked.
3. **Standards brain** — the style guide, tone of voice, templates, and
   ways-of-working docs live in the app. Prompts declare standards slots and the app
   injects the current version automatically.
4. **Feedback loop** — after each use, a ten-second check-in: nailed it / minor
   edits / heavy edits / didn't work. Ratings roll up into a success score per prompt.
5. **Improvement engine** — when feedback clusters ("12 people trimmed the intro"),
   the app drafts a revised version for a curator to review. Nothing changes silently.

## Roadmap

| Release | Theme | Scope |
|---|---|---|
| **V1 — The Shelf** | Curated library that beats Slack search | Seeded library (~20 proven prompts), browse/search/filter, prompt detail with slots, composer with copy-to-clipboard, feedback capture from day one, standards as static versioned blocks |
| **V2 — The Advisor** | Context-aware recommendations | "What are you working on?" recommender with match reasons, standards hub with sync/staleness + embeddings, live success scores, read-only insights dashboard |
| **V3 — The Editor** | The library improves itself | Improvement engine (drafted revisions from clustered feedback), submission + curation workflow, "Open in Claude" / run-in-app, Slack feedback nudges, possible embed inside course-architect |

## Docs

- [`docs/BRAINSTORM.md`](docs/BRAINSTORM.md) — personas, recommender mechanics, data model, open questions
- [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) — screen-by-screen walkthrough with design decisions
- [`docs/wireframes.html`](docs/wireframes.html) — visual wireframes (open in a browser; same content as the published artifact)

## Proposed stack

React + Vite (matches course-architect), a lightweight backend (e.g. Supabase or
Vercel serverless + Postgres) for prompts/feedback, and the Claude API for
recommendation ranking, match-reason generation, and revision drafting.
