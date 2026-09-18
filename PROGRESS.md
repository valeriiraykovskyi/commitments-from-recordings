# Progress

**Current step:** 10 — done except the video, which the author records
([script](docs/VIDEO.md)).
**Done:** 0 — brief, brainstorm, stack, planning docs · 1 — test set on paper · 2 — scaffold and
first deploy · 3 — fixture audio · 4 — ASR module · 5 — extraction with DeepSeek · 6 — quote
verification, event fold, flags · 7 — API routes, uploads, guardrails, metrics, production check ·
8 — UI · 9 — eval, prompts v5 and v6, model comparison · 10 — README, delivery notes, video script.

**Demo:** https://commitments-from-recordings.vercel.app · **Delivery notes:** [docs/DELIVERY.md](docs/DELIVERY.md)

## Time log

Local time (EEST, UTC+3).

| Date | Time | Duration | Step | What was done |
|---|---|---|---|---|
| 2026-09-16 | 20:55–21:40 (approx.) | 0:45 | 0 | Read the brief, brainstorm, stack research (prices and limits checked in official docs), planning docs |
| 2026-09-16 | 21:40–21:50 (approx.) | 0:10 | 1 | Fixture scripts (T1, T2, T3, G2), G1 recipe, expected results, fixture format spec |
| 2026-09-16 | 21:50–22:10 (approx.) | 0:20 | 2 | Next.js 16 scaffold, shadcn/ui, Vitest, env template, GitHub repo, first Vercel deploy |
| 2026-09-16 | 22:10–23:55, with a break (approx.) | 0:50 | 3 | Deepgram key setup, fixture generator and tests, audio generation, ASR check of the audio, fixes to T1/T2/T3, diarization model comparison |
| 2026-09-17 | 00:00–00:15 (approx.) | 0:15 | 4 | ASR module (Deepgram call, response validation, utterance grouping), ASR snapshots, tests |
| 2026-09-17 | 00:15–00:25 (approx.) | 0:10 | 5 | Extraction design, DeepSeek spike, prompt, schema, client with retries, tests, live runs on T1–T3, two prompt fixes |
| 2026-09-17 | 00:25–00:45 (approx.) | 0:20 | 6 | Quote verification, status automaton, owners, deadlines, flags, clarifications, comparison with expected results, recorded LLM responses, prompt v4 |
| 2026-09-17 | 00:45–01:25 (approx.) | 0:40 | 7 | Upload and process routes, one pipeline function with streamed progress, guardrails, pricing and metrics, unit tests, local end-to-end runs of four samples and one Blob upload |
| 2026-09-17 | 01:25–02:20, with a break (approx.) | 0:35 | 7 | Deployment configuration: hidden failure cause fixed, health check, keys and Blob token re-entered in Vercel, redeploy, production end-to-end check of a sample and a Blob upload |
| 2026-09-17 | 02:20–02:50 (approx.) | 0:30 | 8 | UI: sample picker and drop zone, browser-side checks, Blob upload with progress, streamed progress steps with timings, early transcript, results in three blocks with playable quotes, clarifications, measurements; unit tests for the client helpers; every sample and one upload checked in the browser |
| 2026-09-17 | 03:00–03:30 (approx.) | 0:30 | 9 | Eval script and report, first eval run, the tsx duration-probe bug found and fixed (project switched to ESM), prompt v5, re-recorded model responses, eval re-run, comparison of effort `low` and no thinking |
| 2026-09-17 | 03:30–03:38 and 03:50–04:00 (approx.) | 0:20 | 10 | README, delivery notes, video script, production check |
| 2026-09-17 | 03:38–03:50 (approx.) | 0:15 | 9 | The production check missed a deadline once more; prompt v6 (deadlines listed first) with a verified attachment in code, tests, re-recorded responses, eval 15 of 15 |
| 2026-09-18 | 01:45–02:35 (approx.) | 0:50 | 11 | Final check of the submission against the brief: every requirement re-verified, T1, T3 and G1 run on production, two defects found in the documents and fixed |
| 2026-09-18 | 02:35–03:20 (approx.) | 0:45 | 12 | Redesign in the Codebridge visual language: style measured from the site, the mock reviewed, palette, type and shape implemented, one bug fixed, checks and two commits |
| 2026-09-18 | 13:50–14:40 (approx.) | 0:50 | 13 | Delivery notes and this log updated for the restyle; push and deploy; the production check found a cancelled task shown as agreed, fixed in the state machine with five new unit cases, and the eval re-run on a clean commit |

