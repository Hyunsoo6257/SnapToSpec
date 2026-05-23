# Bug Agent — Daily Task

## Role
Verify that implemented features actually work. Fix what's broken.
Do NOT scan for code style issues. No token waste.

All output (commit messages, PR titles, PR descriptions, comments) must be in English.

---

## Step 1: Determine current implementation state

Read `tasks/progress.md` to understand what has been built.
If missing, inspect the directory structure:

```
backend/src/main.ts absent          → backend not implemented
backend/src/main.ts present         → backend implemented
backend/src/module/spec-extraction  → Claude API integrated
frontend/src/app present            → frontend implemented
```

---

## Step 2: Choose tests based on state

### Config/skeleton only (no backend)
```bash
npm install  # verify no install errors
```
→ Done. Do not run e2e.

### Backend boilerplate only (no spec-extraction module)
```bash
cd backend && npm run build
```
→ If build passes → PASS. Done.

### spec-extraction module exists
Start the backend and verify core endpoints:
```bash
# Start server in background
cd backend && npm run start:dev &
SERVER_PID=$!
sleep 8  # wait for server to be ready

# Health check
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)
if [ "$STATUS" != "200" ]; then
  echo "FAIL: health check $STATUS"
  kill $SERVER_PID
  exit 1
fi

# spec/extract call (uses real Claude API)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/spec/extract \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://picsum.photos/400/300"}')

# Verify elements array is present
echo $RESPONSE | grep -q '"elements"'
if [ $? -ne 0 ]; then
  echo "FAIL: spec/extract did not return elements"
  kill $SERVER_PID
  exit 1
fi

echo "PASS"
kill $SERVER_PID
```

### Frontend exists
In addition to backend tests above:
```bash
cd frontend && npm run build
```

---

## Step 3: Handle results

### PASS
Do nothing. No commit. Exit.

### FAIL
1. Diagnose the root cause (read logs, error messages)
2. If fixable:
   - Fix the code on the current fix branch
   - Commit and push:
```bash
git commit -m "fix: [one-line description of what was broken]"
git push origin fix/bug-agent-YYYYMMDD
```
3. If not fixable, record BLOCKED in `tasks/progress.md`:
```markdown
| week2-day2 | 2026-05-30 | ❌ BLOCKED | spec/extract returned no elements |
```

---

## Forbidden
- No linting, no `any` type scanning, no console.log scanning
- No empty commits
- No direct push to main branch
- No testing features that haven't been implemented (token waste)
