# Agentic Software Engineering

> Design bounded agents that use tools, manage context, recover from failure, and pass measurable evaluations.

- Canonical course page: https://www.learnbyshorts.com/courses/agentic-engineering/
- AI-readable page: https://www.learnbyshorts.com/courses/agentic-engineering/index.md
- Level: Intermediate
- Suggested duration: 3 weeks
- Price: Free
- Last curriculum review: 2026-11-08
- Topics: Agents, MCP, Tools, Evals

## Intended outcome

A small tool-using agent with an evaluation set, permissions boundary, and failure-handling plan.

## Why this path is current

The durable skill is not calling a model; it is engineering a reliable loop around one.

## Proof missions

### 1. Choose the right boundary

- Action: Separate deterministic code, model judgment, tool calls, and human approval.
- Evidence to produce: A workflow diagram with stop and escalation conditions.

### 2. Manage context deliberately

- Action: Create compact instructions, task-specific memory, and a policy for what never enters context.
- Evidence to produce: A context budget and data-handling checklist.

### 3. Connect one safe tool

- Action: Define a narrow tool contract, validate inputs, and make retries idempotent.
- Evidence to produce: A tested tool schema with denied unsafe inputs.

### 4. Evaluate the loop

- Action: Build ten representative cases including failure, ambiguity, and adversarial input.
- Evidence to produce: An eval report with pass rate and one improved failure.

## Curated video lessons

Videos are hosted by and remain the property of their creators. LearnByShorts adds an active-learning prompt before each video and a build task after it.

### Generative vs Agentic AI: Shaping the Future of AI Collaboration

- Creator: IBM Technology
- Covers: Choose the right boundary, Manage context deliberately
- Why it is included: Clarifies when a bounded agent is justified and what separates it from a single model response.
- Before watching: Mark which parts of your target workflow are deterministic, model-driven, or human-approved.
- After watching: Revise the boundary so every autonomous step has an explicit stop or escalation condition.
- [Watch on YouTube](https://www.youtube.com/watch?v=EDb37y_MhRw)

### Observability and Evals for AI Agents: A Simple Breakdown

- Creator: LangChain
- Covers: Connect one safe tool, Evaluate the loop
- Why it is included: Shows why tool calls need traces and why an agent loop needs task-level evaluation.
- Before watching: List the inputs, outputs, and failure states you would record for one tool call.
- After watching: Add one trace field and two representative failure cases to your agent evaluation set.
- [Watch on YouTube](https://www.youtube.com/watch?v=FDVdLrloFOw)

## Primary references

- [Agentic AI](https://www.deeplearning.ai/courses/agentic-ai/) — DeepLearning.AI
- [MCP Course](https://huggingface.co/learn/mcp-course/unit0/introduction) — Hugging Face
- [Agentic Context Engineering](https://huggingface.co/learn/agents-course/en/bonus-unit2/introduction) — Hugging Face

## Completion and limitations

Completion means producing the evidence listed in the four proof missions. LearnByShorts is a practice and curriculum guide; it is not an accredited institution, certification provider, recruiting agency, or guarantee of employment. Learners remain responsible for verifying technical claims and protecting confidential data.
