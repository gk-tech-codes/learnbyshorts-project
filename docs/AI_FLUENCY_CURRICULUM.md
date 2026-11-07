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

## Eight role-based starting paths

The same durable capabilities are introduced through eight practical contexts:

1. first-time AI user;
2. student and learner;
3. software developer;
4. job seeker;
5. researcher and analyst;
6. creator and marketer;
7. manager and founder;
8. automation builder.

Each four-session start follows the same support-fading loop:

1. **Worked example:** observe a complete, narrated example.
2. **Guided attempt:** perform the pattern with bounded support.
3. **Delayed retrieval:** return later and reconstruct it from memory.
4. **Independent transfer:** use it in a new context and explain the result.

“Easy” means removing unnecessary cognitive load, not removing the thinking
that creates durable skill.

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

The free Java lab applies the same principle with a local code debugger. It
checks balanced structure and explicit lesson requirements without uploading or
executing learner code. The interface must call this a browser checker, not a
compiler, and keep the successful result visible until the learner chooses to
continue.

## Research basis and claim standard

The curriculum uses six evidence-informed design ideas:

- retrieval practice rather than repeated exposure alone;
- spacing practice over time;
- worked examples for novices followed by faded support;
- self-explanation to make the learner's mental model visible;
- AI guardrails that protect productive struggle and unassisted performance;
- structured tutoring that is evaluated in its specific learning context.

Public lessons link directly to the relevant research. These sources support
the mechanisms, not a claim that LearnByShorts itself improves learning.
Until a credible product-specific study is completed, the correct description
is **research-informed learning design**.

Any future outcome claim must publish the study method, sample, comparison,
measures, uncertainty, limitations, and negative as well as positive results.

## Failure-case coverage

Every path must practice recurring failures, not only ideal outputs:

- confident inaccuracies and stale information;
- sensitive-data exposure and prompt injection;
- code regressions and fabricated citations;
- bias and unsafe over-automation;
- tool failure and runaway cost;
- ambiguous intent and learner dependence on AI.

No finite matrix covers every future failure. Course maintenance should add a
case when a new incident reveals a distinct, reusable failure category.

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
