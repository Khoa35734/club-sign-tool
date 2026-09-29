# Antigravity CLI Developer Guide — Club Sign Tool

This guide provides practical commands and workflows for the solo developer using **Antigravity CLI (`agy`)** to develop, review, test, and audit **Club Sign Tool**.

---

## 1. Quick Model & Agent Reference

### List Available Models
```bash
agy models
```
The primary recommended model for this project is **Gemini 3.8 Flash (High)** (`gemini-3.8-flash-high`).

### List Discovered Custom Agents
```bash
agy agents
```
Discovers: `implementer`, `reviewer`, `tester`, `srs-auditor`.

---

## 2. Running Antigravity CLI Commands

### Interactive Sessions
Launch an interactive session with the default model:
```bash
agy --agent implementer
```

Resume the previous session:
```bash
agy -c
```

### Non-Interactive Single Prompts (`-p` / `--print`)

#### Run with Recommended Model & High Reasoning Effort
```bash
agy -p "Implement the next unchecked roadmap requirement." --agent implementer --model gemini-3.8-flash-high --effort high
```

#### Code Implementation (Implementer Agent)
```bash
agy -p "Implement the normalized coordinate calculation functions and unit tests according to SRS Section 6." --agent implementer
```

#### Test Authoring & Execution (Tester Agent)
```bash
agy -p "Author comprehensive tests for the atomic PDF export failure recovery and filename collision." --agent tester
```

#### Code & Security Review (Reviewer Agent)
```bash
agy -p "Review the current git diff against the SRS requirements and architecture boundaries." --agent reviewer
```

#### SRS Compliance & Gap Audit (SRS Auditor Agent)
```bash
agy -p "Audit the codebase and roadmap against docs/SRS.md." --agent srs-auditor
```

---

## 3. Recommended Solo Developer Daily Workflow

Follow this disciplined 6-step cycle to make steady progress without architecture drift or regressions:

```text
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Implement One Roadmap Requirement                   │
│ agy -p "Implement the next unchecked requirement from       │
│         docs/ROADMAP.md" --agent implementer                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Run Tests & Verification                            │
│ agy -p "Add and run tests for the changes made in Step 1"   │
│         --agent tester                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Architecture & Security Review                      │
│ agy -p "Review git diff for compliance, safety, and no      │
│         unwanted dependencies" --agent reviewer             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Fix Identified Findings                             │
│ If reviewer reports BLOCKER or HIGH findings, have          │
│ implementer fix them before proceeding.                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Manual Developer Inspection                         │
│ git diff                                                    │
│ Verify the changes match your intent.                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Manual Developer Commit                             │
│ git add <files>                                             │
│ git commit -m "feat(editor): implement normalized canvas"    │
└─────────────────────────────────────────────────────────────┘
```

> **Important:** Never instruct the agent to "implement all roadmap phases at once". Implementing one focused task at a time maintains high code quality and avoids context saturation.

---

## 4. Useful CLI Flags

| Flag | Purpose | Example |
|---|---|---|
| `-p`, `--print` | Run prompt non-interactively and print response | `agy -p "Check git status"` |
| `--agent` | Select custom agent configuration | `agy --agent reviewer` |
| `--model` | Select specific LLM | `agy --model gemini-3.8-flash-high` |
| `--effort` | Set reasoning effort (`low`, `medium`, `high`, `max`) | `agy --effort high` |
| `-c`, `--continue` | Resume previous conversation | `agy -c` |
| `--dangerously-skip-permissions` | Auto-approve tool prompts (use with care) | `agy -p "Run tests" --dangerously-skip-permissions` |
