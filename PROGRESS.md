# Progress

**Current step:** 5 — commitment extraction with DeepSeek.
**Done:** 0 — brief, brainstorm, stack, planning docs · 1 — test set on paper · 2 — scaffold and
first deploy · 3 — fixture audio · 4 — ASR module.

**Demo:** https://commitments-from-recordings.vercel.app (placeholder page for now)

## Time log

Local time (EEST, UTC+3).

| Date | Time | Duration | Step | What was done |
|---|---|---|---|---|
| 2026-09-16 | 20:55–21:40 (approx.) | 0:45 | 0 | Read the brief, brainstorm, stack research (prices and limits checked in official docs), planning docs |
| 2026-09-16 | 21:40–21:50 (approx.) | 0:10 | 1 | Fixture scripts (T1, T2, T3, G2), G1 recipe, expected results, fixture format spec |
| 2026-09-16 | 21:50–22:10 (approx.) | 0:20 | 2 | Next.js 16 scaffold, shadcn/ui, Vitest, env template, GitHub repo, first Vercel deploy |
| 2026-09-16 | 22:10–23:55, with a break (approx.) | 0:50 | 3 | Deepgram key setup, fixture generator and tests, audio generation, ASR check of the audio, fixes to T1/T2/T3, diarization model comparison |
| 2026-09-17 | 00:00–00:15 (approx.) | 0:15 | 4 | ASR module (Deepgram call, response validation, utterance grouping), ASR snapshots, tests |

**Total so far:** 2:20 of about 8:00.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-09-16 | English; test recordings synthesized from scripts (TTS) | Reviewers can check the scripts; ASR is most accurate in English; v1 and v2 differ by exactly one line; reproducible |
| 2026-09-16 | TypeScript + Next.js on Vercel; uploads via Vercel Blob | One language for app, pipeline and eval; Vercel Functions reject bodies over 4.5 MB |
| 2026-09-16 | Deepgram Nova-3 for ASR; Aura-2 for fixture audio | Word timings, speakers and language in one request; $200 starter credit |
| 2026-09-16 | DeepSeek as the LLM instead of Claude Opus 5 | No out-of-pocket budget for a practice task; trade-offs and mitigations in [PLAN.md §5](PLAN.md#5-stack) |
| 2026-09-16 | Private GitHub repo under a personal account; HTTPS remote | The repo contains the verbatim brief; Vercel Hobby can't deploy private organization-owned repos; this machine has no SSH keys |
| 2026-09-16 | shadcn/ui default preset (`base-nova`, Base UI) | Current shadcn default; the components we need are available |
| 2026-09-16 | Fixture audio: one TTS request per line, 16 kHz mono WAV in `public/samples/`, per-line `timeline.json` | Exact line timings for evidence checks, no encoder offset, no extra dependencies; the app can serve samples as static files |
| 2026-09-16 | Deepgram `diarize_model=v2`, pinned rather than `latest` | Correct speaker for every fixture line (measured), while the deprecated `diarize=true` got one wrong; pinning keeps results reproducible |
| 2026-09-17 | Our own `Transcript` type; utterances grouped by our code (speaker change or a pause of at least 1 s) instead of Deepgram's `utterances` | Provider-neutral and unit-testable; utterance text is built from the same words used for timestamps |
| 2026-09-17 | `detect_language` instead of a fixed `language=en` | Needed to refuse non-English input; the effect on billing is undocumented and will be checked against Deepgram usage |
| 2026-09-17 | Deepgram responses validated with Zod; the client module marked `server-only`; our own retry (max 2 attempts, counted) | The SDK types omit fields we use; the API key can't leak into client code; every paid attempt shows up in the metrics |
| 2026-09-17 | Real Deepgram responses committed as test data (`fixtures/*/asr-response.json`) | Later stages are unit-tested on realistic transcripts, offline and for free |

## AI usage log

Tools and models used, and how their output was checked.

| Date | Tool / model | Used for | How the output was checked |
|---|---|---|---|
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Brief analysis, brainstorm, stack research, planning docs | Prices and platform limits were checked in official docs, not taken from model memory. Two findings changed the plan. (1) Vercel Functions reject request bodies over 4.5 MB, and Deepgram's REST API does not accept browser requests, so uploads now go through Vercel Blob. (2) A third-party article said diarization is free for pre-recorded audio, but Deepgram's pricing page lists it as a $0.0020/min add-on, so the cost report counts it |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Drafting fixture scripts, expected results and the fixture format spec | JSON files parsed with Node; a scripted diff confirmed that T1 and T2 dialogues differ only in line 18. A review pass before the commit found that T3 line 6 ("Let's think about it and talk again") could be read as an agreed follow-up, which would make "nothing agreed" debatable, so it was replaced with "It's hard to say right now." The same pass found that "written by hand" overstated the process and corrected the wording. Expected results were approved by the author before commit |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Project scaffold | The Next.js docs bundled with the installed version were read before writing code, as the generated `AGENTS.md` requires. The new `cn` dependency added by shadcn was checked on npm: its repository is `shadcn-ui/cn` and its maintainer is shadcn. Reading the generated CSS showed that shadcn expects the `--font-sans` variable while the template defined `--font-geist-sans`, so the page would have silently used a fallback font. After the fix, the computed style on the deployed page shows Geist |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`); Deepgram Aura-2 (TTS) and Nova-3 (ASR) | Fixture generator, audio generation and its verification | The generated audio was checked with a separate model: Deepgram Nova-3 transcribed each file, and a throwaway script compared the transcript with the script (word error rate) and each script line's time range with the detected speaker. This caught three problems before any pipeline code depended on the audio (see Failures and fixes) |
| 2026-09-17 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | ASR module | Before writing the code, the SDK's type definitions were read instead of relying on memory. They turned out to omit `punctuated_word` and `language_confidence`, which the API does return, so the response is validated with an explicit Zod schema. Recorded responses confirmed both fields, and tests on them check that every script line is transcribed and that Mark's short replies keep Mark's label |

## Failures and fixes

| Date | What failed | Fix |
|---|---|---|
| 2026-09-16 | `git` failed because the Xcode licence had not been accepted | Used the Command Line Tools git until the licence was accepted |
| 2026-09-16 | The SSH remote couldn't be used: this machine has no SSH keys | Switched the remote to HTTPS, which uses the macOS keychain |
| 2026-09-16 | ASR transcribed T1 line 10 "We could also add a dark mode" as "We can also add…", so the brief's "we could" trap would never reach the model | Reworded line 10 in T1 and T2 to "Maybe we could build a dark mode before the launch, too." The transcript now keeps "could" |
| 2026-09-16 | In the 22-second T3, diarization found a single speaker, with three different voice pairs | Extended T3 to about 45 seconds with the same meaning, plus a "somebody might…" item. Both voices are now separated and every line is attributed correctly. Lesson for the app: short recordings can merge voices, so fewer than two speakers must trigger a clarification |
| 2026-09-16 | After regeneration, the deprecated `diarize=true` attributed Mark's short reply (T1/T2 line 17) to Anna | Compared it with `diarize_model=v2`, which attributed every line of every fixture correctly; the app will use v2. Lesson: speaker labels on short replies are hints, not facts |