**Total so far:** 8:05 of about 8:00, without the video.

## Measurements so far

Informal numbers from development runs; the eval in step 9 produces the reported figures.

| Stage | Observed |
|---|---|
| ASR (Deepgram Nova-3), 16–72 s of audio | 2.1–2.3 s per file |
| Extraction (`deepseek-flash`, thinking, effort `high`), T1–T3 | 5.8–15 s; 1.3–1.5k input tokens (up to 1.28k from cache); 1.4k–3.8k output tokens, of which 1.1k–2.7k reasoning |
| Local API, G1 (too long) | Declined in 3 ms before any paid call; $0 |
| Local API, G2 (Spanish) | Declined after recognition (6.9 s, unusually slow ASR), no model call; $0.0017 |
| Local API, T1 | Transcript after 1.3 s, result after 43.7 s. The model took 42.4 s and 11.0k output tokens (9.8k reasoning) this time. $0.0142 off-peak, $0.0209 at peak; $0.0118 per audio minute off-peak |
| Local API, T3 | Transcript after 1.9 s, result after 32.6 s (model: 30.8 s, 7.3k reasoning tokens); $0.0095 off-peak, $0.0142 at peak |

| Local API, T2 uploaded through Vercel Blob | Upload of 2.3 MB: 9.8 s (depends on the user's connection). Processing: 16.8 s (Blob read 0.5 s, recognition 1.5 s, model 14.1 s); result correct; blob deleted afterwards; Blob cost $0.00011. An upload outside `uploads/` and a text file were both rejected |
| Production (Vercel `iad1`), T1 sample | Transcript after 1.2 s (of which about 1 s is the function start), result after 10.8 s; recognition 0.23 s, model 9.6 s, one attempt. $0.0093 off-peak, $0.0110 at peak; $0.0077 per audio minute. Result matches `expected.json` |
| Production, T2 uploaded through Vercel Blob | Upload of 2.3 MB from this machine: 2.7 s. Processing: 12.7 s (Blob read 0.34 s, recognition 0.81 s, model 11.5 s); result matches `expected.json`; Blob cost $0.00011. A second request for the same path got "file not found", so the blob was deleted |
| Browser UI (local dev server), T1 and T3 samples | Timed in the browser from the click: transcript on screen after 2.8 s (T1) and 1.8 s (T3); result after 22.2 s (T1, model 19.5 s) and 15.8 s (T3, model 14.0 s). T1 shows 3 agreed, 1 open question, 2 not commitments; T3 shows the "Who is who?" clarification, 0 agreed, 2 needing confirmation |
| Browser UI, T2 through the file picker | The browser read the duration (1:12) before uploading; upload 2.2 s with a progress percentage; transcript after 4.6 s; result after 15.7 s (server total 12.9 s); the migration script is agreed, as expected for T2 |
| Browser UI, G1 and G2 samples | G1 refused in the browser flow after a 34 ms server check, no paid call, $0. G2 refused after recognition in 1.7 s with the Spanish transcript on screen, no model call, $0.0017 |
| Segment playback | A 1.7 s quote played from 0.15 s before its first word and stopped 2.0 s after the click; the matching transcript line was highlighted while it played |

### Eval (step 9)

`npm run eval` runs the fixtures through the same pipeline as the app, one run after another,
with real API calls, and checks each result against `expected.json`. Reports with every run,
item and token count: [`eval/`](eval/). DeepSeek off-peak tariff, list prices.

| Configuration | Prompt | Fixtures × runs | Passed | Model time, median / worst | Reasoning tokens, median (min–max) | Cost per run, median |
|---|---|---|---|---|---|---|
| `deepseek-flash`, thinking on, effort `high` (the default) | v6 | 5 × 3 | **15/15** | 12.7 s / 32.1 s | 2.4k (1.7k–6.4k) | $0.0095 |
| the same | v5 | 5 × 3 | 15/15 | 13.3 s / 16.0 s | 2.3k (1.1k–3.0k) | $0.0095 |
| `deepseek-flash`, thinking on, effort `low` | v5 | T1–T3 × 3 | 9/9 | 27.8 s / 36.6 s | 6.2k (1.9k–7.8k) | $0.0097 |
| `deepseek-flash`, thinking off | v5 | T1–T3 × 3 | 4/9 | 3.2 s / 3.5 s | 0 | $0.0082 |

Default configuration on prompt v6, per fixture: T1 3/3, result after 14.8 s (worst 34.2 s, one
run with 6.4k reasoning tokens), $0.0095 per run; T2 3/3, 16.7 s (18.1 s), $0.0100; T3 3/3,
14.3 s (16.8 s), $0.0066; G1 3/3 refused before any paid call, $0; G2 3/3 refused after
recognition, $0.0017. No retries, no warnings, and the code-side attachment of listed deadlines
was never needed: the model attached every deadline itself in all nine scripted runs. Per audio
minute: $0.0079–0.0087. Total cost of all evals: $0.32 at list prices (v4 $0.15, v5 $0.24 incl.
the comparison, v6 $0.09), plus about $0.06 for re-recording the model responses twice.

What the comparison showed: effort `low` reasoned almost three times longer than `high` on this
task and cost the same; without thinking, the model was five times faster but marked the
ownerless task "not agreed" in 5 of 6 T1/T2 runs, duplicated the migration-script item twice and
dropped a deadline once. The default stays `high`.

**Production check on prompt v5** (commit `a1da07b`, 03:40): T1 sample — transcript after 1.2 s,
result after 12.8 s (model 11.6 s), $0.0093, matches `expected.json`. T2 uploaded through Blob —
upload 2.5 s, result after 12.5 s (model 10.4 s), $0.0091 plus $0.0001 Blob, blob deleted
afterwards; **the ownerless task's deadline was missing again**. Counting every v5 run on T1/T2
(6 eval runs, 2 re-recordings, 1 production run), the omission happened in 1 of 9; on v4 it was
1 of 6. Reduced, not eliminated, which led to prompt v6 (see Decisions).

**Production check on prompt v6** (commit `53d09f2`, 04:05, DeepSeek peak tariff): T1 sample —
transcript after 1.8 s, result after 13.2 s (model 11.4 s), $0.0114, matches `expected.json`.
T2 uploaded through Blob — upload 2.8 s, transcript after 1.0 s, result after 43.1 s (model
42.1 s with 9.8k output tokens), $0.0193 plus $0.0001 Blob, matches `expected.json`, blob
deleted afterwards. Both correct; the second shows the latency tail: across the twelve v6 runs
on T1–T3 so far, ten took 10–17 s of model time and two took 32 s and 42 s.

**Open question:** with effort `high`, the model's latency ranged from 6 s to 42 s, depending on how
long it reasoned. The eval compares lower effort, no thinking and `deepseek-v4-pro`.

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
| 2026-09-17 | The LLM returns items with a timeline of typed events and quotes, not final states | Every change of state (acceptance, new deadline, cancellation) is explicit and quotable; the final state is computed by tested code |
| 2026-09-17 | DeepSeek called with `fetch` instead of the `openai` package | The DeepSeek-specific parameters and usage fields are not in the SDK types; the response is validated with Zod anyway |
| 2026-09-17 | Start with `deepseek-flash`, thinking on, effort `high` | Correct results on T1–T3 in development runs at a fraction of a cent; the eval will compare other settings |
| 2026-09-17 | One retry: a complete but invalid answer is sent back with the validation error, a truncated or empty one is simply requested again | Most invalid answers are fixable by the model; every attempt is counted |
| 2026-09-17 | Versioned system prompt (`PROMPT_VERSION`), static and placed first | Eval reports show which prompt produced a result; DeepSeek serves the static prefix from its cache at a lower price |
| 2026-09-17 | Quotes must match the transcript word for word (case and punctuation ignored); a wrong utterance reference is corrected to the nearest match and flagged | The model copies text it was given, so exact matching should hold; an unmatched quote drops only that event, never adds anything. Fuzzy matching only if the eval shows a need |
| 2026-09-17 | Status automaton: only `committed`/`accepted` agree; a tentative answer always leaves a task unconfirmed; declining or cancelling after agreement cancels it | Conservative on purpose: the brief penalises overstating commitments |
| 2026-09-17 | Owners only from a commitment or an accepted request; a requested owner must be named in the quote or be the other named participant; speaker names only from a verified self-introduction said by that speaker | "Do not infer an owner" enforced in code, not just in the prompt |
| 2026-09-17 | A deadline counts as a date only when it is a full calendar date with a year; everything else is kept as spoken and flagged | The recordings never state their date, so relative wording can't be resolved |
| 2026-09-17 | One comparison with `expected.json` (`scripts/lib/compare.ts`), used by the snapshot tests now and by the eval later; recorded LLM responses committed as test data | The same definition of "correct" everywhere; the deterministic stage is regression-tested offline on real model output |
| 2026-09-17 | One pipeline function (`runPipeline`) for the API and the eval; progress streamed as NDJSON, with the transcript sent as soon as it exists | The eval measures exactly what users get; users see progress and a first useful result in about 2 s instead of a silent wait |
| 2026-09-17 | Duration checked from the file before any paid call; the browser's duration is the fallback; recognition's duration is checked again | The "too long" refusal costs nothing, even for files without duration metadata in the header |
| 2026-09-17 | Declines (`too_long`, `unreadable_audio`, `no_speech`, `unsupported_language`) and failures return metrics too | Refusals and outages are measured like successes |
| 2026-09-18 | The look follows the visual language of codebridge.tech, without its logo or wordmark | The reviewer sees the product in a language they know, and nothing claims the prototype is theirs |
| 2026-09-18 | The five status colours become named tokens and are retuned away from brand teal; teal is kept for chrome and actions | The statuses mean opposite things and are read first; had "Agreed" taken the brand colour it would have collided with every accent on the page. One file now holds the palette instead of eight hardcoded places |
| 2026-09-18 | Squareness comes from `--radius: 0` rather than editing each component | The token already drives the whole `rounded-*` scale through `calc()`, so 25 of the 33 radii changed with one value and only the deliberate exceptions (pill buttons, circular icons) were touched by hand |
| 2026-09-18 | The dark theme was deleted, not fixed | Nothing ever set `.dark`, so it could not apply, and after the repaint it described a palette the product no longer uses |
| 2026-09-17 | Cost per operation = recognition + reasoning + billed retries (+ speech and intermediaries, both $0), also at DeepSeek's peak tariff and per audio minute; Blob usage reported as hosting; list prices in `src/lib/pricing.ts` with sources | Follows the brief's cost breakdown; free credits are ignored |
| 2026-09-17 | Samples read from the function bundle (`outputFileTracingIncludes`), not through Blob | Faster, no Blob quota, no dependency on deployment protection; still processed live |
| 2026-09-17 | Per-IP request limit kept in memory | No accounts in scope; on serverless this is only a speed bump, while prepaid and free-credit balances cap the spend |
| 2026-09-17 | `GET /api/health` reports which variables are present, the shape of each key and whether the provider accepts it; never a value | Configuration problems on Vercel were invisible from outside (see Failures and fixes); the probes are free, read-only requests, and the endpoint is rate-limited |
| 2026-09-17 | The browser checks type, size and duration (through an audio element's metadata) before uploading anything | A recording over 3 minutes is refused with no upload and no request; the server still checks again |
| 2026-09-17 | One page, one client component with a session state machine; each run is numbered, so events from an abandoned run are ignored | No history or accounts in scope, so a second page would only add routing; the run number keeps "New recording" safe while a request is in flight |
| 2026-09-17 | One hidden audio element for all playback; the end of a segment is checked on animation frames and on `timeupdate`; 0.15 s lead-in, 0.1 s tail | Only one thing plays at a time; frames pause in a hidden tab while audio keeps going (see Failures and fixes); word timings clip the first consonant without a lead-in |
| 2026-09-17 | Results in three blocks: agreed, unresolved, and a collapsed "not commitments" block that also holds answered questions and the model claims that failed verification | The brief asks to check exclusion as well as inclusion; a reviewer can see why each item was left out without leaving the page |
| 2026-09-17 | Speakers are "Speaker 1" and "Speaker 2" until a self-introduction is verified; editing the mapping in the UI is deferred to the if-time-allows list | Names come only from the recording, as planned; with 3:25 left for steps 9–10, the buffer matters more than the editor |
| 2026-09-17 | The eval calls `runPipeline` directly, runs sequentially, and writes one Markdown + JSON report per configuration into `eval/`, with git SHA, prompt version, pass rate, medians, worst cases, tokens and cost; flags choose runs, fixtures, model, effort and thinking | The eval measures exactly what users get, without network noise or our own rate limit; the model comparison is the same script with different flags |
| 2026-09-17 | The package is ESM (`"type": "module"`); scripts import `@next/env` as a default export | Under CommonJS, tsx broke music-metadata's MIME parsing (see Failures and fixes), so the eval and the app disagreed on a 3.6-minute file. With ESM, Next, vitest and tsx load the same code the same way |
| 2026-09-17 | Prompt v5: a closing rule that makes the model re-check every task for a stated deadline and for separate acceptance, deadline-change and cancellation events | The v4 eval missed the ownerless task's deadline in 1 of 6 T1/T2 runs, the third time this weakness showed; with v5 the default configuration passed 15 of 15 runs and T2 got twice as fast |
| 2026-09-17 | Keep `deepseek-flash` with thinking on and effort `high`; `deepseek-v4-pro` not tried | The eval showed effort `low` slower and no cheaper on this task, and thinking off wrong in 5 of 9 runs; a model three times more expensive was not needed once flash passed everything |
| 2026-09-17 | Prompt v6: the model lists every time expression (`deadlines_mentioned`: utterance, words, task) before it writes the events; code verifies each listed deadline and attaches it to its task at its place in time when the model left it out, with a `deadline_recovered` flag | Wording alone (v5) lowered the omission rate but a production run missed the deadline again. Listing first is easier for the model than attaching, and the attachment in code needs no judgement: the quote and the task come from the model, the timestamps from the recording. On v6 the model attached every deadline itself (15 of 15, no recovery needed); the code path is unit-tested and stays as a safety net |

## AI usage log

Tools and models used, and how their output was checked.

| Date | Tool / model | Used for | How the output was checked |
|---|---|---|---|
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Brief analysis, brainstorm, stack research, planning docs | Prices and platform limits were checked in official docs, not taken from model memory. Two findings changed the plan. (1) Vercel Functions reject request bodies over 4.5 MB, and Deepgram's REST API does not accept browser requests, so uploads now go through Vercel Blob. (2) A third-party article said diarization is free for pre-recorded audio, but Deepgram's pricing page lists it as a $0.0020/min add-on, so the cost report counts it |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Drafting fixture scripts, expected results and the fixture format spec | JSON files parsed with Node; a scripted diff confirmed that T1 and T2 dialogues differ only in line 18. A review pass before the commit found that T3 line 6 ("Let's think about it and talk again") could be read as an agreed follow-up, which would make "nothing agreed" debatable, so it was replaced with "It's hard to say right now." The same pass found that "written by hand" overstated the process and corrected the wording. Expected results were approved by the author before commit |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Project scaffold | The Next.js docs bundled with the installed version were read before writing code, as the generated `AGENTS.md` requires. The new `cn` dependency added by shadcn was checked on npm: its repository is `shadcn-ui/cn` and its maintainer is shadcn. Reading the generated CSS showed that shadcn expects the `--font-sans` variable while the template defined `--font-geist-sans`, so the page would have silently used a fallback font. After the fix, the computed style on the deployed page shows Geist |
| 2026-09-16 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`); Deepgram Aura-2 (TTS) and Nova-3 (ASR) | Fixture generator, audio generation and its verification | The generated audio was checked with a separate model: Deepgram Nova-3 transcribed each file, and a throwaway script compared the transcript with the script (word error rate) and each script line's time range with the detected speaker. This caught three problems before any pipeline code depended on the audio (see Failures and fixes) |
| 2026-09-17 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | ASR module | Before writing the code, the SDK's type definitions were read instead of relying on memory. They turned out to omit `punctuated_word` and `language_confidence`, which the API does return, so the response is validated with an explicit Zod schema. Recorded responses confirmed both fields, and tests on them check that every script line is transcribed and that Mark's short replies keep Mark's label |
| 2026-09-17 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`); DeepSeek `deepseek-flash` | Extraction prompt, schema and client | A spike checked what the docs left open (JSON mode with thinking) before the client was written. The prompt uses general rules and common phrases; a unit test fails if any fixture sentence of five or more words appears in it. The model's output was read line by line on T1, T2 and T3; the two problems found are in Failures and fixes |
| 2026-09-17 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`); DeepSeek `deepseek-flash` | Verification and status logic | Each rule has unit tests written from the design table, not from the implementation. Real DeepSeek answers for T1–T3 were then run through the new code and compared automatically with the hand-written expected results. That comparison caught a duplicated topic in T3 that reading the output had not flagged as a problem |
| 2026-09-17 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | API routes, pipeline, pricing | The Vercel Blob and Next.js docs, and the installed type definitions, were read before writing the routes. Every pipeline branch has a unit test with mocked providers that checks the paid-call counts. Then four samples went through the local API end to end, and the production build was checked to include the sample files in the function |
| 2026-09-17 | Claude Code (desktop app), Claude Fable 5.1 (`claude-fable-5-1`) | Production check | The health check and a direct request to the upload route showed the Blob token missing while the store ID was present, which pointed at the deployment rather than at the store. After the redeploy, a throwaway script ran a bundled sample and a real Blob upload through the deployed API, compared both results with `expected.json` automatically (both passed), and requested the uploaded path a second time to confirm the blob had been deleted |
| 2026-09-17 | Claude Code (desktop app), Claude Fable 5.1 (`claude-fable-5-1`) | UI | The Next.js 16 guide on server and client components was read before writing the page. The client helpers (NDJSON reader, file checks) have unit tests, including a multi-byte character split across chunks. Then every path was exercised in the app's browser pane: all five samples and a real file upload through the file input, with the cards read against the expected items. Playback was measured by polling the button state, which caught a real bug (see Failures and fixes). The production build was run before committing |
| 2026-09-17 | Claude Code (desktop app), Claude Fable 5.1 (`claude-fable-5-1`); DeepSeek `deepseek-flash` | Eval script, prompt v5, model comparison | The report builder has a unit test on synthetic runs. The first real eval was not trusted blindly: its check of paid calls ("asr calls: 1, expected 0") exposed that the duration probe behaved differently under tsx than in the app, and the cause was traced with music-metadata's debug log to a nested ESM dependency, not guessed. The prompt change was judged by the eval, not by reading one answer: 15 of 15 after, 11 of 15 before (of which 3 were the tooling bug). The comparison ran the same script with different flags |
| 2026-09-17 | Claude Code (desktop app), Claude Fable 5.1 (`claude-fable-5-1`); DeepSeek `deepseek-flash` | Prompt v6 and the deadline attachment, delivery notes | A production run after the v5 eval was checked against `expected.json` like any eval run, which is how the remaining omission was caught. The v6 attachment logic has unit tests for the four cases (attached in time order, not duplicated, quote not found, task unknown); the re-recorded answers were inspected for the new list; the eval judged the result (15 of 15). The delivery notes quote only measured figures from the eval reports and the production checks |
| 2026-09-18 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | Final check against the brief | Nothing was taken from the notes on trust: the requirement list was re-read from `docs/TASK.md`, the tests, typecheck, lint and `/api/health` were run, and T1, T3 and G1 were processed on production and compared with `expected.json`. Two claims in the documents did not survive the check and were corrected: `PLAN.md` promised speaker editing that was never built, and the test count was three behind |
| 2026-09-18 | Claude Design (claude.ai/design) | The visual mock | The style was not described from memory: the palette, type scale and radii were measured on codebridge.tech (263 of 263 boxes at radius 0, which is why only buttons and icons keep one). The returned mock was then read before use — it had invented its own task titles, quotes and transcript to fill the layout, so only its form was taken and every string in the app stayed the one the pipeline produces |
| 2026-09-18 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`) | The redesign in code | Styling was verified by measurement, not by eye: `getComputedStyle` on a playing quote returned `#f5f5f5` where the mint was expected, which exposed that `hover:bg-muted` outranked the playing fill and greyed out a row under the pointer while it played. After the fix the same check returned `#d9f1e8` with a `#50b1a2` edge, and the transcript line was confirmed to light with the quote and go out after it. 176 tests, lint, typecheck and the production build ran green |
| 2026-09-18 | Claude Code (desktop app), Claude Opus 5 (`claude-opus-5`); DeepSeek `deepseek-flash` | Production check after the deploy | The deployed run was compared with `expected.json` instead of being glanced at, which is the only reason the regression surfaced: the page looked entirely plausible with four agreed tasks, and the cancelled migration script sat among them carrying its own cancellation quote. Reading the event list rather than the summary showed the model had labelled "Okay. Noted." as an acceptance. The fix was then judged by the unit table and a full eval on a clean commit, not by re-running the one input that had failed |

