function config() {
  const defaultApiBase = "https://partner-lead-portal2-fnmw.vercel.app";
  const apiBase = (process.env.LEAD_PORTAL_API_BASE || defaultApiBase).replace(/\/$/, "");
  const adminKey = process.env.LEAD_PORTAL_ADMIN_KEY || "";
  return { apiBase, adminKey };
}

async function proxyFetch(path, options = {}) {
  const { apiBase, adminKey } = config();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(adminKey ? { "X-Admin-Key": adminKey } : {}),
    },
  });
  return response;
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

module.exports = {
  proxyFetch,
  sendJson,
};
