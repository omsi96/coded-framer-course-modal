# CODED Cloudflare Worker Architecture

This folder is the backend API layer used by Framer components and other clients.

It sits between:

- Frontend clients (Framer, internal tools)
- Airtable (source of data)
- Optional external services (example: Anthropic in `workshoprecommend.js`)

## Why this structure exists

We use **one main router** with **modular route workers** to keep behavior predictable and safe:

- One entry point (`src/worker.js`) for routing and CORS handling
- One file per domain endpoint (`coursesrequest.js`, `graduatesrequest.js`, etc.)
- Clear blast radius: changing one endpoint should not break others
- Easier for future agents to extend without rewriting everything

## Folder structure

```text
cloudflare/
  AGENTS.md                 # Cloudflare-specific instructions
  DEPLOY.md                 # Deploy steps
  README.md                 # This architecture guide
  package.json              # npm scripts (dev/deploy)
  wrangler.jsonc            # Worker config (entry point = src/worker.js)
  test-connectivity.sh      # Optional local checks
  snapshots/                # Airtable metadata/reference snapshots
  src/
    worker.js               # Main router (single entry point)
    catalogrequest.js       # POST /catalogrequest/{PDF_PARAM}
    cohortsrequest.js       # GET /cohorts/{productname}
    coursesrequest.js       # GET /courses and /courses/{recordId}
    graduatesrequest.js     # GET /graduates and /graduates/{recordId-or-slug}
    listgraduate.js         # GET /listgraduate and /list-graduate
    companyrequestgraduate.js # POST /companyrequestgraduate aliases
    workshoprecommend.js    # POST /workshop-recommend
```

## Runtime flow

1. Request comes to Cloudflare Worker URL.
2. `src/worker.js` reads path + method.
3. Router forwards request to the correct worker module.
4. Worker module validates input, fetches Airtable/external services, normalizes output.
5. JSON response is returned with CORS headers.

## Current API routes

- `POST /catalogrequest/{PDF_PARAM}`
- `GET /cohorts/{productname}`
- `GET /courses`
- `GET /courses/{recordId}`
- `GET /graduates`
- `GET /graduates/{recordId-or-slug}`
- `GET /listgraduate`
- `GET /list-graduate`
- `POST /companyrequestgraduate`
- `POST /company-request-graduate`
- `POST /workshop-recommend`
- `GET /` and `GET /health` (health check)

## How to add a new worker (future-agent playbook)

Use this exact sequence.

1. Define the route contract first.
   - Method, path, required params, response shape, error shape.
2. Create a new worker file in `src/`.
   - Follow existing style: `corsHeaders`, `json(...)` helper, strict method/path checks.
3. Implement handler logic.
   - Validate inputs early.
   - Keep Airtable field mapping/normalization explicit.
   - Never expose secrets in responses.
4. Register route in `src/worker.js`.
   - Add import at top.
   - Add routing block in the same comment style used in that file.
5. Add/update secrets if needed.
   - Example: `npx wrangler secret put AIRTABLE_TOKEN`
6. Verify locally.
   - `npm run dev`
   - Test route with `curl` (success + invalid input cases).
7. Update docs.
   - Add route to this file and `DEPLOY.md` endpoint list.
8. Deploy.
   - `npm run deploy`

## Worker implementation rules

- Keep `src/worker.js` as the only router entry point.
- Keep route modules focused and independent.
- Keep response format stable unless explicitly changing API contract.
- Return explicit error payloads (`error`, optional `details`).
- Keep CORS behavior consistent with existing files.
- Do not hardcode secrets/tokens/API keys in code.
- Use `env.*` for secrets and inject via Wrangler secrets.
- Do not call Airtable directly from Framer/frontend.

## Definition of done for a new route

- Route works in `wrangler dev`.
- Route is wired in `src/worker.js`.
- Invalid input returns safe error response.
- Secrets are configured via Wrangler, not committed.
- Docs updated (`README.md` + `DEPLOY.md`).
- Deployed and smoke-tested on worker URL.

## Local commands

```bash
cd cloudflare
npm install
npm run dev
npm run deploy
```

## Notes for AI agents

- Start by reading `src/worker.js` before editing anything.
- Match existing code/comment style in router and worker modules.
- Prefer additive changes; avoid broad rewrites.
- If changing response shape, call it out clearly and update all consumers (Framer components, docs).
- Preserve backward-compatible aliases when possible (example: dashed and non-dashed routes).
