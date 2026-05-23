# Bug Agent — Daily Task (runs at 2pm KST weekdays)

## Role
Scan the entire codebase for bugs, rule violations, and code quality issues.
Push fixes to a fix/* branch.

## Execution Order

### 1. Pull latest dev branch
```bash
git checkout dev
git pull origin dev
```

### 2. Scan Items (in order)
```
1. TypeScript any type usage → replace with unknown or generics
2. console.log usage → replace with NestJS Logger
3. @moonward-apps/* imports → remove immediately and implement replacement
4. ESLint warnings/errors → auto fix
5. Missing DTO validation decorators (@IsNotEmpty etc.) → add them
6. External API calls in Service without try-catch → add error handling
7. Prisma N+1 queries → optimize with include
8. Hardcoded values that should be environment variables → move to env
```

### 3. If fixes exist
```bash
git checkout -b fix/bug-agent-YYYYMMDD
git commit -m "fix: daily bug scan YYYYMMDD"
git push origin fix/bug-agent-YYYYMMDD
```

### 4. If no fixes needed
Do nothing. Empty commits are forbidden.

## Forbidden
- No new features (bug fixes only)
- Never push directly to main branch
- Never change Service logic without tests
