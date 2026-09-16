# Progress

**Current step:** 8 — UI: upload, progress, results, transcript, playback, metrics.
**Done:** 0 — brief, brainstorm, stack, planning docs · 1 — test set on paper · 2 — scaffold and
first deploy · 3 — fixture audio · 4 — ASR module · 5 — extraction with DeepSeek · 6 — quote
verification, event fold, flags · 7 — API routes, uploads, guardrails, metrics, production check.

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
| 2026-09-17 | 00:15–00:25 (approx.) | 0:10 | 5 | Extraction design, DeepSeek spike, prompt, schema, client with retries, tests, live runs on T1–T3, two prompt fixes |
| 2026-09-17 | 00:25–00:45 (approx.) | 0:20 | 6 | Quote verification, status automaton, owners, deadlines, flags, clarifications, comparison with expected results, recorded LLM responses, prompt v4 |
| 2026-09-17 | 00:45–01:25 (approx.) | 0:40 | 7 | Upload and process routes, one pipeline function with streamed progress, guardrails, pricing and metrics, unit tests, local end-to-end runs of four samples and one Blob upload |
| 2026-09-17 | 01:25–02:20, with a break (approx.) | 0:35 | 7 | Deployment configuration: hidden failure cause fixed, health check, keys and Blob token re-entered in Vercel, redeploy, production end-to-end check of a sample and a Blob upload |

**Total so far:** 4:05 of about 8:00.

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
| 2026-09-17 | Cost per operation = recognition + reasoning + billed retries (+ speech and intermediaries, both $0), also at DeepSeek's peak tariff and per audio minute; Blob usage reported as hosting; list prices in `src/lib/pricing.ts` with sources | Follows the brief's cost breakdown; free credits are ignored |
| 2026-09-17 | Samples read from the function bundle (`outputFileTracingIncludes`), not through Blob | Faster, no Blob quota, no dependency on deployment protection; still processed live |
| 2026-09-17 | Per-IP request limit kept in memory | No accounts in scope; on serverless this is only a speed bump, while prepaid and free-credit balances cap the spend |
| 2026-09-17 | `GET /api/health` reports which variables are present, the shape of each key and whether the provider accepts it; never a value | Configuration problems on Vercel were invisible from outside (see Failures and fixes); the probes are free, read-only requests, and the endpoint is rate-limited |

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
