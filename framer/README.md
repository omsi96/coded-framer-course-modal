# Framer Components for CODED Landing Page

These are **code components** designed for Framer's code editor. You cannot drag-and-drop `.tsx` files — you must paste the code into Framer's built-in editor.

## How to Add a Component to Framer

1. Open your Framer project
2. In the left sidebar, go to **Assets** (puzzle piece icon)
3. Click **Code** tab at the top
4. Click **"+"** (New File) — Framer creates a blank `.tsx` file
5. **Delete all the default code** in the new file
6. Open the component file from this folder, **copy the entire contents**
7. **Paste** into the Framer code editor
8. Give the file a meaningful name (e.g., `APICardList`)
9. The component now appears in your Assets > Code panel and can be dragged onto any frame

## Important: Framer Component Rules

Framer code components must follow specific patterns:

- **Default export** — every file must have exactly one `export default function ComponentName()`
- **`addPropertyControls`** — use this to expose configurable props in the Framer UI sidebar
- **Inline styles only** — no separate CSS files, no CSS modules, no Tailwind
- **No external npm packages** — only `react`, `framer`, and `framer-motion` are available by default
- **No Node.js APIs** — no `fs`, `path`, `process`, etc.
- **No `window`/`document` at top level** — guard with `typeof window !== "undefined"` or use `useEffect`
- **Self-contained** — all logic, styles, and types must be in a single file (you can import from other Framer code files using relative imports like `import X from "./OtherFile"`)

## Components in This Folder

### `components/APICardList.ts`
**Purpose:** Fetches graduate data from the Cloudflare Worker API and renders them as filterable cards with a detail peek panel, gallery, and "Connect" form.
**Framer Props:** `workerApiUrl` (set to your Cloudflare Worker URL + `/graduates`)
**Worker Endpoint:** `GET /graduates`

### `components/FarmerForm.ts`
**Purpose:** Simple name + email form that POSTs to a configurable API URL.
**Framer Props:** `apiUrl` (the endpoint to POST form data to)
**Worker Endpoint:** `POST /catalogrequest/{pdfName}`

### `components/WorkshopRecommender.tsx`
**Purpose:** AI-powered multi-step questionnaire that recommends CODED training programs. Calls the `/workshop-recommend` endpoint which uses Claude AI + Airtable catalog.
**Framer Props:** `workerUrl` (set to Cloudflare Worker URL)
**Worker Endpoint:** `POST /workshop-recommend`

### `components/CODEDProgramFinder.tsx`
**Purpose:** 6-step questionnaire that recommends programs. Has a local fallback scoring engine if no worker URL is provided.
**Framer Props:** `workerUrl` (optional — falls back to local recommendations)
**Worker Endpoint:** `POST /workshop-recommend`

### `components/CODEDCourseCard.tsx`
**Purpose:** Single course card display component.

### `components/CODEDMeshBackground.tsx`
**Purpose:** Animated mesh gradient background component.

### `components/framer-magic-ai-chat.tsx`
**Purpose:** AI chat interface for companies.

### `components/coded-finder.jsx`
**Purpose:** JSX version of the program finder (alternative implementation).

## Previews

The `previews/` folder contains standalone HTML files you can open in a browser to test components outside of Framer.

## Connection to Cloudflare Worker

All components that fetch data use the Cloudflare Worker as a middleware:

```
Framer Component  →  Cloudflare Worker  →  Airtable API
                     (CORS + routing)       (data source)
```

The Worker URL pattern is:
```
https://coded-landingpage.<your-subdomain>.workers.dev
```

Set this as the `workerApiUrl` or `workerUrl` prop in Framer's property panel.

**Never put your Airtable token in Framer** — the Cloudflare Worker handles authentication.
