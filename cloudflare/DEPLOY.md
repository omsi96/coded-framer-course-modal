# Cloudflare Worker Deploy Guide

This folder is deployable as a Cloudflare Worker project.
For architecture and future-agent implementation workflow, read `README.md` in this same folder first.

## 1) Install dependencies

```bash
cd "/Users/omaralibrahim/Desktop/CODED Landing Page Framer/Cloudflare code"
npm install
```

## 2) Login to Cloudflare

```bash
npx wrangler login --browser=false
```

Open the URL Wrangler prints and approve access.

## 3) Set Airtable token secret

```bash
npx wrangler secret put AIRTABLE_TOKEN
```

Paste your Airtable token when prompted.

## 4) Run locally (optional)

```bash
npm run dev
```

## 5) Deploy

```bash
npm run deploy
```

Wrangler prints the deployed Worker URL, for example:

`https://coded-landingpage.<subdomain>.workers.dev`

## 6) Use in Framer

In the Framer component:

- `Worker API URL` = `https://coded-landingpage.<subdomain>.workers.dev/graduates`

Do not use Airtable token in Framer.

## Endpoints in this worker

- `GET /graduates`
- `GET /courses`
- `GET /courses/{recordId}`
- `GET /listgraduate`
- `GET /list-graduate`
- `GET /graduates/{recordId-or-slug}`
- `POST /companyrequestgraduate`
- `POST /company-request-graduate`
- Existing:
  - `POST /catalogrequest/{PDF_PARAM}`
  - `GET /cohorts/{productname}`
