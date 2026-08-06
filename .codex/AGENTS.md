# Project Operating Manual

## Goals
- Build the application incrementally.
- Requirements are introduced through versioned requirement files.
- Documentation is the source of truth.
- Code must never become the source of truth.

## Repository Structure
Explain what each document is responsible for.

## Documentation Hierarchy
vX.md
    ↓
phaseX.md
    ↓
design.md
    ↓
architecture.md
    ↓
user-stories.md
    ↓
implementation

## Ground Rules
- Never assume missing requirements.
- Always ask questions if ambiguous.
- Never modify design without justification.
- Keep architecture synchronized with design.
- Prefer updating existing documents instead of duplicating content.

## Increment Workflow
Describe the lifecycle:
Requirement
→ Product Planning
→ Design Update
→ Architecture Update
→ Story Planning
→ Implementation
→ Review

## Definition of Done
State when a phase is considered complete.

## General Coding Principles
Examples:
- Small commits
- SOLID
- DRY
- Testability
- Clear naming
- No dead code

## Communication Rules
- Be interactive.
- Present trade-offs.
- Explain major design decisions.
- Ask before making irreversible architectural changes.

## Responsibilities
Mention that specialized skills own their respective documents and must not edit unrelated ones.