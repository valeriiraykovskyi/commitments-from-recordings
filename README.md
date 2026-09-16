# Commitments from recordings

Upload a short recording of a project discussion and get back only what was actually agreed:
tasks, owners and deadlines, plus the questions left open. Every item comes with a verbatim,
timestamped quote you can play.

> Work in progress: a prototype built for a test assignment ([brief](docs/TASK.md)).

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
