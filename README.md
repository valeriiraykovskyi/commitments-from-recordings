# Commitments from recordings

Upload a short recording of a project discussion and get back only what was actually agreed:
tasks, owners and deadlines, plus the questions left open. Every item comes with a verbatim,
timestamped quote you can play.

> Work in progress: a prototype built for a test assignment ([brief](docs/TASK.md)).
> Demo: https://commitments-from-recordings.vercel.app

## Project docs

- [PLAN.md](PLAN.md): scope, architecture, stack, test strategy, work order
- [PROGRESS.md](PROGRESS.md): status, time log, decisions, AI usage log
- [fixtures/](fixtures/README.md): test recordings, scripts and expected results

## Run locally

Requirements: Node.js 22 or newer, npm.

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev                  # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

## Test set

Scripts, expected results and timelines live in [`fixtures/`](fixtures/README.md); the audio is in
`public/samples/`. To regenerate the audio after changing a script (requires `DEEPGRAM_API_KEY`):

```bash
npm run fixtures -- --force
```

To re-record the Deepgram responses that unit tests use:

```bash
npm run asr:snapshot -- --force
```
