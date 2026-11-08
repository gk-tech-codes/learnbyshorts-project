# LearnByShorts Impact Ledger

Started: 2026-11-07

This ledger records verifiable product impact. It is not a marketing-claims
document. Keep dated exports, URLs, screenshots, and third-party records for
every material entry.

## Evidence rules

- Record zero or "not measured" instead of estimating.
- Keep the original source for every metric or testimonial.
- Obtain permission before identifying a learner or organization.
- Separate first-party statements from independent coverage or expert opinion.
- Never buy, trade, or manufacture reviews, citations, awards, or testimonials.
- Preserve monthly exports so growth can be independently recalculated.

## Product baseline — 2026-11-07

| Item | Verifiable record |
| --- | --- |
| Production product | https://www.learnbyshorts.com/ |
| Public source | https://github.com/gk-tech-codes/learnbyshorts-project |
| Security baseline | S3 Block Public Access enabled; CloudFront Origin Access Control is the only public delivery path; canonical edge redirects and security response headers are deployed |
| Recovery baseline | S3 object versioning enabled |
| Learning experience | Fully rebuilt, mobile-first course detail pages for every published course ID; unified homepage-grade design across 11 legacy course surfaces; a repaired static course player; a 19-step interactive Java OOP preview with recall, quizzes, five private browser-debugging challenges, XP, resilient local progress, streak protection, and spaced review |
| AI-era curriculum | Eight role-based starting paths, a seven-level AI Fluency Lab, research-linked learning loops, a local Skill Studio, a coding confidence gate, failure-case practice, and multi-model work across ChatGPT, Claude, Grok, and Gemini |
| Privacy posture | Learning events exclude answers and personally identifiable information; GPC and Do Not Track are respected |
| Revenue experiment | $29 one-time founding learner offer; no claim of sales until payment records exist |
| Operating model | Static/offline-generated content delivered through S3 and CloudFront to avoid always-on AI or application-server cost |

## Release record

| Date | Commit | What changed | Evidence to preserve |
| --- | --- | --- | --- |
| 2026-11-08 | `3956ae9` | Removed legacy predictable JWT fallbacks and seeded demo credentials; stopped reset-token/PII logging; required exact production CORS and loopback-safe configuration; added authentication provenance, clean-main, dry-run, and two-step prune release gates | Git commit, security test output, stale-checkout dry run, production auth hashes, AWS read-only configuration audit |
| 2026-11-08 | `08d0771` + `b7a6092` | Added RoleSprint, a deterministic local-first job-to-skill planner with 14, 30, and 60-day Learn → Build → AI → Verify → Interview loops, private progress, allow-listed opt-in analytics, exportable learner-owned practice logs, tests, and a predeclared validation protocol; integrated it as the primary homepage learning loop | Git commits, `docs/QA_REPORT_2026-11-08_ROLE_SPRINT.md`, production screenshots after release, cohort records after real participation |
| 2026-11-07 | `2ad4247` | Fail-closed authentication and removed embedded fallbacks | Git commit, security checks |
| 2026-11-07 | `76ccd28` | Interactive Java OOP lab and founding offer | Git commit, production screenshots |
| 2026-11-07 | `fc233d0` | Repaired legacy learning pages and dashboard auth | Git commit, test results |
| 2026-11-07 | `a24213b` | Privacy-safe learning metrics and search discovery | Git commit, GA4 event definitions, sitemap |
| 2026-11-07 | `5ed1e29` | Production analytics compatibility fix | Git commit, live QA record |
| 2026-11-07 | `ef10641` | AI Fluency Lab, reusable-skill curriculum, and secure Cognito account implementation | Git commit, production screenshots, browser checks, security checks, AWS configuration export |
| 2026-11-07 | `3bdb292` | Eight role-based paths, research-linked learning loop, Java debugger repair, content recovery, and expanded QA automation | Git commit, QA report, browser screenshots, automated check output |
| 2026-11-07 | `3bdb292` + production rollout | Secure Cognito/API/Lambda/DynamoDB foundation and the full frontend released to production | AWS configuration exports, CloudFront invalidation `I1V7QFTHD4J41IBJXWZ83P8V36`, live browser QA, IndexNow HTTP `200` |
| 2026-11-07 | `922411e` + production rollout | Twelve indexable modern course paths, 48 proof missions, weekly Learning OS challenge, shareable interview readiness plan, owned social card, privacy-safe growth events, and thin-content removal | Git commit, 25-URL sitemap, automated QA, live visual checks, CloudFront invalidations `I1DEZBXNWOF0ZAWGELH3R570PJ` and `IA59FL71AAE6IUT7BRKE0N6BZI`, IndexNow HTTP `200` |
| 2026-11-07 | `9381a2b` + edge rollout | Canonical apex and legacy redirects, nested clean-route rewriting, HSTS, content-type protection, frame denial, referrer controls, browser-permission restrictions, and opener isolation released through CloudFront | Distribution `E1A3IB2N57BAED` reached `Deployed`; function `learnbyshorts-viewer-request`; policy `301abbbd-d809-4dac-a9b0-397b7d688de7`; live redirect/header QA; all 25 sitemap URLs returned `200` |
| 2026-11-07 | `5819fea` + production rollout | Unified 11 legacy course surfaces with the homepage design system, rebuilt the design-pattern decision catalog, repaired the static course player, and corrected course-specific quiz context | Git commit, automated QA, live course screenshots, CloudFront invalidations `I1UTFMFCS0RA0DALOP47G0VMKW` and `I2AEYRRXVYDN5ARTB5OOZD1J1C` |
| 2026-11-07 | `1072aab` + production rollout | Fully replaced the legacy course-detail carousel and card DOM with a responsive homepage-grade experience, secure self-hosted assets, sequential story missions, and fallback coverage for every published course ID | Git commit, desktop and phone screenshots, exact local/production hashes, CloudFront invalidation `IDC2NHA7AKGNWABPR9OR7JV9M6` |

