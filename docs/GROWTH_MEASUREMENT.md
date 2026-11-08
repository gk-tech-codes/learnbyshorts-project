# LearnByShorts Growth Measurement

This plan turns product events into testable retention and revenue questions.
It does not treat traffic, clicks, or self-reported readiness as proof of
learning outcomes.

## Primary learner journey

| Stage | Event | Success measure |
| --- | --- | --- |
| Discovery | `landing_view` | Qualified visits by privacy-safe channel |
| Role intent | `rolesprint_plan_created` | Visitors who generate a role-based practice plan |
| Role activation | first complete RoleSprint mission | Plan creators who complete all five steps for one day |
| Direction | `path_finder_complete` | Visitors who receive a recommended path |
| Course intent | `course_landing_view` | Recommended-path visitors who open a full course |
| Activation | first proof-mission completion | Visitors who complete meaningful work |
| Habit | `weekly_challenge_update` | Activated learners completing three missions in seven days |
| Return | `learner_return` | Learners returning in a 2–7 or 8–30 day bucket |
| Interview value | readiness plan generated | Learners who receive a focused two-week practice plan |
| Advocacy | `course_landing_share` or `interview_readiness_share` | Learners who voluntarily share a path or private score summary |
| Revenue intent | `founding_access_interest` or `course_complete_offer` | Activated learners requesting the $29 founding offer |
| Revenue | confirmed payment | Paid learners recorded from payment evidence, never inferred from clicks |

No event may contain an email address, learner answer, prompt, resume text,
project text, exact referrer URL, access token, or other learner-provided
content. Global Privacy Control and Do Not Track remain respected.

RoleSprint is stricter than the site-wide baseline: it does not load its
analytics library until the visitor explicitly opts in. Its event names and
fields are allow-listed in code, and its page-view URL excludes query
parameters so a shared plan configuration is not transmitted.

## First 30-day decisions

Review weekly, but do not make a decision before there is enough traffic to
avoid reacting to a handful of visits.

1. If path-finder completion is low, simplify the questions and show a sample
   recommendation before asking for input.
2. If course opens are healthy but mission activation is low, improve the first
   mission's clarity and reduce setup work.
3. If activation is healthy but seven-day return is low, improve the Learning
   OS handoff and weekly challenge—not notification spam.
4. If course completion is healthy but founding interest is low, interview
   learners before changing price.
5. If interest exists but payment does not, add a reputable hosted checkout
   only after terms, refunds, taxes, and support operations are ready.
6. Expand course selection only when search impressions, path selection, or
   learner requests show demand. Avoid thin keyword pages.

## Weekly dashboard

Archive a CSV or PDF export with the date range and definitions.

| Metric | Calculation |
| --- | --- |
| RoleSprint plan rate | `rolesprint_plan_created` / qualified RoleSprint sessions |
| RoleSprint activation | learners completing one five-step day / RoleSprint plan creators |
| RoleSprint Day-7 retention | plan creators completing a step on days 6–8 / activated RoleSprint learners |
| Path recommendation rate | `path_finder_complete` / qualified landing sessions |
| Course activation rate | learners completing one mission / `course_landing_view` learners |
| Three-mission rate | learners reaching three weekly missions / activated learners |
| Seven-day return rate | 2–7 day `learner_return` learners / activated learners |
| Course completion rate | learners completing four missions / activated learners |
| Founding interest rate | unique founding-interest learners / activated learners |
| Paid conversion | confirmed payments / unique founding-access requests |

Segment only by broad page family, selected catalog path, and privacy-safe
acquisition channel. Do not create small cohorts that could identify a learner.

## Infrastructure baseline — not a user metric

For the 28-day UTC period ending 2026-11-08, CloudWatch reported:

| Metric | Observed value | Interpretation |
| --- | ---: | --- |
| CloudFront requests | 27,835 | Includes pages, assets, bots, crawlers, QA, and repeat requests; never report as users |
| Bytes downloaded | 310,614,254 | About 296 MiB delivered |
| Maximum observed 5xx error rate | 0.0% | No CloudFront 5xx rate was reported for the period |

Several daily 4xx-rate observations were elevated. Investigate broken URLs,
crawler behavior, and client errors before using request growth as evidence.
Human users, activation, and retention must come from privacy-filtered product
analytics, not CloudFront request counts.

## Cost guardrails

- Keep free learning, progress, path finding, and readiness scoring in the
  browser.
- Generate curriculum and course pages offline, then publish static files.
- Keep DynamoDB on demand and use it only for signed-in profile/progress data.
- Do not add an always-on AI inference endpoint until paid demand and a per-user
  budget exist.
- Use hosted payment pages rather than handling card data in LearnByShorts.
- Review AWS Cost Explorer monthly and record any service exceeding its agreed
  budget before expanding infrastructure.
