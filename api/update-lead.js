const { proxyFetch, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "PATCH") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const { id, status } = req.body || {};
  if (!id || !status) {
    return sendJson(res, 400, { error: "Missing id or status" });
  }
  try {
    const response = await proxyFetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    return sendJson(res, response.status, payload);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
