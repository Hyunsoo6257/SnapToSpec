# Review Agent — Daily Task

## Role
Review feat/* and fix/* branches. Run build verification. Merge passing branches into dev.
Update progress.md. On Sundays (Brisbane AEST): create weekly PR from dev to main.

All output (commit messages, PR titles, PR descriptions, comments) must be in English.

---

## Step 1: Pull latest dev
```bash
git checkout dev && git pull origin dev
```

---

## Step 2: List open branches, oldest first
```bash
git branch -r | grep -E "feat/|fix/" | sort
```
Process branches in chronological order (oldest date first).
Skip branches older than 7 days — they are stale. Leave a comment and close them.

---

## Step 3: For each branch — verify before merging

### 3a. Check if branch has actual commits
```bash
git log origin/dev..origin/feat/branch-name --oneline
```
If no commits → skip silently (Feature Agent did nothing today).

### 3b. Run build verification (required before any merge)
```bash
git checkout feat/branch-name
npm install
npm run build
```
If build fails → mark as NEEDS FIX immediately. Do not proceed.

### 3c. Run tests
```bash
npm test
```
If tests fail → mark as NEEDS FIX.

### 3d. Code quality checklist
- [ ] No `@moonward-apps/*` imports
- [ ] No `any` type
- [ ] No `console.log`
- [ ] No inline styles in frontend
- [ ] No `pages/` directory in frontend
- [ ] Commit message follows convention
- [ ] Storage only via IStorageService
- [ ] All DTOs extend GenericAssignDto<T>

### 3e. Completion criteria check
Read the task file for this branch (e.g. tasks/week1-day2.md).
Verify each completion criterion is met.

---

## Step 4: If PASSES all checks

```bash
git checkout dev
git merge --no-ff origin/feat/branch-name -m "merge: feat/branch-name"
git push origin dev
```

Update `tasks/progress.md`: mark task as ✅ MERGED with today's date.

Create GitHub PR with this format:
```
Title: [MERGED] feat/agent-YYYYMMDD — {one-line summary of what was built}

## Summary
- {bullet: what was implemented}
- {bullet: what was implemented}

## Files changed
{brief list of key files added/modified}

## Diff highlights
{2-3 sentence description of the most important changes}

## Completion criteria
- {criterion} ✅
- {criterion} ✅

## Notes for human review
{anything worth double-checking, TODOs, concerns}
```

---

## Step 5: If FAILS

Update `tasks/progress.md`: mark task as 👀 IN REVIEW (not BLOCKED — Bug Agent handles BLOCKED).

Create GitHub PR (do NOT merge):
```
Title: [NEEDS FIX] feat/agent-YYYYMMDD — {what failed}

## Failing checks
- Build: PASS/FAIL
- Tests: PASS/FAIL
- {specific checklist item}: FAIL — {reason}

## Required fixes
- {specific thing that needs to change}

## Do not merge until fixed.
```

---

## Step 6: Weekly release (Sundays Brisbane AEST only)
```bash
gh pr create \
  --base main \
  --head dev \
  --title "Weekly release $(TZ='Australia/Brisbane' date +%Y-%m-%d)" \
  --body "Weekly automated release. Human must review and approve before merging."
```

---

## Forbidden
- Never merge directly to main
- Never merge a branch that fails build or tests
- Never create empty commits
- Never write messages in Korean — English only
