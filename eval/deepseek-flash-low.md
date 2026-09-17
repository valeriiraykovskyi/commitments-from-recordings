# Eval — deepseek-flash-low

Created 2026-09-17T00:24:01.751Z. Git `ea8052f` (with uncommitted changes). Prompt 2026-09-17.5.
Recognition: Deepgram nova-3, diarizer v2. Model: DeepSeek deepseek-flash, thinking on, effort low. 3 runs per fixture, one after another, with real API calls.
Costs are list prices at the DeepSeek tariff in force during each run; "at peak" is the same run at the peak tariff. Free credits are not subtracted. Hosting is not included.

**9 of 9 runs passed.** A run passes when every expected item is found with the right status, owner, deadline wording and flags, nothing outside the expected list is agreed, and every quote falls on the expected lines.

## Summary

| Fixture | Passed | Outcome | Result after (median / worst) | Model (median / worst) | Model attempts (median / worst) | Cost per run (median / worst) | At peak (median) | Per audio minute (median) |
|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 3/3 | ok | 28.1 s / 30.0 s | 26.4 s / 28.5 s | 1 / 1 | $0.0119 / $0.0121 | $0.0162 | $0.0099 |
| t2-migration-kept | 3/3 | ok | 30.8 s / 39.0 s | 29.4 s / 36.6 s | 1 / 1 | $0.0125 / $0.0127 | $0.0174 | $0.0104 |
| t3-no-intros-hedged | 3/3 | ok | 30.4 s / 31.0 s | 27.8 s / 29.5 s | 1 / 1 | $0.0089 / $0.0089 | $0.0129 | $0.0116 |

## Failures

None.

## Warnings

Soft checks: evidence outside the expected lines, missing deadline history, or model claims that were dropped because they could not be verified.

- t3-no-intros-hedged, run 1: item "onboarding-review": some evidence is outside lines 1, 2

## Runs

| Fixture | Run | Passed | Outcome | Total | Recognition | Model | Attempts | Tokens in (cached) / out (reasoning) | Cost (off-peak / at peak) |
|---|---|---|---|---|---|---|---|---|---|
| t1-launch-sync | 1 | yes | ok | 28.1 s | 1.7 s | 26.4 s | 1 | 1627 (0) / 7044 (5863) | $0.0121 / $0.0165 |
| t1-launch-sync | 2 | yes | ok | 30.0 s | 1.5 s | 28.5 s | 1 | 1627 (1408) / 7095 (6290) | $0.0119 / $0.0162 |
| t1-launch-sync | 3 | yes | ok | 15.3 s | 2.1 s | 13.2 s | 1 | 1627 (1408) / 3471 (2338) | $0.0097 / $0.0118 |
| t2-migration-kept | 1 | yes | ok | 12.5 s | 1.6 s | 10.9 s | 1 | 1623 (1280) / 2862 (1858) | $0.0093 / $0.0111 |
| t2-migration-kept | 2 | yes | ok | 30.8 s | 1.4 s | 29.4 s | 1 | 1623 (1408) / 8108 (6913) | $0.0125 / $0.0174 |
| t2-migration-kept | 3 | yes | ok | 39.0 s | 2.4 s | 36.6 s | 1 | 1623 (1408) / 8551 (7783) | $0.0127 / $0.0179 |
| t3-no-intros-hedged | 1 | yes | ok | 26.8 s | 2.0 s | 24.8 s | 1 | 1466 (1024) / 6261 (5501) | $0.0086 / $0.0125 |
| t3-no-intros-hedged | 2 | yes | ok | 31.0 s | 1.5 s | 29.5 s | 1 | 1466 (1280) / 6808 (6343) | $0.0089 / $0.0130 |
| t3-no-intros-hedged | 3 | yes | ok | 30.4 s | 2.6 s | 27.8 s | 1 | 1466 (1280) / 6712 (6245) | $0.0089 / $0.0129 |

## Results per run

### t1-launch-sync, run 1: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script — owner Mark — committed @ 26.5–29.3 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode — deadline "before the launch", flags date_not_stated — proposed @ 31.4–34.3 s, deadline @ 34.3–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.0 s, deadline @ 41.0–41.8 s, accepted @ 42.5–43.1 s
- [question/open] Launch in Canada at the same time? — asked @ 44.7–47.6 s

