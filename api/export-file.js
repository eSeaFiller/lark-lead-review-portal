const { proxyFetch, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const file = req.query.file || "";
  if (!file || file.includes("/") || file.includes("..")) {
    return sendJson(res, 400, { error: "Invalid file" });
  }
  try {
    const response = await proxyFetch(`/exports/${encodeURIComponent(file)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Download failed" }));
      return sendJson(res, response.status, payload);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.status(response.status).send(bytes);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
