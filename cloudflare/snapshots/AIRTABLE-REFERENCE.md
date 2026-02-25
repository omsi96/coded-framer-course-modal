# Airtable Configuration — CODED Landing Page

## Base Info
- **Base ID:** `appauC0auHC017I1X`

## Tables Used by Cloudflare Worker

| Table | ID | Worker Route | Purpose |
|-------|------|--------------|---------|
| CODED Course Catalog | `tblqLLqzh25R9ewoK` | `POST /workshop-recommend` | AI course recommendations |
| FlyerRequest | `tbl931DhOcYdixGHV` | `POST /catalogrequest/{pdf}` | Catalog PDF requests |
| PDFs | `tblsX5kbMwyAIcwfJ` | (linked from FlyerRequest) | PDF attachments |
| Cohorts (secured) | `tbl98jo10oxudC5ze` | `GET /cohorts/{product}` | Upcoming cohort dates |
| Graduates | `tbluIOzmqFs40t4tv` | `GET /graduates` | Graduate profiles |
| Graduates Projects | `tbluXHyoUjdKYfmrA` | (linked from Graduates) | Project portfolio |
| Company Requesting Graduate | `tblNMyPuXlftz0TAL` | `POST /companyrequestgraduate` | Hiring interest form |
| Companies | `tblTPhd31b3uPjIpL` | — | Company directory |
| Companies Job Openings | `tblEsOXOys86Xu7P8` | — | Job listings |
| CODED Team | `tbld7DA8lJmpSAcSm` | — | Team members |

## Snapshots

The `snapshots/` folder contains JSON exports of Airtable data for reference/debugging:
- `meta.tables.json` — full schema of all tables (field IDs, types, options)
- `graduates.records.json` — sample graduate records
- `graduates-projects.records.json` — sample project records
- `companies.records.json` — sample company records
- `company-requesting-graduate.records.json` — sample request records

## Secrets

The Airtable token is stored as a Cloudflare Worker secret (not in code):
```bash
cd "Cloudflare code/coded-landingpage"
npx wrangler secret put AIRTABLE_TOKEN
```

**Never commit the token to git or expose it in Framer.**
