# Backend APIs & Distributed Systems

> Design a dependable backend across API contracts, data consistency, queues, caching, failure recovery, and end-to-end observability.

- Canonical course page: https://www.learnbyshorts.com/courses/backend-distributed-systems/
- AI-readable page: https://www.learnbyshorts.com/courses/backend-distributed-systems/index.md
- Level: Intermediate
- Suggested duration: 4 weeks
- Price: Free
- Last curriculum review: 2026-11-08
- Topics: APIs, Distributed systems, Reliability, Observability

## Intended outcome

A small service with an explicit consistency model, tested failure behavior, telemetry, and a defended scaling plan.

## Why this path is current

AI can draft endpoints quickly; engineers still need to reason about state, partial failure, concurrency, and operational tradeoffs.

## Proof missions

### 1. Design the API boundary

- Action: Define resources, validation, errors, idempotency, pagination, and versioning around one user outcome.
- Evidence to produce: An API contract with example success and failure exchanges.

### 2. Choose the consistency model

- Action: Map the data lifecycle and decide where strong consistency, eventual consistency, transactions, or compensation apply.
- Evidence to produce: A state-flow diagram with one rejected alternative.

### 3. Engineer for partial failure

- Action: Add timeouts, bounded retries, idempotency, overload behavior, and a recovery path for one dependency failure.
- Evidence to produce: A failure test that demonstrates safe degradation.

### 4. Trace the user request

- Action: Connect structured logs, metrics, and traces from an external request through storage or a queue.
- Evidence to produce: A trace-led incident explanation and scaling threshold.

## Curated video lessons

Videos are hosted by and remain the property of their creators. LearnByShorts adds an active-learning prompt before each video and a build task after it.

### Lecture 1: Introduction

- Creator: MIT 6.824: Distributed Systems
- Covers: Design the API boundary, Choose the consistency model
- Why it is included: Establishes the core distributed-systems tradeoffs behind state, consistency, and fault tolerance.
- Before watching: Draw the path of one request and mark every state owner and network boundary.
- After watching: Choose a consistency model and record one rejected alternative.
- [Watch on YouTube](https://www.youtube.com/watch?v=cQP8WApzIQQ)

### Lecture 2: RPC and Threads

- Creator: MIT 6.824: Distributed Systems
- Covers: Engineer for partial failure
- Why it is included: Grounds retries, concurrency, duplicate requests, and partial failure in concrete RPC behavior.
- Before watching: Predict what happens when a request times out after the server has already acted.
- After watching: Add idempotency, bounded retry, and recovery behavior to one dependency call.
- [Watch on YouTube](https://www.youtube.com/watch?v=gA4YXUJX7t8)

### OpenTelemetry: Simplifying Hybrid Cloud Monitoring

- Creator: IBM Technology
- Covers: Trace the user request
- Why it is included: Connects logs, metrics, and traces to the path of a real user request.
- Before watching: List the fields needed to correlate one request across service and storage boundaries.
- After watching: Trace one failure end to end and define the signal that should alert first.
- [Watch on YouTube](https://www.youtube.com/watch?v=hLvwoow3XTk)

## Primary references

- [A Tour of Go](https://go.dev/tour/) — Go
- [Distributed Systems](https://pdos.csail.mit.edu/6.824/) — MIT 6.5840
- [OpenTelemetry documentation](https://opentelemetry.io/docs/) — OpenTelemetry

## Completion and limitations

Completion means producing the evidence listed in the four proof missions. LearnByShorts is a practice and curriculum guide; it is not an accredited institution, certification provider, recruiting agency, or guarantee of employment. Learners remain responsible for verifying technical claims and protecting confidential data.
