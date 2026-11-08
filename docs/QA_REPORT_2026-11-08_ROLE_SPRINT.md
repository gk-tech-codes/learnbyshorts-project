# RoleSprint Release QA — 2026-11-08

Scope: RoleSprint planning engine, homepage integration, privacy controls,
search discovery, responsive layout, and regression coverage.

## Automated results

All checks passed from a clean managed worktree based on current `origin/main`:

- Static-site integrity: 43 HTML files and 31 JSON files.
- Learning engine: 19 blocks, 5 code challenges, and corrupted-state recovery.
- Learning OS: normalization, adaptive missions, streaks, calibration, mastery,
  and proof export.
- Modern catalog: 12 paths and 48 proof missions.
- SEO: 26 canonical URLs, owned social cards, and RoleSprint sitemap coverage.
- Security configuration and repository secret scanning.
- CloudFront canonical, legacy, query-preserving, and nested-route behavior.
- RoleSprint: 7 unit tests covering weighted readiness, priority ranking, time
  allocation, deterministic plans, completion accounting, private share
  parameters, and mobile sizing guards.

## Browser results

The page was tested through a loopback-only local server at mobile and desktop
breakpoints.

- The first request loaded no Google Analytics script before consent.
- Declining analytics kept the analytics script unloaded.
- The consent prompt was changed from an overlapping fixed panel to an inline
  control that does not cover the plan builder.
- A query-configured 14-day AI Engineer plan generated 14 day controls and
  five mission steps per day.
- Completing the first mission recorded 35 planned minutes and 7% completion.
- The plan and progress survived a page reload in the same browser.
- The exported JSON practice log parsed successfully and contained only plan
  configuration, aggregate completion data, completed step IDs, and an explicit
  non-certification disclosure.
- The desktop layout used the intended two-column builder/plan grid without
  horizontal overflow.
- No browser console errors or warnings were produced by the product page.

## Production release results

RoleSprint and its homepage integration were released from committed Git state
through the guarded private-S3 publisher. CloudFront invalidations
`ICMTBPYK4BQ9PBX3VYV8CUV51V` and `I39CF73EXHLA9H8U2J5DIMK4QG` were accepted.
No prune or object deletion was used.

- Public homepage, RoleSprint HTML, RoleSprint CSS and JavaScript, role data,
  sitemap, and login page returned HTTP `200`.
- Downloaded production bodies matched the committed files byte for byte.
- Security responses included HSTS, frame denial, content-type protection,
  strict-origin referrer policy, and restricted browser permissions.
- All 26 canonical URLs in the sitemap returned HTTP `200`.
- The production 14-day Backend Engineer plan accepted URL defaults, generated
  all 14 day controls and five steps per day, recorded 30 focused minutes and
  7% completion after day one, and retained progress after reload.
- No analytics script loaded after declining optional analytics, and the
  production page produced no console errors or warnings.
- Production QA found a mobile grid overflow. Commit `8c028d9` constrained grid
  items and the hidden compatibility control, added a regression test, and
  bumped the stylesheet version. The repaired public page measured 375px wide
  with a 375px scroll width and no horizontal overflow.

## Integrity limits

This QA proves implementation behavior, not learner outcomes, adoption,
retention, revenue, hiring results, or certification. Those claims require real
participant records collected under the predeclared experiment protocol in
`ROLE_SPRINT_EXPERIMENT.md`.
