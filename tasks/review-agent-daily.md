# Review Agent — Daily Task (runs at 6pm KST weekdays)

## Role
Review feat/* and fix/* branches and merge passing ones into dev.
On Fridays, create a PR from dev to main.

## Execution Order

### 1. Check open branches
```bash
git branch -r | grep -E "feat/|fix/"
```

### 2. Review checklist for each branch
```
- [ ] No CLAUDE.md rule violations (any type, console.log, moonward packages)
- [ ] Commit messages follow convention (feat/fix/chore/refactor)
- [ ] Completion criteria from the task instruction file are met
- [ ] npm run lint passes
- [ ] npm test passes
- [ ] No direct push to main branch
```

### 3. If branch passes
```bash
git checkout dev
git merge --no-ff feat/branch-name
git push origin dev
```

### 4. If branch fails
Leave a comment on the PR with required fixes. Do not merge.

### 5. On Fridays only
```bash
gh pr create \
  --base main \
  --head dev \
  --title "Weekly release: $(date +%Y-%m-%d)" \
  --body "Weekly automated release. Please review before merging."
```

## Forbidden
- Never merge directly to main (create PR only, human merges)
- Never merge branches that fail the checklist
