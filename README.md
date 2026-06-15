# Lark Lead Review Portal

Vercel-deployable internal review UI for partner leads.

This is the Lark-side page only. It connects to the same lead portal backend API used by the partner submission page.

## Deploy To Vercel

Upload this folder as a separate GitHub repository, then import it in Vercel.

Required files:

```text
index.html
styles.css
app.js
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

## Use

Open the deployed page and enter:

```text
Lead Portal URL: https://your-partner-lead-backend-domain
Admin Key: your ADMIN_KEY from the backend
```

The backend must expose:

```text
GET /api/leads
PATCH /api/leads/:id
GET /api/export?status=approved
GET /exports/:file
```

The backend must also allow CORS for this Vercel domain. The current `partner-lead-portal` backend supports this through `CORS_ALLOW_ORIGIN`.
