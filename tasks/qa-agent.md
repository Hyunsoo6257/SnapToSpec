# QA Agent — Test, Fix, and Merge

## Role
Test all unreviewed feat/* branches. Auto-fix failures (max 2 attempts + re-test each time).
Merge passing branches to main with --no-ff. Create GitHub PRs for all outcomes.
Claude is only invoked for: (1) auto-fix attempts, (2) completion criteria check.

---

## Step 1: Pull latest main and find unreviewed branches

```bash
git checkout main && git pull origin main
```

List all remote feat/* branches that have commits not yet in main:
```bash
git branch -r | grep "origin/feat/" | sort
```

For each branch, check if it has new commits compared to main:
```bash
git log main..origin/<branch-name> --oneline
```
If no output → already merged or empty → skip silently.

If no unreviewed branches exist → exit. Nothing to do.

---

## Step 2: Check for BLOCKED status

Read tasks/progress.md.
If any row contains `❌ BLOCKED`:
- Find the date of the BLOCKED task
- Do NOT process any feat/* branches dated AFTER the blocked date
- Only process branches dated BEFORE the blocked date (if any unreviewed ones exist)

---

## Step 3: For each unreviewed branch — oldest date first

### 3a. Checkout branch
```bash
git checkout -b <branch-name> origin/<branch-name>
npm install
```

### 3b. Build and tests (bash — no Claude)
```bash
npm run build 2>&1 | tee /tmp/build-output.txt
BUILD_EXIT=${PIPESTATUS[0]}

npm test 2>&1 | tee /tmp/test-output.txt
TEST_EXIT=${PIPESTATUS[0]}
```

### 3c. Code quality checks (bash — no Claude)
```bash
QUALITY_ISSUES=""

# No 'any' type (skip comments and test files)
if grep -rn ": any\b\|as any\b" backend/src frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//"; then
  QUALITY_ISSUES="${QUALITY_ISSUES}\n- Found 'any' type usage"
fi

# No console.log
if grep -rn "console\.log" backend/src frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//"; then
  QUALITY_ISSUES="${QUALITY_ISSUES}\n- Found console.log"
fi

# No moonward imports
if grep -rn "@moonward-apps" . --include="*.ts" --include="*.tsx" 2>/dev/null; then
  QUALITY_ISSUES="${QUALITY_ISSUES}\n- Found @moonward-apps import"
fi

# No pages/ directory in frontend
if [ -d "frontend/src/pages" ]; then
  QUALITY_ISSUES="${QUALITY_ISSUES}\n- frontend/src/pages/ directory exists (forbidden)"
fi
```

### 3d. If build, tests, or quality checks failed: attempt auto-fix (max 2 tries)

For each attempt:
1. Read the relevant error output from /tmp/build-output.txt or /tmp/test-output.txt
2. Read ONLY the files mentioned in the error (do not read entire codebase)
3. Fix the specific issue
4. Re-run build + tests + quality checks (bash)
5. If all pass → proceed to 3e
6. If still failing after 2 attempts → go to BLOCKED flow

### 3e. Completion criteria check (Claude — lightweight)

Determine which task file applies to this branch:
- Read tasks/progress.md and find the row whose date matches this branch's date
- The task name in that row (e.g. "catchup-1", "week2-day3") tells you which file to read
- Read ONLY the "Completion Criteria" section of that task file
- Run `git diff main...HEAD` to get the diff
- Ask: "Based on this diff and the completion criteria below, is each criterion met? Answer YES or NO for each."

If all criteria met → proceed to 3f
If any criterion not met → go to NEEDS FIX flow

### 3f. Merge to main
```bash
git checkout main
git merge --no-ff origin/<branch-name> -m "merge: <branch-name>"
git push origin main
```

Update tasks/progress.md: mark the corresponding task as ✅ MERGED with today's date (Brisbane AEST).

Create GitHub PR:
```bash
gh pr create \
  --base main \
  --head <branch-name> \
  --title "[MERGED] <branch-name> — <one-line summary of what was built>" \
  --body "## Summary
- <bullet: what was implemented>
- <bullet: what was implemented>

## Checks
- Build: PASS
- Tests: PASS
- Code quality: PASS
- Completion criteria: PASS

## Auto-merged by QA Agent"
```

---

## NEEDS FIX flow

Update tasks/progress.md: mark the task as 👀 IN REVIEW.

Create GitHub PR (do NOT merge):
```bash
gh pr create \
  --base main \
  --head <branch-name> \
  --title "[NEEDS FIX] <branch-name> — <what failed>" \
  --body "## Failing checks
<list each failing check with reason>

## Error output
<paste the relevant error lines>

## Required fixes
<specific steps to resolve>"
```

Continue processing subsequent branches (NEEDS FIX does not block).

---

## BLOCKED flow

Triggered when: auto-fix failed after 2 attempts.

Update tasks/progress.md: mark the task as ❌ BLOCKED with reason in the Note column.

Create GitHub PR:
```bash
gh pr create \
  --base main \
  --head <branch-name> \
  --title "[BLOCKED] <branch-name> — <what failed>" \
  --body "## Auto-fix failed after 2 attempts

## Error output
<full error log>

## What was tried
<describe each fix attempt>

## Human action required
<specific steps to unblock>"
```

**Stop processing any subsequent branches — they may depend on this one.**

---

## Forbidden
- Never merge to main without passing build, tests, quality checks, and completion criteria
- Never create empty commits
- Never skip the completion criteria check
- Never push directly to main without the --no-ff merge from a feat/* branch
- All output (commit messages, PR titles, PR bodies) must be in English
