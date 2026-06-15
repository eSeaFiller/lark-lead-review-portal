# Lark Lead Review Portal

Vercel-deployable internal review UI for partner leads.

There is no connect/setup page. The backend URL is configured in `config.js`, and reviewers enter only the admin key in the page header.

## Configure

Edit `config.js` before deployment:

```js
window.LEAD_REVIEW_CONFIG = {
  apiBase: "https://your-partner-lead-portal.vercel.app"
};
```

Do not include `/partner` or `/admin`; use only the root domain.

## Deploy To Vercel

Upload this folder as a separate GitHub repository, then import it in Vercel.

Required files:

```text
index.html
styles.css
app.js
config.js
vercel.json
README.md
```

Vercel settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: leave empty
```

## Backend Requirements

The partner lead backend must expose:

```text
GET /api/leads
PATCH /api/leads/:id
GET /api/export?status=approved
GET /exports/:file
```

The backend must allow CORS for this Vercel domain through `CORS_ALLOW_ORIGIN`.
