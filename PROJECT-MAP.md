# CODED Landing Page — Project Map

## Architecture

```
Framer Website  ──HTTP──>  Cloudflare Worker  ──HTTP──>  Airtable API
(frontend)                 (middleware/backend)           (database/CMS)
```

Framer components call the Cloudflare Worker which handles CORS, routing, and Airtable authentication. The Airtable token is stored as a Cloudflare secret — never exposed to the browser.

## Folder Structure

```
CODED Landing Page Framer/
│
├── cloudflare/                     # Cloudflare Workers backend
│   ├── src/
│   │   ├── worker.js               # Main router — all routes
│   │   ├── catalogrequest.js       # POST /catalogrequest/{pdfName}
│   │   ├── cohortsrequest.js       # GET  /cohorts/{productAbbr}
│   │   ├── graduatesrequest.js     # GET  /graduates[/{id-or-slug}]
│   │   ├── listgraduate.js         # GET  /listgraduate (alias)
│   │   ├── companyrequestgraduate.js  # POST /companyrequestgraduate
│   │   └── workshoprecommend.js    # POST /workshop-recommend (AI)
│   ├── snapshots/                  # Airtable JSON exports for reference
│   │   ├── AIRTABLE-REFERENCE.md   # Table IDs, field mappings
│   │   ├── meta.tables.json        # Full schema
│   │   ├── graduates.records.json
│   │   ├── graduates-projects.records.json
│   │   ├── companies.records.json
│   │   └── company-requesting-graduate.records.json
│   ├── wrangler.jsonc              # Cloudflare config
│   ├── package.json                # npm scripts: dev, deploy
│   ├── test-connectivity.sh        # curl test for all endpoints
│   ├── DEPLOY.md                   # Step-by-step deploy guide
│   └── AGENTS.md                   # Cloudflare docs reference
│
├── framer/                         # Framer code components
│   ├── README.md                   # How to use in Framer
│   ├── components/
│   │   ├── APICardList.ts          # Graduate cards + filters + detail panel
│   │   ├── FarmerForm.ts           # Name/email form
│   │   ├── WorkshopRecommender.tsx # AI workshop recommender
│   │   ├── CODEDProgramFinder.tsx  # 6-step program questionnaire
│   │   ├── CODEDCourseCard.tsx     # Course card display
│   │   ├── CODEDMeshBackground.tsx # Animated background
│   │   ├── framer-magic-ai-chat.tsx # AI chat for companies
│   │   └── coded-finder.jsx        # JSX program finder variant
│   └── previews/                   # Standalone HTML test files
│       ├── companies-preview.html
│       ├── ai-magic-preview.html
│       ├── coded-finder-preview.html
│       └── animated-star.svg
│
└── PROJECT-MAP.md                  # This file
```

## API Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/` or `/health` | worker.js | Health check |
| POST | `/catalogrequest/{pdfName}` | catalogrequest.js | Submit flyer/PDF download request |
| GET | `/cohorts/{productAbbr}` | cohortsrequest.js | Get upcoming cohort dates for a product |
| GET | `/graduates` | graduatesrequest.js | List graduates (filterable) |
| GET | `/graduates/{id-or-slug}` | graduatesrequest.js | Get single graduate details |
| GET | `/listgraduate` | listgraduate.js | Alias for /graduates |
| POST | `/companyrequestgraduate` | companyrequestgraduate.js | Company hiring interest form |
| POST | `/workshop-recommend` | workshoprecommend.js | AI-powered course recommendation |

Worker URL: `https://coded-landingpage.tools-c81.workers.dev`

## Quick Commands

```bash
# Navigate to the Cloudflare project
cd cloudflare

# Install dependencies (run after first clone or platform change)
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy

# Set secrets
npx wrangler secret put AIRTABLE_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY   # needed for /workshop-recommend

# Check auth
npx wrangler whoami

# Test all endpoints
bash test-connectivity.sh
```

## Framer Workflow

To add/update a component in Framer:

1. Edit the `.ts`/`.tsx` file in `framer/components/`
2. Open Framer > Assets > Code > select the component (or create new)
3. Copy-paste the entire file contents
4. The component appears in the Framer canvas and properties panel

Key rule: **Framer components must be self-contained single files** with inline styles. No external CSS, no npm imports beyond `react` and `framer`.
