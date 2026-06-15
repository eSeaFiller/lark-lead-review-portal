# Lark Lead Review Portal

Vercel-deployable internal review UI for partner leads.

There is no connect/setup page and no visible admin-key field. Reviewers open the page and see uploaded leads.

The page uses Vercel serverless proxy functions. The admin key stays in Vercel environment variables and is not exposed in browser JavaScript.

## Deploy To Vercel

Upload this folder as a separate GitHub repository, then import it in Vercel.

Required files:

```text
index.html
styles.css
app.js
vercel.json
README.md
api/
```

Vercel settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: leave empty
```

Environment variables:

```text
LEAD_PORTAL_API_BASE=https://your-partner-lead-portal.vercel.app
```

Do not include `/partner` or `/admin` in `LEAD_PORTAL_API_BASE`; use only the root domain.

`LEAD_PORTAL_ADMIN_KEY` is optional. If the partner backend has admin auth disabled, do not set it.

## Backend Requirements

The partner lead backend must expose:

```text
GET /api/leads
PATCH /api/leads/:id
GET /api/export?status=approved
GET /exports/:file
```

The browser calls same-origin `/api/*` proxy functions, so CORS is not required for the review page.
