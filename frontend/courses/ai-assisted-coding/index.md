# AI-Assisted Coding & Code Review

> Use coding agents without losing the engineering thread: write precise tasks, constrain changes, inspect diffs, test risk, and retain authorship.

- Canonical course page: https://www.learnbyshorts.com/courses/ai-assisted-coding/
- AI-readable page: https://www.learnbyshorts.com/courses/ai-assisted-coding/index.md
- Level: Beginner to intermediate
- Suggested duration: 3 weeks
- Price: Free
- Last curriculum review: 2026-11-08
- Topics: Coding agents, TypeScript, Testing, Code review

## Intended outcome

A production-shaped TypeScript or Python feature built with AI assistance and defended through tests, review notes, and a decision record.

## Why this path is current

AI can accelerate implementation, but typed contracts, focused diffs, and human review determine whether generated code is safe to ship.

## Proof missions

### 1. Write the implementation contract

- Action: Turn a feature request into scope, invariants, interfaces, acceptance checks, and explicit non-goals before prompting.
- Evidence to produce: A task brief another engineer can execute without guessing.

### 2. Constrain the generated change

- Action: Ask for one vertical slice, preserve unrelated code, and require the agent to explain every touched file.
- Evidence to produce: A focused diff with a file-by-file rationale.

### 3. Test what the model may miss

- Action: Inspect the diff for boundary, security, concurrency, and failure-state risks, then add targeted tests.
- Evidence to produce: At least three risk-derived tests including one caught defect.

### 4. Own the final review

- Action: Reproduce the behavior, remove unnecessary complexity, record rejected suggestions, and explain the final design unaided.
- Evidence to produce: A review summary and independent five-minute walkthrough.

## Curated video lessons

Videos are hosted by and remain the property of their creators. LearnByShorts adds an active-learning prompt before each video and a build task after it.

### Spec-Driven Development: AI Assisted Coding Explained

- Creator: IBM Technology
- Covers: Write the implementation contract, Constrain the generated change
- Why it is included: Centers contracts and constrained implementation before asking an AI system to write code.
- Before watching: Write the invariants, interfaces, acceptance checks, and non-goals for one feature.
- After watching: Tighten the task until another engineer could execute it without guessing.
- [Watch on YouTube](https://www.youtube.com/watch?v=mViFYTwWvcM)

### How to automate code reviews and testing with GitHub Copilot

- Creator: GitHub
- Covers: Test what the model may miss, Own the final review
- Why it is included: Demonstrates AI-assisted review as an input to testing and human ownership, not an approval shortcut.
- Before watching: List the boundary, security, concurrency, and failure-state risks in your current diff.
- After watching: Add one risk-derived test and write which AI suggestion you rejected and why.
- [Watch on YouTube](https://www.youtube.com/watch?v=HDEGFNAUkX8)

## Primary references

- [Octoverse 2025: AI and typed languages](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) — GitHub
- [Copilot best practices](https://docs.github.com/en/copilot/get-started/best-practices) — GitHub Docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — TypeScript

## Completion and limitations

Completion means producing the evidence listed in the four proof missions. LearnByShorts is a practice and curriculum guide; it is not an accredited institution, certification provider, recruiting agency, or guarantee of employment. Learners remain responsible for verifying technical claims and protecting confidential data.
