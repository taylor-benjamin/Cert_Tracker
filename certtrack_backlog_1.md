# CertTrack — Sprint Zero Planning Draft
**Product idea:** A study progress tracker for people preparing for professional certifications (e.g., AWS, PMP, CompTIA, CPA). Users log study sessions, track hours toward a target, take practice quizzes, and monitor readiness for their exam date.

*Adjust anything here — feature wording, priorities, points, and sprint scope are all starting suggestions for your team discussion, not final answers.*

---

## 1. Product Backlog (33 features, prioritized)

| # | Feature | Priority |
|---|---------|----------|
| 1 | User can sign up with email/password | High |
| 2 | User can log in / log out | High |
| 3 | User can reset a forgotten password | High |
| 4 | User can create a certification goal (name + target exam) | High |
| 5 | User can set a target exam date for a certification goal | High |
| 6 | User can add multiple certification goals | High |
| 7 | User can log a study session (topic, duration, date) | High |
| 8 | User can view a list of past study sessions | High |
| 9 | User can edit or delete a logged study session | High |
| 10 | User can view total hours studied per certification | High |
| 11 | User can view a progress bar toward a study-hour goal | High |
| 12 | User can view a dashboard summarizing all active goals | High |
| 13 | User can set a weekly study-hour target | Medium |
| 14 | User can categorize study sessions by topic/domain | Medium |
| 15 | System reminds user if daily/weekly goal isn't met | Medium |
| 16 | System reminds user as exam date approaches | Medium |
| 17 | User can take a practice quiz for a certification topic | Medium |
| 18 | User can view quiz score history over time | Medium |
| 19 | User can see an overall exam-readiness score | Medium |
| 20 | User can attach study resources (links/PDFs) to a goal | Medium |
| 21 | User can view a calendar view of study sessions | Medium |
| 22 | User can view a streak counter (consecutive study days) | Medium |
| 23 | User can mark a certification goal as passed/completed | Medium |
| 24 | User can filter/search sessions by topic or date range | Medium |
| 25 | User can export study history to CSV/PDF | Low |
| 26 | User can earn badges for milestones (e.g., 50 hrs studied) | Low |
| 27 | User can join a study group with others on the same cert | Low |
| 28 | User can share progress with a group or friends | Low |
| 29 | User can compare pace vs. average time-to-certify | Low |
| 30 | User can sync data across devices (mobile + web) | Low |
| 31 | User can switch app theme (light/dark mode) | Low |
| 32 | App suggests study resources based on chosen cert | Low |
| 33 | Admin can manage the list of supported certifications | Low |

---

## 2. Sample User Stories (Sprint 1 candidates)

| ID | User Story | Story Points |
|----|-----------|---------------|
| US-1 | As a new user, I want to sign up with email/password so I can create my account. | 3 |
| US-2 | As a returning user, I want to log in and out so my data stays private. | 2 |
| US-3 | As a user, I want to reset my password so I'm not locked out if I forget it. | 3 |
| US-4 | As a user, I want to create a certification goal with a target exam date so I can start tracking progress toward it. | 5 |
| US-5 | As a user, I want to log a study session (topic, duration, date) so my effort is recorded. | 5 |
| US-6 | As a user, I want to view my past study sessions so I can review what I've covered. | 3 |
| US-7 | As a user, I want to see total hours studied and a progress bar toward my goal so I know how close I am. | 8 |
| US-8 | As a user, I want a dashboard summarizing all my active certification goals so I can see everything at a glance. | 5 |

**Sample Planning Poker notes (for your write-up):**
Story points were assigned relative to US-2 (login/logout), treated as the team's "2" baseline since it's a simple, well-understood pattern. Account creation (US-1) and password reset (US-3) came in at 3 — similar complexity, plus edge cases like validation and email delivery. Logging a session (US-5) and creating a goal (US-4) were both estimated at 5 due to needing new data models and form validation. The progress bar/hours dashboard (US-7) was the most debated — some team members estimated 5, others 8, because it depends on data from US-4 and US-5 being finished first and requires new calculation logic; the team settled on 8 after discussing that dependency risk. The summary dashboard (US-8) was estimated at 5 since it mostly aggregates data the team is already building elsewhere.

---

## 3. Sprint Backlog (committed to Sprint 1)

| User Story | Points |
|---|---|
| US-1: Sign up | 3 |
| US-2: Log in/out | 2 |
| US-3: Password reset | 3 |
| US-4: Create certification goal | 5 |
| US-5: Log a study session | 5 |
| US-6: View past sessions | 3 |
| US-7: Progress bar / hours tracker | 8 |
| US-8: Dashboard summary | 5 |
| **Total** | **34** |

Once your team finalizes this list, treat it as locked for the sprint — new ideas go back into the Product Backlog for a future sprint, not into this one.

---

## 4. Mock Burndown Chart

Assuming a 10-workday sprint and 34 total story points, the **ideal burndown line** drops evenly by 3.4 points/day:

| Day | Ideal Remaining Points |
|---|---|
| 0 | 34 |
| 1 | 30.6 |
| 2 | 27.2 |
| 3 | 23.8 |
| 4 | 20.4 |
| 5 | 17.0 |
| 6 | 13.6 |
| 7 | 10.2 |
| 8 | 6.8 |
| 9 | 3.4 |
| 10 | 0 |

A companion PNG chart (ideal line vs. a sample "actual" line) is attached — swap in your team's real numbers once you track daily progress during the sprint.

---

## 5. Retrospective (placeholder structure)

- **What went well:** *(fill in after Sprint 1)*
- **What was harder than expected:** *(fill in)*
- **What we'll change for the next planning cycle:** *(fill in)*
