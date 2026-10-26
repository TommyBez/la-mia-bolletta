# Domain docs

This repo uses a single-context layout:

- `GLOSSARY.md` at the repository root defines domain vocabulary.
- `docs/adr/` contains architectural decision records.

## Before exploring a domain

Read `GLOSSARY.md` if present, then the ADRs relevant to the area being explored. If these documents do not exist, proceed silently; `domain-modeling` creates them when terminology or decisions are resolved.

## Vocabulary

Use the glossary's terms when naming domain concepts in code, issues, tests, and proposals. Bring unresolved terminology to `domain-modeling`.

## Decisions

Identify an existing ADR explicitly when proposing a conflicting change, and explain why the decision should be reconsidered.
