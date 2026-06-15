const { proxyFetch, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  try {
    const response = await proxyFetch("/api/leads");
    const payload = await response.json();
    return sendJson(res, response.status, payload);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
