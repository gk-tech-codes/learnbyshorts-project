# LearnByShorts AI Fluency Curriculum

Version: 2026-11-07

## Product thesis

AI-era learning should not optimize for remembering model names or collecting
prompt tricks. It should develop durable judgment:

1. Define the outcome and what “correct” means.
2. Give the smallest trustworthy context that can solve the task.
3. Use the model or tool deliberately.
4. Inspect the artifact and its assumptions.
5. Test with evidence, including failure cases.
6. Explain and own the final result.
7. Improve the workflow from observed failures.

The public lab expresses this as:

> Ask → inspect → test → explain → improve

## Seven levels

| Level | Capability | Required proof |
| --- | --- | --- |
| 00 | AI literacy and safe habits | Source-checked comparison of two AI answers |
| 01 | Prompt specifications | Testable task specification with acceptance criteria |
| 02 | Context engineering | Compact evidence-based context pack |
| 03 | AI-assisted coding | Small reviewed diff with observed tests and explanation |
| 04 | Structured outputs and tools | Validated schema and least-privilege tool contract |
| 05 | Reusable AI skills | Skill with trigger, inputs, workflow, boundaries, and definition of done |
| 06 | Agents and evaluation | Evaluation set with normal, failure, adversarial, and refusal cases |

## Reusable skill contract

A dependable AI skill contains:

- **Trigger:** the situations in which the skill should run.
- **Required inputs:** the context that must exist before starting.
- **Workflow:** observable, ordered actions rather than a vague persona.
- **Safety boundaries:** prohibited actions, sensitive-data rules, and approval
  checkpoints.
- **Definition of done:** evidence that proves the task was completed.
- **Failure behavior:** what to do when context is missing or a boundary would
  be crossed.

The public Skill Studio generates this contract without sending learner input
to a server. Drafts remain in the browser.

## Multi-model teaching policy

ChatGPT, Claude, Grok, and Gemini are taught through shared principles and
provider-specific practice. LearnByShorts does not publish permanent “best
model” rankings. Learners build a small evaluation set from their real task and
compare success, failure modes, latency, cost, and safety.

Primary maintained starting points:

- OpenAI Cookbook: https://github.com/openai/openai-cookbook
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- Anthropic Courses: https://github.com/anthropics/courses
- Anthropic Cookbook: https://github.com/anthropics/anthropic-cookbook
- xAI Cookbook: https://github.com/xai-org/xai-cookbook
- Microsoft Generative AI for Beginners:
  https://github.com/microsoft/generative-ai-for-beginners
- Google Gemini prompt design:
  https://ai.google.dev/gemini-api/docs/prompting-strategies

External examples are references, not LearnByShorts-owned content. Course
material should be original, attribute sources, avoid copying protected text,
and be reviewed when provider documentation changes.

## Coding confidence gate

Before accepting an AI-generated software change, a learner should be able to
show:

- understanding of the changed behavior;
- inspection of the complete diff;
- current test output and meaningful edge cases;
- security and data-boundary review;
- failure detection and rollback thinking.

Passing the gate reduces risk but never transfers accountability to the model.

## Interview policy

AI tool rules vary by company, role, and interview stage. Learners must confirm
the current policy. When tools are allowed, practice should make intent,
verification, privacy decisions, and final ownership observable. When tools are
not allowed, learners must be able to reason and continue independently.

## Evaluation plan

Measure the curriculum with evidence rather than testimonials alone:

- activation: learner starts Level 00 or opens the Skill Studio;
- practice depth: number of levels marked practiced;
- artifact creation: locally generated skill contract;
- return behavior: a learner resumes saved roadmap progress;
- verification behavior: completion of all coding confidence gates;
- transfer: learner completes a new task without step-by-step course guidance.

Do not claim learning improvement until a documented pilot or study measures it.
