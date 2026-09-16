# Test set

Expected results come from the scripts, never from the app's output, and were committed
**before any pipeline code existed**; the git history shows the order. They were drafted with
Claude Code and approved by the author (see the AI usage log in
[PROGRESS.md](../PROGRESS.md)). The app itself uses a different model (DeepSeek).

The audio will be synthesized from the scripts in a later step (see [PLAN.md](../PLAN.md) §8).
That step also adds a timeline recording where each line starts and ends in the audio.

| Fixture | Type | What it checks |
|---|---|---|
| [`t1-launch-sync`](t1-launch-sync/) | Normal input | All five cases from the brief (proposal never accepted, accepted task, corrected deadline, cancelled task, task with no named owner), an open question, and a status update that must not become a task. Relative deadlines have no date context |
| [`t2-migration-kept`](t2-migration-kept/) | One agreement changed | T1 with one line changed; the migration script must move from *cancelled* to *agreed* |
| [`t3-no-intros-hedged`](t3-no-intros-hedged/) | Clarify or decline | No introductions and only hedged talk: nothing may be agreed, and the app must ask who the speakers are |
| [`g1-too-long`](g1-too-long/) | Guardrail | T1 three times in a row (about 4 min): rejected before any paid API call |
| [`g2-spanish`](g2-spanish/) | Guardrail | Spanish speech: rejected after transcription, without an LLM call |

The only dialogue difference between T1 and T2 is line 18:

```diff
- 18. **Anna:** One more thing. Legal says we can't import the old beta accounts, so we don't need the migration script. Let's drop it.
+ 18. **Anna:** One more thing. Legal approved importing the old beta accounts, so we still need the migration script. Let's keep it.
```

## `script.md`

Each dialogue line is a numbered Markdown list item: `N. **Speaker:** text`.
The audio generator reads only these lines; everything else is a comment for people.
Line numbers are referenced by `expected.json`.

## `expected.json`

| Field | Meaning |
|---|---|
| `outcome` | `ok` or `declined` |
| `decline_reason` | Why the input is rejected: `too_long`, `unsupported_language`, … |
| `calls` | Exact number of paid calls per stage (`asr`, `llm`); only the listed stages are checked |
| `clarifications` | Questions the app must ask the user, e.g. `speaker_names` |
| `speakers` | Names the app must resolve from self-introductions, with the line of each introduction |
| `items[].match` | The item is found if its title contains any of these strings (case-insensitive) |
| `items[].kind` / `status` | Accepted values. Statuses: `agreed`, `needs_confirmation`, `not_agreed`, `cancelled` for tasks; `open`, `answered` for questions |
| `items[].owner` | Checked only for agreed tasks. `null` means no owner may be reported |
| `items[].deadline` | Checked only for agreed tasks. `null` means no deadline may be reported. Otherwise the wording must contain one of `match` and none of `not_match`, and the "date not stated in the recording" flag must equal `date_context_missing` |
| `items[].deadline.corrected_from` | The item's history should show the earlier deadline (soft check) |
| `items[].evidence_lines` | Script lines that count as supporting evidence for the item |
| `absent_or_not_agreed` | Things that must not appear as agreed tasks; they may be absent or listed as not agreed |

## How the eval uses it

**Hard checks** (any failure fails the run):

1. `outcome`, `decline_reason`, `calls` and `clarifications` match.
2. The resolved speaker names match, each backed by a quote from its `intro_line`.
3. Every expected item is found exactly once, with an accepted `kind` and `status`.
4. For agreed tasks, `owner` and `deadline` match as described above.
5. **Exclusion:**
   - every agreed task in the output corresponds to an item that is expected to be agreed;
   - items in `absent_or_not_agreed` are never agreed.
6. **Evidence:**
   - every quote is verbatim in the transcript (case and punctuation ignored);
   - every found item has at least one quote that overlaps its `evidence_lines`.

**Soft checks** (reported as warnings): `corrected_from` history, and quotes that come from
lines outside `evidence_lines`.
