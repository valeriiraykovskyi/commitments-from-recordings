# Commitments from recordings

Upload a short recording of a two-person project discussion and get back only what was
actually agreed: tasks, owners and deadlines, plus the questions left open. Every item comes
with a verbatim, timestamped quote you can play. Nothing is inferred: if it was not said, it is
not shown.

A prototype built for a test assignment ([what it asked for](docs/TASK.md)).
**Demo:** https://commitments-from-recordings.vercel.app — the bundled samples and your own
uploads go through the same live pipeline.

## How it works

1. The browser checks the file (type, size, duration) and uploads it to a private Vercel Blob
   store; bundled samples skip the upload.
2. The server checks the duration again before any paid call, then transcribes with Deepgram
   Nova-3 (word timings, speakers, language). Too long, no speech or not English is refused here.
3. DeepSeek (`deepseek-flash`, thinking on) returns, per topic, a history of typed events with
   verbatim quotes: proposed, requested, committed, accepted, tentative, declined, deadline,
   cancelled, reinstated, asked, answered.
4. Code verifies every quote word for word against the transcript, takes timestamps from the
   recognised words, and computes the final state with a tested state machine. Relative dates
   stay as spoken and are flagged.
5. The page shows agreed tasks, unresolved items, and (collapsed) what is not a commitment and
   why, with the transcript, a player for every quote, and the time and cost of the run.

Details, decisions and measurements: [PLAN.md](PLAN.md), [PROGRESS.md](PROGRESS.md),
[docs/DELIVERY.md](docs/DELIVERY.md) (delivery notes), [eval/](eval/) (eval reports),
[fixtures/](fixtures/README.md) (test set).

## Run locally

Requirements: Node.js 22 or newer, npm, and API keys for
[Deepgram](https://console.deepgram.com) and [DeepSeek](https://platform.deepseek.com).
Uploads also need a Vercel Blob store (see Deploy); the bundled samples work without one.

```bash
npm install
cp .env.example .env.local   # fill in DEEPGRAM_API_KEY, DEEPSEEK_API_KEY, BLOB_READ_WRITE_TOKEN
npm run dev                  # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm test        # offline: unit tests plus snapshot tests on recorded provider responses
```

## Eval (live API calls)

Runs every fixture through the same pipeline as the app, N times, and checks each result against
the hand-written expected results: inclusion, exclusion, evidence timestamps. Writes
`eval/<label>.md` and `.json` with git SHA, prompt version, pass rate, timings, tokens and cost.

```bash
npm run eval                                   # 5 fixtures × 3 runs, default configuration
npm run eval -- --fixture t1-launch-sync --runs 5
npm run eval -- --effort low                   # or --no-thinking, --model deepseek-v4-pro
```

## Test set

Scripts, expected results and timelines live in [`fixtures/`](fixtures/README.md); the audio is
in `public/samples/`. To regenerate the audio after changing a script (requires `DEEPGRAM_API_KEY`):

```bash
npm run fixtures -- --force                      # every fixture
npm run fixtures -- --only <id> [--force]        # just one, leaving the committed audio alone
```

To re-record the provider responses that the snapshot tests use:

```bash
npm run asr:snapshot -- --force          # Deepgram
npm run extract -- t1-launch-sync --save # DeepSeek; run once per scripted fixture
```

## Deploy

1. Import the repository into Vercel (Next.js is detected; no build settings needed).
2. Storage → create a Blob store and connect it to the project with the default variable prefix;
   this adds `BLOB_READ_WRITE_TOKEN`.
3. Settings → Environment Variables: add `DEEPGRAM_API_KEY` and `DEEPSEEK_API_KEY` for
   Production (paste without trailing whitespace).
4. Redeploy after changing variables: Vercel injects them at deploy time.
5. Check `https://<your-app>/api/health`: it reports which variables are present and whether each
   provider accepts its key, never the values.

## Project layout

```
src/app/api/{upload,process,health}   API routes: client-upload tokens, streamed processing, config check
src/lib/asr                           Deepgram client and the provider-neutral transcript
src/lib/extraction                    Prompt (versioned), schema, DeepSeek client with retry
src/lib/commitments                   Quote verification, state machine, owners, deadlines, flags
src/lib/pipeline                      One pipeline for the API and the eval; metrics and cost
src/lib/client                        Browser helpers: file checks, upload, NDJSON, segment player
src/components/app                    The UI
scripts/                              Fixture generator, recorded responses, eval, report builder
fixtures/, public/samples/            Test set: scripts, expected results, timelines, audio
eval/                                 Eval reports
```
