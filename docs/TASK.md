# What the assignment asked for

The assignment arrived by email on 2026-09-16. **Its wording is not reproduced here** — it is the
company's text, and this repository is public. What follows is my own restatement of the
requirements, kept as a checklist because every other document in the repository points back at
it: [PLAN.md](../PLAN.md) maps each requirement to what addresses it, and
[DELIVERY.md](DELIVERY.md) reports the result against the same list.

## The problem

A recorded project discussion goes in. What comes out is the list of things the two people
actually agreed — tasks, who owns them, when they are due — together with the questions nobody
settled. Every entry has to carry the words that justify it. It is a commitments list, not a
meeting summary.

## Scope, fixed by the assignment

- One language, two speakers who can be told apart, at most three minutes of audio.
- The speakers introduce themselves in the recording.
- No requirement to handle people talking over each other.
- Calendar integration and sending tasks anywhere are explicitly out of scope.

## Rules the output must follow

- Report the **final** state of each commitment, not the discussion that led to it.
- "We could" must not become "we will".
- A task that was cancelled must not still be listed as active.
- Never invent an owner or a deadline that nobody agreed to.
- A relative date that the recording does not pin down keeps its wording and is marked as having
  no date context.
- The supporting segment must be playable, at its timestamp.

## The test set

- Write one short fictional conversation containing all five of: a proposal nobody accepts, an
  accepted task, a deadline that gets corrected, a task that gets cancelled, and a task with no
  named owner.
- Ship the recording, an expected commitments list written independently, and a second version of
  the recording in which exactly one agreement changes.
- Cover a normal input, a correction or an ambiguity, and an input where the right behaviour is to
  ask for clarification or refuse to conclude.
- Write the expected outcomes down **before** running anything.
- Check both that real commitments are included and that unsupported ones are excluded.
- The app must process new input; it may not replay prepared answers for the demo files.

## What has to be measured and reported

- Time to a useful result, measured rather than promised.
- Variable cost per operation, broken down into recognition, reasoning, speech, retries and any
  paid middleman, and also expressed per audio minute.
- The pricing assumptions behind those numbers, with hosting costs kept separate.
- Free credits do not count as zero cost.
- The sample inputs with expected versus actual results, and what failed.
- Time spent; the exact AI tools and models used, with one worked example of how their output was
  checked.
- Which components were reused as they are, and what is my own work.
- What is unfinished and what I would do next.

## What to submit

A working demo in the browser, a repository with setup instructions (private access would have
been acceptable), and a walkthrough video of at most three minutes, plus the delivery notes above.

## How it is assessed

Implementation and quality carry 80%: a complete flow that works, behaviour on difficult inputs,
evidence for what it claims, usability, measured speed and cost, and reproducibility. Product
judgment carries 20%: sensible scope, defensible trade-offs, and a clear view of what to improve.
The problem was given; inventing a business around it was explicitly not asked for.

## Working conditions

Build a new prototype inside the assignment window, aiming at about eight focused hours and
describing whatever is left unfinished. Any AI tools, models and libraries may be used, as long as
reused components are identified. Submitting an existing finished product as new work is not
allowed. No accounts, payments or app-store release are required, and the work stays mine.
