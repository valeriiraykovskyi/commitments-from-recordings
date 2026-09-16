# Progress

**Current step:** 2 — scaffold and first deploy.
**Done:** 0 — brief, brainstorm, stack, planning docs · 1 — test set on paper.

## Time log

Local time (EEST, UTC+3).

| Date | Time | Duration | Step | What was done |
|---|---|---|---|---|
| 2026-09-16 | 20:55–21:40 (approx.) | 0:45 | 0 | Read the brief, brainstorm, stack research (prices and limits checked in official docs), planning docs |
| 2026-09-16 | 21:40–21:50 (approx.) | 0:10 | 1 | Fixture scripts (T1, T2, T3, G2), G1 recipe, expected results, fixture format spec |

**Total so far:** 0:55 of about 8:00.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-09-16 | English; test recordings synthesized from scripts (TTS) | Reviewers can check the scripts; ASR is most accurate in English; v1 and v2 differ by exactly one line; reproducible |
| 2026-09-16 | TypeScript + Next.js on Vercel; uploads via Vercel Blob | One language for app, pipeline and eval; Vercel Functions reject bodies over 4.5 MB |
| 2026-09-16 | Deepgram Nova-3 for ASR; Aura-2 for fixture audio | Word timings, speakers and language in one request; $200 starter credit |
| 2026-09-16 | DeepSeek as the LLM instead of Claude Opus 5 | No out-of-pocket budget for a practice task; trade-offs and mitigations in [PLAN.md §5](PLAN.md#5-stack) |

## AI usage log

Tools and models used, and how their output was checked.

| Date | Tool / model | Used for | How the output was checked |
|---|---|---|---|
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Brief analysis, brainstorm, stack research, planning docs | Prices and platform limits were checked in official docs, not taken from model memory. Two findings changed the plan. (1) Vercel Functions reject request bodies over 4.5 MB, and Deepgram's REST API does not accept browser requests, so uploads now go through Vercel Blob. (2) A third-party article said diarization is free for pre-recorded audio, but Deepgram's pricing page lists it as a $0.0020/min add-on, so the cost report counts it |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Drafting fixture scripts, expected results and the fixture format spec | JSON files parsed with Node; a scripted diff confirmed that T1 and T2 dialogues differ only in line 18. A review pass before the commit found that T3 line 6 ("Let's think about it and talk again") could be read as an agreed follow-up, which would make "nothing agreed" debatable, so it was replaced with "It's hard to say right now." The same pass found that "written by hand" overstated the process and corrected the wording. Expected results were approved by the author before commit |

## Failures and fixes

_None yet._