### t1-launch-sync, run 2: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–25.7 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.2–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 66.2–67.3 s
- [task/not_agreed] Build a dark mode before the launch — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots before the launch — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Launching in Canada at the same time — asked @ 44.7–47.6 s

### t1-launch-sync, run 3: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/cancelled] Write a migration script for the old beta users — owner Mark — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s, cancelled @ 64.2–67.3 s
- [task/not_agreed] Build a dark mode before the launch — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 43.1–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 1: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–25.7 s, deadline @ 24.8–25.7 s, deadline @ 56.3–57.7 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode before the launch — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.3–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 2: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–21.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–24.8 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.7 s, accepted @ 58.3–59.6 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–28.0 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode before the launch — deadline "before the launch", flags date_not_stated — proposed @ 31.4–34.3 s, deadline @ 34.3–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots before the launch — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.0 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Are we launching in Canada at the same time? — asked @ 44.7–47.6 s

### t2-migration-kept, run 3: pass

Speakers: S0 = Anna, S1 = Mark.

- [task/agreed] Set up analytics on the landing page — owner Mark, deadline "by Wednesday", flags date_not_stated — requested @ 16.5–19.6 s, accepted @ 19.8–20.5 s, committed @ 20.5–22.3 s, deadline @ 21.3–22.3 s
- [task/agreed] Write the release notes — owner Anna, deadline "Monday", flags date_not_stated, deadline_changed — committed @ 23.5–25.7 s, deadline @ 24.8–25.7 s, deadline @ 56.9–57.2 s, accepted @ 58.3–59.6 s
- [task/agreed] Write a migration script for the old beta users — owner Mark, flags no_deadline — committed @ 26.5–29.3 s, accepted @ 30.1–31.0 s
- [task/not_agreed] Build a dark mode before the launch — deadline "before the launch", flags date_not_stated — proposed @ 31.4–36.0 s, deadline @ 34.2–35.3 s, declined @ 36.3–37.9 s
- [task/agreed] Update the App Store screenshots — deadline "before the launch", flags no_owner, date_not_stated — proposed @ 38.3–41.8 s, deadline @ 41.0–41.8 s, accepted @ 42.5–44.4 s
- [question/open] Launching in Canada at the same time — asked @ 44.7–47.6 s

### t3-no-intros-hedged, run 1: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/not_agreed] Look at the onboarding flow — deadline "next week", flags date_not_stated — proposed @ 3.0–5.5 s, tentative @ 9.5–12.6 s, deadline @ 10.5–11.2 s, declined @ 21.7–24.9 s
- [task/not_agreed] Refresh the pricing page — proposed @ 15.2–17.7 s, declined @ 21.7–24.9 s
- [task/not_agreed] Move the team demo — proposed @ 25.7–27.3 s, declined @ 29.1–32.2 s
- [task/not_agreed] Look at the support inbox — proposed @ 32.6–34.4 s, proposed @ 37.5–39.3 s

### t3-no-intros-hedged, run 2: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at onboarding flow — deadline "at some point", flags date_not_stated — proposed @ 3.0–5.5 s, deadline @ 4.6–5.5 s, tentative @ 9.5–12.6 s
- [task/not_agreed] Refresh pricing page — proposed @ 15.2–17.7 s, tentative @ 20.6–21.4 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–30.3 s
- [task/not_agreed] Support inbox — proposed @ 32.6–34.4 s, proposed @ 37.5–39.3 s

### t3-no-intros-hedged, run 3: pass

Clarifications: speaker_names.

Speakers: S0 = unnamed, S1 = unnamed.

- [task/needs_confirmation] Look at the onboarding flow — deadline "at some point", flags date_not_stated — proposed @ 3.0–5.5 s, deadline @ 4.6–5.5 s, tentative @ 9.5–12.6 s
- [task/not_agreed] Pricing page refresh — proposed @ 15.2–17.7 s, tentative @ 20.6–21.4 s, declined @ 21.7–24.9 s
- [task/needs_confirmation] Move the team demo — proposed @ 25.7–27.3 s, tentative @ 29.1–30.3 s
- [task/not_agreed] Support inbox — proposed @ 32.6–34.4 s, proposed @ 37.5–39.3 s
