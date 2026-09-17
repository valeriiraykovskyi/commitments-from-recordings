# Delivery notes

A prototype for the brief in [TASK.md](TASK.md): a recorded two-person project discussion goes
in; the final agreed tasks, owners, deadlines and open questions come out, each with a verbatim,
timestamped quote that can be played.

- **Demo:** https://commitments-from-recordings.vercel.app — the bundled samples and your own
  uploads go through the same live pipeline; nothing is prepared in advance.
- **Repository:** https://github.com/valeriiraykovskyi/commitments-from-recordings (private;
  setup in [README.md](../README.md)).
- **Video:** _link added by the author_ (script in [VIDEO.md](VIDEO.md)).
- **Plan and log:** [PLAN.md](../PLAN.md) (scope, architecture, stack, test strategy) and
  [PROGRESS.md](../PROGRESS.md) (time log, every decision with its reason, AI usage log,
  failures and fixes).
- **Eval reports:** [eval/](../eval/) — every run, item, token count and cost.

## 1. What the prototype does

1. The browser checks the file (type, size, duration from the audio metadata) and uploads it to a
   private Vercel Blob store; bundled samples skip the upload.
2. The server checks the duration again before any paid call, then sends the audio to
   **Deepgram Nova-3** (word timings, speaker labels, language). A recording over three minutes,
   without speech, or not in English is refused here.
3. **DeepSeek** (`deepseek-flash`, thinking on) reads the numbered transcript and returns first a
   list of every time expression it heard (with the task it belongs to), then, for each topic, a
   history of typed events with verbatim quotes: proposed, requested, committed, accepted,
   tentative, declined, deadline, cancelled, reinstated, asked, answered.
4. **Code verifies every quote** word for word against the transcript and takes timestamps from
   the recognised words, never from the model. A quote that cannot be found drops that event. A
   listed deadline that the model left out of its task's events is attached in code once its
   quote is verified, and flagged as such.
5. **Code decides the final state** with a tested state machine: a task is agreed only through an
   explicit acceptance or self-commitment that was not cancelled later; a tentative answer never
   agrees; owners come only from a commitment or an accepted request; the deadline is the last
   one stated, with the earlier ones kept as history; a relative date stays as spoken and is
   flagged "date not stated in the recording".
6. The page shows three blocks — agreed, unresolved, and (collapsed) what is not a commitment
   and why — plus the transcript, a player for every quote, clarifications ("who is who?" when
   nobody introduced themselves), and the measurements of that run.

## 2. Sample inputs and expected vs actual results

Expected results were written from the scripts and committed before any pipeline code existed
(`fixtures/*/expected.json`; the git history shows the order). The audio was synthesised from
the scripts with Deepgram Aura-2 so that the two versions differ by exactly one line. "Actual"
is the eval on prompt v6 with the default configuration, three runs per fixture, one after
another, with real API calls ([eval/deepseek-flash-high.md](../eval/deepseek-flash-high.md)).

| Fixture | Input | Expected | Actual |
|---|---|---|---|
| **T1 Launch sync** (1:12) | Anna (product manager) and Mark (developer) plan a beta launch: a request that is accepted, a self-commitment whose deadline is corrected, a proposal nobody accepts, an accepted task with no owner, a task cancelled later, an open question, and a report of finished work that must not become a task | Agreed: set up analytics — Mark — "by Wednesday"; write the release notes — Anna — "Monday", corrected from Friday; update the App Store screenshots — no owner — "before the launch". Open question: launching in Canada. Not agreed: dark mode. Cancelled: migration script. Not a task: the sign-up bug that was already fixed. Every deadline flagged as having no date context | 3 of 3 runs match exactly, every quote verbatim and on the expected lines; result after 14.8 s (median), 34.2 s (worst: one run reasoned three times longer); $0.0095 per run |
| **T2 Launch sync, one change** | T1 with line 18 changed: legal approved the import, so the migration script is kept | The migration script becomes agreed — Mark — no deadline; everything else identical to T1 | 3 of 3; 16.7 s (18.1 s); $0.0100 |
| **T3 Undecided talk** (0:45) | Two speakers who never introduce themselves and only talk in hedges: "we should probably", "no promises", "possibly", "not sure", "somebody might" | A clarification asking who the speakers are; zero agreed tasks; the hedged items need confirmation or are not agreed; nothing invented | 3 of 3: "Who is who?" shown, 0 agreed, 2 items need confirmation, the rest not commitments; 14.3 s (16.8 s); $0.0066 |
| **G1 Too long** (3:36) | T1 three times in a row | Refused before any paid call | 3 of 3: refused, 0 paid calls, $0; 1 ms on the server, 34 ms end to end in the browser |
| **G2 Spanish** (0:16) | A short planning talk in Spanish | Refused after recognition, without a model call | 3 of 3: refused as `es`, transcript shown, no model call, 0.5 s, $0.0017 |

