# Eval — deepseek-flash-no-thinking

Created 2026-09-17T00:24:34.390Z. Git `ea8052f` (with uncommitted changes). Prompt 2026-09-17.5.
Recognition: Deepgram nova-3, diarizer v2. Model: DeepSeek deepseek-flash, thinking off. 3 runs per fixture, one after another, with real API calls.
Costs are list prices at the DeepSeek tariff in force during each run; "at peak" is the same run at the peak tariff. Free credits are not subtracted. Hosting is not included.

**4 of 9 runs passed.** A run passes when every expected item is found with the right status, owner, deadline wording and flags, nothing outside the expected list is agreed, and every quote falls on the expected lines.

## Summary

| Fixture | Passed | Outcome | Result after (median / worst) | Model (median / worst) | Model attempts (median / worst) | Cost per run (median / worst) | At peak (median) | Per audio minute (median) |
|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 1/3 | ok | 4.0 s / 5.3 s | 3.3 s / 3.5 s | 1 / 1 | $0.0082 / $0.0084 | $0.0089 | $0.0068 |
| t2-migration-kept | 0/3 | ok | 3.7 s / 3.8 s | 3.2 s / 3.4 s | 1 / 2 | $0.0082 / $0.0082 | $0.0087 | $0.0068 |
| t3-no-intros-hedged | 3/3 | ok | 2.7 s / 2.7 s | 2.2 s / 2.3 s | 1 / 1 | $0.0052 / $0.0052 | $0.0055 | $0.0068 |

## Failures

- t1-launch-sync, run 1: item "store-screenshots": deadline is missing
- t1-launch-sync, run 3: item "store-screenshots": status is not_agreed, expected agreed
- t2-migration-kept, run 1: item "store-screenshots": status is not_agreed, expected agreed
- t2-migration-kept, run 1: item "migration-script": found 2 matching items, expected 1
- t2-migration-kept, run 2: item "store-screenshots": status is not_agreed, expected agreed
- t2-migration-kept, run 3: item "store-screenshots": status is not_agreed, expected agreed
- t2-migration-kept, run 3: item "migration-script": found 2 matching items, expected 1

## Warnings

Soft checks: evidence outside the expected lines, missing deadline history, or model claims that were dropped because they could not be verified.

- t1-launch-sync, run 1: item "release-notes": history does not show the earlier deadline friday

## Runs

| Fixture | Run | Passed | Outcome | Total | Recognition | Model | Attempts | Tokens in (cached) / out (reasoning) | Cost (off-peak / at peak) |
|---|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 1 | no | ok | 5.3 s | 2.0 s | 3.3 s | 1 | 1602 (0) / 903 (0) | $0.0084 / $0.0092 |
| t1-launch-sync | 2 | yes | ok | 4.0 s | 0.5 s | 3.5 s | 1 | 1602 (1408) / 1030 (0) | $0.0082 / $0.0089 |
| t1-launch-sync | 3 | no | ok | 3.7 s | 0.4 s | 3.2 s | 1 | 1602 (1408) / 901 (0) | $0.0082 / $0.0087 |
| t2-migration-kept | 1 | no | ok | 3.7 s | 0.3 s | 3.4 s | 1 | 1598 (1280) / 1032 (0) | $0.0082 / $0.0089 |
| t2-migration-kept | 2 | no | ok | 3.5 s | 0.5 s | 3.0 s | 2 | 1598 (1408) / 819 (0) | $0.0081 / $0.0086 |
| t2-migration-kept | 3 | no | ok | 3.8 s | 0.6 s | 3.2 s | 1 | 1598 (1408) / 919 (0) | $0.0082 / $0.0087 |
| t3-no-intros-hedged | 1 | yes | ok | 2.7 s | 0.4 s | 2.3 s | 1 | 1441 (1024) / 579 (0) | $0.0052 / $0.0056 |
| t3-no-intros-hedged | 2 | yes | ok | 2.6 s | 0.4 s | 2.2 s | 1 | 1441 (1280) / 528 (0) | $0.0052 / $0.0055 |
| t3-no-intros-hedged | 3 | yes | ok | 2.7 s | 0.5 s | 2.2 s | 1 | 1441 (1280) / 482 (0) | $0.0051 / $0.0055 |

## Results per run

### t1-launch-sync, run 1: FAIL

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday instead", flags date_not_stated — committed @ 23.5–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode before the launch — proposed @ 31.4–36.0 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — flags no_owner, no_deadline — proposed @ 38.3–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t1-launch-sync, run 2: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode before the launch — proposed @ 31.4–36.0 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots before the launch — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, committed @ 43.1–44.4 s, deadline @ 41.0–41.8 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t1-launch-sync, run 3: FAIL

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 17.2–19.6 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, cancelled @ 64.2–67.3 s
- [task/not_agreed] Build a dark mode before the launch — proposed @ 31.4–36.0 s, declined @ 36.3–37.9 s
- [task/not_agreed] Update the App Store screenshots — deadline "before the launch", flags date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s
- [question/open] Launch in Canada at the same time — asked @ 44.7–47.6 s

### t2-migration-kept, run 1: FAIL

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s
- [task/not_agreed] Build a dark mode before the launch — proposed @ 31.4–36.0 s, declined @ 36.3–37.9 s
- [task/not_agreed] Update the App Store screenshots before the launch — proposed @ 38.3–41.8 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s
- [task/agreed] Keep the migration script for importing the old beta accounts — owner Anna, flags no_deadline — committed @ 66.1–67.2 s, accepted @ 67.5–68.1 s

### t2-migration-kept, run 2: FAIL

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–28.0 s
- [task/not_agreed] Build a dark mode before the launch — proposed @ 31.4–36.0 s, declined @ 36.3–37.9 s
- [task/not_agreed] Update the App Store screenshots before the launch — proposed @ 38.3–41.8 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 3: FAIL

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s
- [task/not_agreed] Build a dark mode — proposed @ 31.4–35.3 s, declined @ 36.3–37.9 s
- [task/not_agreed] Update the App Store screenshots — proposed @ 38.3–41.8 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s
- [task/not_agreed] Keep the migration script — reinstated @ 66.1–67.2 s

### t3-no-intros-hedged, run 1: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Work on the onboarding flow — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–30.3 s
- [task/needs_confirmation] Look at the support inbox — proposed @ 32.6–34.4 s, tentative @ 37.5–40.8 s

### t3-no-intros-hedged, run 2: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, declined @ 21.7–24.9 s
- [task/not_agreed] Move the team demo — proposed @ 25.7–27.3 s
- [task/not_agreed] Look at the support inbox — proposed @ 32.6–34.4 s, proposed @ 37.5–39.3 s

### t3-no-intros-hedged, run 3: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, declined @ 21.7–24.9 s
- [question/open] Move the team demo — asked @ 25.7–28.5 s
- [task/not_agreed] Look at the support inbox — proposed @ 32.6–34.4 s