## Metric definitions

Use consistent definitions so results remain credible.

| Metric | Definition | Source |
| --- | --- | --- |
| Activated learner | Unique browser that triggers `lesson_start` | GA4 |
| Step engagement | `learning_step_complete` events divided by activated learners | GA4 |
| Preview completion rate | Learners with `lesson_complete` divided by activated learners | GA4 |
| Returning learner rate | `lesson_start` with `learner_state=returning` divided by activated learners | GA4 |
| Resume conversion | `resume_prompt_click` divided by `resume_prompt_view` | GA4 |
| Founding interest rate | `founding_access_interest` divided by activated learners | GA4 |
| Paid conversion | Confirmed payments divided by founding-access requests | Payment and request records |
| Independent adoption | Named schools, teams, teachers, or communities actively using the product | Written confirmation or public URL |
| AI roadmap depth | Number of the seven AI Fluency levels marked practiced in the local learner state | Local product event or permissioned study export |
| AI path selection | Selected role-based starting path; never includes learner-entered prompt or skill text | Aggregate GA4 event or permissioned study export |
| Skill artifact completion | Learner generates and tests a reusable skill contract | Permissioned pilot record; never collect private skill text by default |
| Course activation | Unique browser that completes one proof mission after `course_landing_view` | GA4 aggregate |
| Weekly challenge completion | Activated learner reaches three proof missions within the local seven-day window | GA4 aggregate |
| Privacy-safe return | `learner_return` in the 2–7 day or 8–30 day bucket; never an exact return timestamp in analytics | GA4 aggregate |
| RoleSprint activation | Learner creates a plan and completes all five steps for one day | Opt-in GA4 aggregate or permissioned practice-log export |
| RoleSprint Day-7 retention | Activated learner completes any mission step on days 6–8 after activation | Opt-in GA4 aggregate or permissioned study record |

## Monthly snapshot

Export and archive this table on the first day of each month.

| Month | Activated learners | Completion rate | Returning rate | Resume conversion | Founding requests | Paid learners | Independent adopters | Source archive |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-11 | Not measured | Not measured | Not measured | Not measured | 0 recorded | 0 recorded | 0 recorded | Add export path |

Infrastructure context for the 28-day UTC period ending 2026-11-08: 27,835
CloudFront requests and 310,614,254 bytes downloaded, with a reported maximum
5xx error rate of 0.0%. These are delivery metrics, not learner or retention
metrics.

## Independent evidence log

| Date | Evidence type | Person or organization | What it independently establishes | Public URL or archive | Permission |
| --- | --- | --- | --- | --- | --- |
|  | Pilot/adoption |  |  |  |  |
|  | Published coverage |  |  |  |  |
|  | Expert evaluation |  |  |  |  |
|  | Invited talk |  |  |  |  |
|  | Award |  |  |  |  |
|  | Testimonial |  |  |  |  |

## Evidence archive checklist

- GitHub releases, commits, contributors, stars, forks, and issue discussions.
- Monthly GA4 CSV/PDF exports with the date range and metric definitions.
- Search Console and Bing Webmaster performance exports.
- Payment records with sensitive details redacted in working copies.
- Signed pilot confirmations and permissioned learner testimonials.
- Independent articles, podcasts, talks, citations, syllabi, or product links.
- Architecture, security, cost, and incident records.
- Before/after product screenshots and reproducible test results.