**Inclusion and exclusion are both checked.** The comparison fails a run when an expected item is
missing or has the wrong status, owner, deadline wording or flags; when anything outside the
expected list is agreed; when an owner or deadline was invented; or when a quote does not fall on
the expected lines. Earlier results show that the checks bite: on prompt v4 one T2 run lost the
ownerless task's deadline (11 of 15 passed; three more failures were a tooling bug, see §3); on
v5 the eval passed 15 of 15 but a production run missed the same deadline once more (1 of 9 v5
runs), which led to v6; and with thinking switched off the model marked the ownerless task "not
agreed" in five of six T1/T2 runs and duplicated an item twice (4 of 9 passed,
[eval/deepseek-flash-no-thinking.md](../eval/deepseek-flash-no-thinking.md), prompt v5).

## 3. What failed

Everything below is recorded with its fix in
[PROGRESS.md → Failures and fixes](../PROGRESS.md#failures-and-fixes).

- Recognition turned "we could also add a dark mode" into "we can", which would have removed
  the brief's "could" trap. The line was reworded so the transcript keeps "could".
- A 22-second version of T3 was merged into one speaker by diarization; T3 was extended to
  45 seconds, and the app now asks for clarification when it detects fewer than two speakers.
- The deprecated `diarize=true` attributed a short reply to the wrong speaker; the pinned
  `diarize_model=v2` got every fixture line right.
- Six prompt versions were needed. Early ones fixed a deadline that included surrounding words, a
  missing deadline on the ownerless task, and a topic duplicated as a question and a task. The
  eval then caught the ownerless task's deadline missing in 1 of 6 runs; v5 added a self-check in
  words, which lowered the rate (1 of 9) but a production run missed it again. v6 changed the
  shape of the answer: the model lists every time expression before the events, and code
  attaches any listed deadline the model left out, after verifying the quote. On v6 the eval
  passed 15 of 15 and the model attached every deadline itself; the code path stays as a
  safety net.
- The first production deployment failed silently: the keys had been pasted with trailing
  whitespace and the pipeline hid the cause. Keys are now trimmed, causes are logged
  server-side, and `/api/health` reports whether each provider accepts its key. The Blob token
  was added after a deployment and only appeared after a redeploy.
- The quote player only checked the end of a segment on animation frames, which browsers pause
  in hidden tabs, so a quote could run on to the end of the recording; a `timeupdate` backstop
  fixed it.
- The eval's first run sent the 3.6-minute file to Deepgram three times ($0.07 of credits):
  under tsx the duration probe returned null because a nested ESM-only dependency of
  music-metadata broke under CommonJS interop. The project moved to ESM; the app itself, which
  runs under Next, was never affected.
- Two transient model failures (an answer without the required arrays; one network error) were
  caught by the single retry and are counted in the metrics.

## 4. Time spent

About **5:40 of the 8 focused hours**, on 2026-09-16 evening and the night of 2026-09-17
(local time), in this order: brief, brainstorm and planning 0:45 · test set on paper 0:10 ·
scaffold and first deploy 0:20 · fixture audio 0:50 · recognition module 0:15 · extraction 0:10 ·
verification and final state 0:20 · API, uploads, metrics and production configuration 1:15 ·
UI 0:30 · eval, prompts v5 and v6, model comparison 0:45 · README, delivery notes and video
script 0:20. The full log with timestamps is in [PROGRESS.md](../PROGRESS.md#time-log). The video is
recorded by the author after the notes.

## 5. AI tools and models

**In the product**

- Deepgram **Nova-3** (`nova-3`, `diarize_model=v2`, `detect_language`) for recognition.
- DeepSeek **`deepseek-flash`**, thinking on, reasoning effort `high`, JSON mode, prompt version
  `2026-09-17.6` (`src/lib/extraction/prompt.ts`). The eval also measured, on prompt v5, effort
  `low` (as accurate, twice as slow, same cost) and thinking off (fast, wrong in 5 of 9 runs);
  `deepseek-v4-pro` was skipped as unnecessary once the flash model passed everything and three
  times more expensive.
- Deepgram **Aura-2** text-to-speech to synthesise the test recordings (`fixtures/voices.json`).

**For building**

- Claude Code (desktop app) with **Claude Opus 5** (`claude-opus-5`) for planning, the test set,
  the scaffold, recognition, extraction, verification and the API, and **Claude Fable 5.1**
  (`claude-fable-5-1`) for the production check, the UI, the eval, prompts v5 and v6, and these
  notes.
  The work went step by step: each step was discussed and approved before code was written, and
  every model output was checked as described in the AI usage log in
  [PROGRESS.md](../PROGRESS.md#ai-usage-log).

**One example of checking model output.** The extraction model's answers are never shown
directly. Every quote it returns is matched word for word against the transcript in code, and
the timestamps come from the recognised words; anything that does not match is dropped and
listed under "unverified model output". On top of that, the eval compares each result with the
hand-written expected list. That is how the v4 miss was found: run 2 of T2 came back half as
long as usual and without the "before the launch" deadline of the ownerless task; the comparison
reported `store-screenshots: deadline is missing`, prompt v5 added the self-check, and the eval
was run again (15 of 15). A production run checked the same way then missed it once more, which
is why v6 changed the answer's shape (§3) and was measured again. The same habit applied to the coding assistant: for example, the
Deepgram SDK's type definitions were read instead of trusted from memory, which showed that they
omit two fields the API returns, so responses are validated with an explicit schema.

## 6. Time to a useful result (measured)

Measured in the browser from the click and on the server per stage, with the default
configuration on prompt v6 unless stated. Development and eval runs were made from Kyiv;
production runs on Vercel's `iad1` region, close to Deepgram, where recognition is faster.

| What | Measured |
|---|---|
| Transcript on screen (a first useful result) | 1.2–2.8 s after choosing a sample; 4.6 s for a 2.3 MB upload, of which 2.2 s is the upload |
| Full result, T1–T3, eval (9 runs) | median 12.7 s of model time, 14.3–16.7 s median end to end; worst 34.2 s (one run reasoned with 6.4k tokens instead of the usual 2.4k) |
| Full result on production (prompt v6, peak tariff) | T1 sample: transcript after 1.8 s, result after 13.2 s, $0.0114; T2 upload: 2.8 s upload, transcript after 1.0 s, result after 43.1 s (the model reasoned with 9.8k tokens), $0.0193. Both correct |
| Server stages | duration check 1–13 ms · recognition 0.2–2.7 s · model 10–16 s typical, 32 s worst · verification ≤ 6 ms |
| Refusals | too long: 1–34 ms, $0 · non-English: 0.2–1.7 s |
| Variance across prompt versions | v4 (effort `high`): 6–42 s of model time on the same input; v5: 7–16 s; v6: 10–32 s. The tail comes from how long the model reasons, not from recognition |

## 7. Variable cost per operation (measured, list prices)

The app computes the cost of every run from the billed audio seconds and the token usage the
providers return, at list prices, and shows it under "Measurements". For **T1, 72 seconds of
audio**, one run:

| Component | Cost | Basis |
|---|---|---|
| Recognition | $0.0076 | 1.20 min × ($0.0043 Nova-3 + $0.0020 diarization add-on) |
| Reasoning | $0.0019 | about 1.55k input tokens, of which 1.4k served from DeepSeek's prefix cache, plus 2.2–3.6k output tokens (incl. reasoning) at the off-peak tariff |
| Retries | $0 | none in the 15 v6 eval runs; a failed attempt is billed and counted when it happens (once in the 15 v5 runs, +$0.0009) |
| Speech | $0 | the product does not synthesise speech |
| Paid intermediaries | $0 | direct API calls, no middleware services |
| **Per operation** | **$0.0095** off-peak, **$0.0114** at DeepSeek's peak tariff | |
| **Per audio minute** | **$0.0079** off-peak, **$0.0095** at peak | recognition is about 80% of it |

Other fixtures: T2 $0.0099, T3 (45 s) $0.0067, G2 $0.0017 (recognition only), G1 $0.

**Pricing assumptions** (`src/lib/pricing.ts`, checked 2026-09-17):

- Deepgram Nova-3 pre-recorded, pay-as-you-go: $0.0043 per minute; speaker diarization listed as
  a $0.0020 per minute add-on and counted to stay on the safe side
  (https://deepgram.com/pricing). `detect_language` is assumed not to change the price.
- DeepSeek `deepseek-flash`: $0.15 per 1M cache-miss input tokens, $0.003 cache-hit, $0.60 output
  off-peak; double at peak (Mon–Fri 01:00–04:00 and 06:00–10:00 UTC)
  (https://api-docs.deepseek.com/quick_start/pricing). The app applies the tariff of the moment
  and reports the peak figure as the worst case.
- Vercel Blob at Pro rates: $5 per million advanced operations, $0.40 per million simple ones,
  $0.05 per GB transferred (https://vercel.com/docs/vercel-blob/usage-and-pricing).

**Free credits are not zero cost.** Development and the demo run on Deepgram's $200 starter
credit and a prepaid DeepSeek balance, but every figure above is a list price. As a check of the
calculator, the three eval runs on prompt v5 reduced the DeepSeek balance by $0.08, against a
list-price estimate of about $0.09 for their model share. Deepgram's balance is not exposed by
its API for this key; usage is visible in its console.

**Hosting, separately.** The demo runs on Vercel's Hobby plan, which is free for non-commercial
use; commercial use needs Pro at $20 per member per month plus usage. Blob usage for one upload
of 2.3 MB is about $0.0001 at Pro rates, and uploads are deleted right after processing, so
storage is negligible. Function execution stays within the plan's included quota for this demo
and is not metered separately here.

## 8. Reused components and own work

**Reused as they are:** Next.js 16 (App Router) and React 19; Tailwind CSS 4; shadcn/ui
components on Base UI (button, alert, collapsible, tooltip) and Lucide icons; Zod; Vitest and
tsx; `music-metadata` for the duration probe; `@vercel/blob` for client uploads and private
storage; `@deepgram/sdk` as the HTTP client for recognition and speech synthesis; Vercel for
hosting.

**Our own work:** everything under `src/lib` (transcript normalisation with our own utterance
grouping, the extraction prompt, schema and client with retry and validation, quote verification,
the status state machine, owner and deadline resolution, flags and clarifications, the pipeline,
the metrics and the cost calculator), the API routes (`upload`, `process`, `health`), the whole
UI in `src/components/app` and the client helpers, the fixture generator and the eval
(`scripts/`), the fixtures, the expected results, and these documents. Recorded provider
responses under `fixtures/` are real API outputs kept as test data.

## 9. Unfinished parts and what to improve next

- **Human voices.** The fixtures are synthesised. The prompt is written from general rules and a
  unit test keeps fixture sentences out of it, but a holdout recording with real voices is the
  honest test, and it was cut for time.
- **Correcting speakers in the UI.** Diarization can mislabel short replies; the app flags a
  mismatch, and a wrong self-introduction mapping could be fixed by the user without re-running
  the model. Designed, not built.
- **Eval on a clean commit and more runs.** The committed reports were produced with the
  prompt and ESM changes uncommitted (marked in the reports). Five runs per fixture would
  tighten the variance figures.
- **Latency and its tail.** The model is 80–90% of the wait (10–17 s typical), and two of the
  twelve v6 runs on T1–T3 reasoned three to four times longer (32 s and 42 s), which also
  doubles their cost. Options to measure next: a cap on reasoning tokens with a quality check,
  or streaming items as they are verified.
- **Relative dates.** If a recording states its own date, weekdays could be resolved with the
  anchor shown as evidence. Today every relative date is kept as spoken and flagged.
- **Robustness of verification.** Quotes must match word for word; real recordings with
  recognition errors may need tolerant matching, with the mismatch shown.
- **Data location.** DeepSeek stores requests in the PRC and may use them for training. Fine for
  fictional test data; for real client recordings the thin adapter lets the provider be swapped,
  and the cost report would change with it.
- **Operations.** The per-IP rate limit lives in memory, which on serverless is only a speed
  bump; prepaid balances cap the spend. A real deployment needs a shared limiter and sign-in.
- **Small things.** Microphone recording, export as Markdown or JSON, friendlier wording of the
  "reason" line on each item.

## 10. Reproducing the measurements

```bash
npm install && cp .env.example .env.local   # fill in DEEPGRAM_API_KEY and DEEPSEEK_API_KEY
npm test                                     # offline: 173 unit and snapshot tests
npm run eval                                 # live: 5 fixtures × 3 runs, writes eval/*.md and *.json
npm run eval -- --fixture t1-launch-sync --effort low --runs 3   # a comparison configuration
```

The eval report records the git SHA, the prompt version, both model IDs, and per run the time of
each stage, the number of attempts, the token counts and the cost.
