# Eval — deepseek-flash-high

Created 2026-09-18T10:59:48.683Z. Git `eed20cb` (with uncommitted changes). Prompt 2026-09-17.6.
Recognition: Deepgram nova-3, diarizer v2. Model: DeepSeek deepseek-flash, thinking on, effort high. 3 runs per fixture, one after another, with real API calls.
Costs are list prices at the DeepSeek tariff in force during each run; "at peak" is the same run at the peak tariff. Free credits are not subtracted. Hosting is not included.

**15 of 15 runs passed.** A run passes when every expected item is found with the right status, owner, deadline wording and flags, nothing outside the expected list is agreed, and every quote falls on the expected lines.

## Summary

| Fixture | Passed | Outcome | Result after (median / worst) | Model (median / worst) | Model attempts (median / worst) | Cost per run (median / worst) | At peak (median) | Per audio minute (median) |
|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 3/3 | ok | 14.6 s / 51.3 s | 13.1 s / 49.6 s | 1 / 1 | $0.0098 / $0.0160 | $0.0120 | $0.0082 |
| t2-migration-kept | 3/3 | ok | 19.0 s / 36.1 s | 16.9 s / 33.2 s | 1 / 1 | $0.0104 / $0.0127 | $0.0132 | $0.0086 |
| t3-no-intros-hedged | 3/3 | ok | 27.5 s / 30.5 s | 26.1 s / 29.0 s | 1 / 1 | $0.0087 / $0.0092 | $0.0126 | $0.0114 |
| g1-too-long | 3/3 | declined (too_long) | 0.0 s / 0.0 s | 0.0 s / 0.0 s | 0 / 0 | $0.0000 / $0.0000 | $0.0000 | $0.0000 |
| g2-spanish | 3/3 | declined (unsupported_language) | 0.5 s / 1.6 s | 0.0 s / 0.0 s | 0 / 0 | $0.0017 / $0.0017 | $0.0017 | $0.0063 |

## Failures

None.

## Warnings

Soft checks: evidence outside the expected lines, missing deadline history, or model claims that were dropped because they could not be verified.

None.

## Runs

| Fixture | Run | Passed | Outcome | Total | Recognition | Model | Attempts | Tokens in (cached) / out (reasoning) | Cost (off-peak / at peak) |
|---|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 1 | yes | ok | 14.6 s | 1.5 s | 13.1 s | 1 | 1705 (1536) / 3665 (2374) | $0.0098 / $0.0120 |
| t1-launch-sync | 2 | yes | ok | 51.3 s | 1.7 s | 49.6 s | 1 | 1705 (1536) / 13920 (12657) | $0.0160 / $0.0244 |
| t1-launch-sync | 3 | yes | ok | 12.1 s | 2.4 s | 9.7 s | 1 | 1705 (1536) / 2914 (1631) | $0.0094 / $0.0111 |
| t2-migration-kept | 1 | yes | ok | 36.1 s | 2.8 s | 33.2 s | 1 | 1701 (1536) / 8485 (7628) | $0.0127 / $0.0178 |
| t2-migration-kept | 2 | yes | ok | 19.0 s | 2.1 s | 16.9 s | 1 | 1701 (1536) / 4651 (3417) | $0.0104 / $0.0132 |
| t2-migration-kept | 3 | yes | ok | 15.0 s | 1.8 s | 13.3 s | 1 | 1701 (1536) / 3787 (2564) | $0.0099 / $0.0122 |
| t3-no-intros-hedged | 1 | yes | ok | 30.5 s | 1.5 s | 29.0 s | 1 | 1544 (1408) / 7318 (6810) | $0.0092 / $0.0136 |
| t3-no-intros-hedged | 2 | yes | ok | 12.2 s | 1.3 s | 10.8 s | 1 | 1544 (1408) / 3051 (2388) | $0.0067 / $0.0085 |
| t3-no-intros-hedged | 3 | yes | ok | 27.5 s | 1.4 s | 26.1 s | 1 | 1544 (1408) / 6461 (5674) | $0.0087 / $0.0126 |
| g1-too-long | 1 | yes | declined (too_long) | 0.0 s | 0.0 s | 0.0 s | 0 | — | $0.0000 / $0.0000 |
| g1-too-long | 2 | yes | declined (too_long) | 0.0 s | 0.0 s | 0.0 s | 0 | — | $0.0000 / $0.0000 |
| g1-too-long | 3 | yes | declined (too_long) | 0.0 s | 0.0 s | 0.0 s | 0 | — | $0.0000 / $0.0000 |
| g2-spanish | 1 | yes | declined (unsupported_language) | 1.6 s | 1.6 s | 0.0 s | 0 | — | $0.0017 / $0.0017 |
| g2-spanish | 2 | yes | declined (unsupported_language) | 0.5 s | 0.5 s | 0.0 s | 0 | — | $0.0017 / $0.0017 |
| g2-spanish | 3 | yes | declined (unsupported_language) | 0.3 s | 0.3 s | 0.0 s | 0 | — | $0.0017 / $0.0017 |

## Results per run

### t1-launch-sync, run 1: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–25.7 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 64.2–67.3 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.3–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t1-launch-sync, run 2: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–34.3 s, deadline @ 34.3–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.0 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t1-launch-sync, run 3: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–25.7 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 1: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Launching in Canada at the same time — asked @ 44.7–47.6 s

### t2-migration-kept, run 2: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 3: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t3-no-intros-hedged, run 1: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — deadline "next week", flags date_not_stated — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s, deadline @ 10.5–11.2 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, tentative @ 20.6–21.4 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–32.2 s
- [task/not_agreed] Look at the support inbox — proposed @ 32.6–34.4 s, proposed @ 37.5–40.8 s

### t3-no-intros-hedged, run 2: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — deadline "next week", flags date_not_stated — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s, deadline @ 10.5–11.2 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–30.3 s
- [task/needs_confirmation] Look at the support inbox — proposed @ 32.6–34.4 s, tentative @ 37.5–40.8 s

### t3-no-intros-hedged, run 3: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — deadline "next week", flags date_not_stated, deadline_changed — proposed @ 3.0–4.6 s, deadline @ 4.6–5.5 s, tentative @ 9.5–12.6 s, deadline @ 10.5–11.2 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, tentative @ 20.6–21.4 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–32.2 s
- [task/not_agreed] Look at the support inbox — proposed @ 32.6–34.4 s, declined @ 37.5–40.8 s

### g1-too-long, run 1: pass

No items (declined: too_long).

### g1-too-long, run 2: pass

No items (declined: too_long).

### g1-too-long, run 3: pass

No items (declined: too_long).

### g2-spanish, run 1: pass

No items (declined: unsupported_language).

### g2-spanish, run 2: pass

No items (declined: unsupported_language).

### g2-spanish, run 3: pass

No items (declined: unsupported_language).
