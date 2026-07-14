# Brainstorm — PromptDeck

## Who it's for

| Persona | Job to be done |
|---|---|
| **The practitioner** | "I have a task due. Give me the prompt that worked last time, pre-loaded with our standards, so I get a strong first draft in minutes." |
| **The new joiner** | "I don't know the house style yet. The library is my safety rail — if I use its prompts, my output already sounds like the team." |
| **The lead / curator** | "I keep the shelf trustworthy. I approve new prompts, retire weak ones, and keep the standards docs the recommender relies on up to date." |

## Taxonomy (the "pre-set" backbone)

- **Task types:** scripting, course outlining, curriculum design, research,
  storyboarding, assessments, QA & review. (Extendable, but curated — not a free-for-all tag cloud.)
- **Project stages:** Discover / Design / Develop / Deliver — swap for ADDIE or the
  team's own stage names (open question).

## How the recommender ranks

```
score = semantic_fit(context, prompt) × success_rate × freshness
```

- **Semantic fit** — embed the user's free-text context ("outline for a 20-min
  compliance module for retail staff") against prompt descriptions *and* the standards
  docs, so "compliance module" knows the team's compliance conventions.
- **Success rate** — the live feedback score (worked as-is / minor edits / heavy edits / failed).
- **Freshness** — slight boost for recently improved versions.
- A cheap Claude call turns the top matches into human-readable **match reasons** —
  every recommendation says why. Trust in the recommender is the product; no black-box
  suggestions.

## The standards brain

- Docs it holds: style guide, tone of voice, course & module templates, ways of
  working, accessibility checklist.
- Each doc is versioned and chunked/embedded. It's used two ways:
  1. **Ranking** — recommendations account for how the team actually works.
  2. **Injection** — prompts declare standards slots; the app appends the current
     version at compose time. Nobody pastes the style guide by hand again. When the
     style guide updates, every standards-ready prompt updates with it.
- **Staleness detection** — a recommender running on an outdated style guide erodes
  trust fast, so the app flags docs untouched for N days and nags the curator.
- The brain shows gaps honestly ("Accessibility checklist: missing").

## The feedback loop

- One tap is a complete, valid response: 🎯 Nailed it / ✏️ Minor edits / 🔧 Heavy edits / ✖ Didn't work.
- Optional layers (each one more valuable than the last):
  1. Issue chips — *too long, wrong pacing, tone off, missed structure, made things up* — aggregatable signals.
  2. Free-text "what did you change?"
  3. Paste the final edited prompt — lets the app diff proven human fixes against the library version.
- **Feedback rate is a first-class KPI.** If it drops, every other metric stops being trustworthy.

## The improvement engine (V3)

- Clusters feedback per prompt ("wrong pacing × 12 this month").
- Drafts a revised version using the edits people actually made.
- A curator always reviews and approves; approved revisions ship as a new version with
  a changelog entry naming the feedback that drove it. Human-in-the-loop by design.

## Data model sketch

```
Prompt          id, title, description, task_type, stage, tags[],
                body (with {{slots}}), standards_slots[],
                status: draft|approved|retired, owner, current_version

PromptVersion   id, prompt_id, version_n, body, changelog,
                source: manual|feedback_draft, approved_by, created_at

StandardsDoc    id, kind: style|tov|template|wow, content, version,
                embedding_chunks[], synced_at (staleness)

UsageEvent      id, prompt_version_id, user_id, context_text,
                variables_json, created_at

Feedback        id, usage_event_id, outcome: nailed|minor|heavy|failed,
                issue_tags[], notes, edited_prompt (optional)

Recommendation  id, context_text, ranked_prompt_ids[], match_reasons[],
                accepted_id (did they use it?)

User            id, name, role: practitioner|curator, recent_usage[]
```

The interesting entities are **Feedback** (fuel) and **StandardsDoc** (ground truth) —
everything else is bookkeeping.

## Open questions

1. **Where does it live?** Standalone web app vs. a module inside course-architect.
   Standalone first is the safer bet — the audiences overlap but the jobs differ.
2. **Who curates?** The improvement loop needs a named shelf-keeper (or small rota).
   Without one, V3 has no reviewer and the library rots.
3. **Run prompts in-app or copy-out?** Copy-out (V1) is zero-cost and tool-agnostic;
   running in-app gives better feedback data but needs API keys and budget.
4. **Taxonomy language:** 4D, ADDIE, or the team's own stage names? Shapes every filter.
5. **Standards ingestion:** paste-and-version manually (V1) or sync from a live source
   (Drive/Notion) later?
6. **Seed content:** which ~20 prompts make the launch shelf? The course-architect
   learner-mode CSS brief (`design-prompt.txt`) is candidate #1.
