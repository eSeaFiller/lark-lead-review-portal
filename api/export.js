const { proxyFetch, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const status = req.query.status || "approved";
  const batchId = req.query.batchId || "";
  try {
    const params = new URLSearchParams({ status });
    if (batchId) params.set("batchId", batchId);
    const response = await proxyFetch(`/api/export?${params.toString()}`);
    const payload = await response.json();
    return sendJson(res, response.status, payload);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
