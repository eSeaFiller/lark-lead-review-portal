function config() {
  const apiBase = (process.env.LEAD_PORTAL_API_BASE || "").replace(/\/$/, "");
  const adminKey = process.env.LEAD_PORTAL_ADMIN_KEY || "";
  if (!apiBase) {
    throw new Error("Missing LEAD_PORTAL_API_BASE");
  }
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
