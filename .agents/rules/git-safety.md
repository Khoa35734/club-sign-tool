---
trigger: always_on
description: "Git safety rules: protect developer working tree, prohibit destructive git operations, and maintain atomic commits."
---

# Git Safety & Working Tree Protection

## 1. Strictly Prohibited Destructive Commands
Antigravity is **NEVER** permitted to execute destructive Git operations that can cause unrecoverable data loss or alter repository history. The following commands are strictly prohibited:

- `git reset --hard` (will wipe uncommitted developer code)
- `git clean -fd` or `git clean -f` (will permanently delete untracked files)
- `git push --force` or `git push -f` (will overwrite remote branch history)
- `git rebase` (will rewrite commit history)
- `git checkout -- .` or `git restore .` (will discard all uncommitted modifications)
- `git branch -D` (will delete branches without confirmation)

---

## 2. Permitted Read-Only Inspection Commands
You are actively encouraged to inspect git status to understand changes and verify diffs:
- `git status` (inspect modified and untracked files)
- `git diff` / `git diff --staged` (review changes before reporting completion)
- `git log -n <count>` (inspect recent commit messages and history)
- `git check-ignore -v <path>` (verify whether a file is properly ignored)

---

## 3. Working Tree Isolation & Respecting Developer Edits
- **Preserve Unrelated Work:** The developer may leave uncommitted changes or experimental scratch files in the working directory. You must **NEVER** touch, overwrite, or revert files that are not directly required for your assigned task.
- **Narrow Diff Footprint:** Modify only the files strictly required to implement the current requirement and its associated tests. Do not perform wide code formatting or lint refactoring across untouched files.

---

## 4. Commit & Push Boundaries
- **No Autonomous Commits:** Do not run `git commit` unless the developer explicitly asks you to commit in the prompt.
- **No Autonomous Pushes:** Never execute `git push` to remote origins without explicit instruction.
- **Staging Discipline:** If instructed to commit, only stage files modified for the specific task using explicit file paths (`git add src/...`), never using `git add -A` or `git add .` which might accidentally sweep in unrelated scratch files or sensitive assets.