## Failures and fixes

| Date | What failed | Fix |
|---|---|---|
| 2026-09-16 | `git` failed because the Xcode licence had not been accepted | Used the Command Line Tools git until the licence was accepted |
| 2026-09-16 | The SSH remote couldn't be used: this machine has no SSH keys | Switched the remote to HTTPS, which uses the macOS keychain |
| 2026-09-16 | ASR transcribed T1 line 10 "We could also add a dark mode" as "We can also add…", so the brief's "we could" trap would never reach the model | Reworded line 10 in T1 and T2 to "Maybe we could build a dark mode before the launch, too." The transcript now keeps "could" |
| 2026-09-16 | In the 22-second T3, diarization found a single speaker, with three different voice pairs | Extended T3 to about 45 seconds with the same meaning, plus a "somebody might…" item. Both voices are now separated and every line is attributed correctly. Lesson for the app: short recordings can merge voices, so fewer than two speakers must trigger a clarification |
| 2026-09-16 | After regeneration, the deprecated `diarize=true` attributed Mark's short reply (T1/T2 line 17) to Anna | Compared it with `diarize_model=v2`, which attributed every line of every fixture correctly; the app will use v2. Lesson: speaker labels on short replies are hints, not facts |
| 2026-09-17 | Prompt v1 put surrounding words into a deadline ("Monday instead") in one of two runs | Prompt v2: the deadline field holds only the time expression. "Monday" in all later runs |
| 2026-09-17 | Prompt v2 left out the "before the launch" deadline of the ownerless task in one of two T1 runs | Prompt v3: record a deadline for every task that has one, including proposals and ownerless tasks. The deadline was present in 3 of 3 runs |
| 2026-09-17 | With prompt v3, T3 had the support inbox twice: as an open question ("What about the support inbox?") and as a task. The expected-results comparison failed ("found 2 matching items") | Prompt v4, rule 5: one item per topic; a question that suggests doing something is the task's "proposed" event. T3 had no duplicates in 3 of 3 runs, and T1's real question stayed a question. The rule is general, but it was found on a fixture, so the holdout recording is the real check |
| 2026-09-17 | On the first deployment, recognition failed within 1 ms and the cause was hidden: the pipeline returned a generic message and logged nothing | The real cause is now logged server-side (users still get a generic message), API keys are trimmed because a pasted key with a trailing newline makes an invalid header, and `/api/health` shows whether each provider accepts its key. The keys were re-entered in Vercel; the health check now shows both accepted |
| 2026-09-17 | After the Blob store was connected, the deployed upload route still answered "No read-write token found", although the store ID variable was present | Vercel injects environment variables at deploy time, so a token added after a deployment is not visible until the next one. A redeploy fixed it; the health check and the upload probe confirmed the token before the end-to-end run |
| 2026-09-17 | The first segment player checked the end of a quote only on animation frames. In the browser pane a quote kept "playing" for several seconds instead of about two, and browsers pause animation frames in a hidden tab, so a user switching tabs would hear the recording run on to the end | The end is now also checked on the audio element's `timeupdate` event, which fires in hidden tabs. Re-measured: a 1.7 s quote stopped 2.0 s after the click |
| 2026-09-17 | In the first eval, the 3.6-minute G1 recording went to Deepgram three times ($0.07 of credits) instead of being refused for free. Under tsx the duration probe returned null in 1 ms: music-metadata resolves a nested, ESM-only `media-typer` 2.0, and tsx's CommonJS interop broke its `parse`, so the library logged "Invalid HTTP Content-Type header value: audio/wav" and gave up. Next and vitest load the same code as native ESM, so the app was never affected | The package is now `"type": "module"`, and the scripts import `@next/env` (CommonJS) as a default export. Verified in all three runtimes: unit tests, production build, the eval (G1 refused, $0) and the UI on a restarted dev server (G1 refused in 4 ms) |
| 2026-09-17 | With prompt v4, one T2 run dropped every deadline event but two and one acceptance ("store-screenshots: deadline is missing"); its answer was half the usual length | Prompt v5 adds a closing self-check for deadlines and for separate acceptance, change and cancellation events. Recorded responses were re-recorded on v5, and the eval passed 15 of 15 |
| 2026-09-17 | Two transient model failures during the evals: one v5 answer on T3 had no `speakers` and `items` arrays, and one no-thinking request failed at the network level | Both were caught by the existing retry, counted as attempts in the metrics, and the retried runs passed |
| 2026-09-17 | The production check on prompt v5 dropped the ownerless task's deadline once more (T2 upload). The self-check rule lowered the rate (1 of 9 v5 runs against 1 of 6 on v4) but did not remove it | Prompt v6 changes the shape of the answer instead of the wording: deadlines are listed before the events, and code attaches any listed deadline the model left out, after verifying the quote. Re-recorded, unit-tested, eval 15 of 15 with no recovery needed |
| 2026-09-18 | A production run of T1 after the restyle showed the cancelled migration script as **agreed**, which is the brief's "do not retain a cancelled task as active". The model had labelled Mark's acknowledgement of the cancellation ("Okay. Noted.") as an `accepted` event, and `taskStatus()` let any acceptance set the status back to agreed, bypassing the guard that only `reinstated` had. The eval's 15 of 15 had not covered it: no recorded answer put an `accepted` after a `cancelled`, and neither did the unit table | An acceptance after a cancellation is ignored — acceptance answers an offer, and a cancellation is not one. A fresh `committed` still revives the task and now reports "Brought back after being cancelled." Five cases added to the unit table, including the failing sequence and a second cancellation after a revival |
