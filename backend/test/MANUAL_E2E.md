# Manual E2E Checklist — Backend Pipeline

The automated e2e suite (`npm run test:e2e`) mocks the Claude (Anthropic) API so it
is deterministic and CI-safe. Run this checklist once against the **live** Claude
API to confirm the real end-to-end flow before each Week 2 checkpoint.

Requires a real `.env` with valid `ANTHROPIC_API_KEY`, `SUPABASE_URL`, and
`SUPABASE_SERVICE_ROLE_KEY`.

```
MANUAL TEST RESULTS (run before committing):

1. Start server: npm run start:dev
   [ ] Server starts without errors

2. Health check: GET http://localhost:3000/api/v1/health
   [ ] Returns { "status": "ok" }

3. Swagger: http://localhost:3000/api/swagger
   [ ] Swagger UI loads, shows /file/upload and /spec/extract endpoints

4. Upload test: POST http://localhost:3000/api/v1/file/upload
   (multipart form-data, field: "file", value: any PNG/JPG)
   [ ] Returns { "imageUrl": "https://..." }

5. Extract test: POST http://localhost:3000/api/v1/spec/extract
   { "imageUrl": "<url from step 4>" }
   [ ] Returns { "elements": [...] }
   [ ] elements array is not empty (for a UI screenshot)
   [ ] each element has id, type, position, styles
```

## Quick curl recipe

```bash
# 2. Health
curl -s http://localhost:3000/api/v1/health

# 4. Upload (replace screenshot.png with a real file)
curl -s -X POST http://localhost:3000/api/v1/file/upload \
  -F "file=@screenshot.png"

# 5. Extract (paste the imageUrl from step 4)
curl -s -X POST http://localhost:3000/api/v1/spec/extract \
  -H "Content-Type: application/json" \
  -d '{ "imageUrl": "<url from step 4>" }'
```
