# Progress

**Current step:** 1 — test set on paper.
**Done:** 0 — brief, brainstorm, stack, planning docs.

## Time log

Local time (EEST, UTC+3).

| Date | Time | Duration | Step | What was done |
|---|---|---|---|---|
| 2026-09-16 | 20:55–21:45 (approx.) | 0:50 | 0 | Read the brief, brainstorm, stack research (prices and limits checked in official docs), planning docs |

**Total so far:** 0:50 of about 8:00.

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

## Failures and fixes

_None yet._
