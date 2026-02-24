# CODED Framer Courses Components

This repository is the source of truth for the CODED Framer course discovery UI and request modal logic.

It is designed for a copy/paste workflow into Framer Code Components.

## What this repo contains

- `framer/components/CoursesGridExplorer.tsx`
  - Main courses grid component.
  - Fetches courses from Cloudflare Worker (`/courses`).
  - Handles search, section filtering, audience filtering, hours filtering, ranking order, and load more.
  - Opens the request modal when a card is clicked.

- `framer/components/CourseRequestModal.tsx`
  - Reusable modal component.
  - Shows course details and request form (`name`, `company`, `email`).
  - Submits request to Worker endpoint: `POST /catalogrequest/{pdfRecordId}`.
  - Accepts reusable header title/subtitle props.
  - Includes Framer property controls and preview-safe defaults.

## How this connects to Framer and Cloudflare Worker

Data flow:

1. Framer component `CoursesGridExplorer` calls:
   - `GET {workerUrl}/courses?limit=100&offset=...`
2. Worker returns normalized course payload including:
   - `recordId`, `courseTitle`, `duration`, `courseType`, `targetAudience`, `description`, `rank`, `sections`, `pdfRecordIds`
3. User clicks a course card.
4. `CourseRequestModal` opens and submits:
   - `POST {apiBaseUrl}/catalogrequest/{pdfRecordId}`
   - Body: `{ "name": "...", "company": "...", "email": "..." }`

Important:

- Framer must never use Airtable token directly.
- All Airtable access is through the Cloudflare Worker.

## Worker contract required by these components

- `GET /courses`
  - Must support pagination (`limit`, `offset`).
  - Must provide `nextOffset`.
  - Must include `rank` and `pdfRecordIds`.

- `GET /courses/{recordId}`
  - Used for course-level retrieval compatibility.

- `POST /catalogrequest/{PDF_PARAM}`
  - Must accept JSON with `name`, `company`, `email`.

Default production worker used in components:

- `https://coded-landingpage.tools-c81.workers.dev`

## Framer update workflow (required)

There is no automatic sync from this repo to Framer.

When making fixes:

1. Edit files in this repo.
2. Validate logic and API shape.
3. Copy full updated component code from this repo.
4. Paste into matching Framer Code Component files.
5. Publish Framer changes.

If you skip copy/paste, Framer will still run old code.

## Instructions for the next AI model

Treat this as an operator handoff protocol:

1. Start by reading both files in `framer/components/`.
2. Preserve existing prop names unless explicitly asked to change them.
3. Keep Framer compatibility:
   - keep `addPropertyControls(...)`
   - keep default export component format
   - avoid dependencies not available in Framer runtime
4. Keep Worker URLs configurable via props (`workerUrl`, `apiBaseUrl`).
5. Do not hardcode Airtable secrets or keys anywhere in Framer code.
6. Keep rank ordering behavior:
   - ranked courses first, ascending rank
7. Keep graceful handling for malformed Airtable values:
   - avoid rendering `[object Object]`
8. After any changes, provide copy/paste instructions to move code into Framer.

## Quick copy/paste checklist

- [ ] Updated `CoursesGridExplorer.tsx` copied into Framer
- [ ] Updated `CourseRequestModal.tsx` copied into Framer
- [ ] Framer props reviewed (`workerUrl`, `apiBaseUrl`, `primaryColor`, modal title/subtitle)
- [ ] Card click opens modal
- [ ] Form submits successfully to `/catalogrequest/{pdfId}`
- [ ] Success/error states display correctly
