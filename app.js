const state = {
  leads: [],
};

const leadRows = document.querySelector("#leadRows");
const leadSummary = document.querySelector("#leadSummary");
const exportResult = document.querySelector("#exportResult");
const systemNotice = document.querySelector("#systemNotice");
const statusFilter = document.querySelector("#statusFilter");
const batchFilter = document.querySelector("#batchFilter");

function apiUrl(path) {
  return path;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function showNotice(message) {
  systemNotice.textContent = message;
  systemNotice.classList.remove("hidden");
}

function hideNotice() {
  systemNotice.classList.add("hidden");
  systemNotice.textContent = "";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function warningSummary(lead) {
  const values = Object.values(lead.warnings || {}).filter(Boolean);
  return values.length ? values.join("; ") : "None";
}

function leadBatchId(lead) {
  return lead.uploadBatchId || "__none__";
}

function leadBatchLabel(lead) {
  if (lead.uploadBatchLabel) return lead.uploadBatchLabel;
  if (lead.uploadBatchCreatedAt) return `${lead.partner || "Unknown partner"} · ${formatDate(lead.uploadBatchCreatedAt)}`;
  return "No batch";
}

function getBatches() {
  const batches = new Map();
  for (const lead of state.leads) {
    const id = leadBatchId(lead);
    if (!batches.has(id)) {
      batches.set(id, {
        id,
        label: leadBatchLabel(lead),
        createdAt: lead.uploadBatchCreatedAt || lead.createdAt || "",
        count: 0,
      });
    }
    batches.get(id).count += 1;
  }
  return [...batches.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function renderBatchFilter() {
  const current = batchFilter.value || "all";
  const batches = getBatches();
  batchFilter.replaceChildren(new Option("All upload batches", "all"));
  for (const batch of batches) {
    batchFilter.append(new Option(`${batch.label} (${batch.count})`, batch.id));
  }
  batchFilter.value = batches.some((batch) => batch.id === current) ? current : "all";
}

async function loadLeads() {
  hideNotice();
  exportResult.classList.add("hidden");

  const response = await fetch(apiUrl("/api/leads"), {
    headers: { "Content-Type": "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    showNotice(payload.error || "Unable to load leads.");
    return;
  }
  state.leads = payload.leads || [];
  renderBatchFilter();
  renderLeads();
}

function renderLeads() {
  const status = statusFilter.value;
  const batchId = batchFilter.value;
  const leads = state.leads.filter((lead) => {
    const statusMatches = status === "all" || lead.status === status;
    const batchMatches = batchId === "all" || leadBatchId(lead) === batchId;
    return statusMatches && batchMatches;
  });
  leadRows.replaceChildren();

  if (!leads.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="10" class="empty-state">No leads match this filter.</td>`;
    leadRows.append(tr);
  }

  for (const lead of leads) {
    const fields = lead.fields || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="status ${escapeHtml(lead.status)}">${escapeHtml(lead.status)}</span></td>
      <td>${escapeHtml(lead.partner)}</td>
      <td>${escapeHtml(leadBatchLabel(lead))}</td>
      <td><strong>${escapeHtml(fields.firstName)} ${escapeHtml(fields.lastName)}</strong><br>${escapeHtml(fields.workEmail)}</td>
      <td>${escapeHtml(fields.companyName)}</td>
      <td>${escapeHtml(fields.country)}</td>
      <td>${escapeHtml(fields.jobTitle)}</td>
      <td>${escapeHtml(warningSummary(lead))}</td>
      <td>${escapeHtml(formatDate(lead.createdAt))}</td>
      <td>
        <div class="review-buttons">
          <button type="button" data-id="${lead.id}" data-status="approved">Approve</button>
          <button type="button" data-id="${lead.id}" data-status="rejected">Reject</button>
          <button type="button" data-id="${lead.id}" data-status="pending">Pending</button>
        </div>
      </td>
    `;
    leadRows.append(tr);
  }

  const counts = state.leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});
  leadSummary.textContent =
    `${state.leads.length} total · ${leads.length} shown · ${getBatches().length} batches · ${counts.pending || 0} pending · ${counts.approved || 0} approved · ${counts.rejected || 0} rejected`;
}

async function updateLead(id, status) {
  const response = await fetch(apiUrl("/api/update-lead"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!response.ok) {
    showNotice("Update failed. Check backend environment variables.");
    return;
  }
  await loadLeads();
}

async function exportApproved() {
  exportResult.textContent = "Generating export...";
  exportResult.classList.remove("hidden");
  const params = new URLSearchParams({ status: "approved" });
  if (batchFilter.value !== "all") params.set("batchId", batchFilter.value);
  const response = await fetch(apiUrl(`/api/export?${params.toString()}`));
  const payload = await response.json();
  if (!response.ok) {
    exportResult.textContent = payload.error || "Export failed.";
    return;
  }
  const fileName = payload.path.split("/").pop();
  const link = `/api/export-file?file=${encodeURIComponent(fileName)}`;
  const batchText = batchFilter.value === "all" ? "all batches" : `batch ${escapeHtml(batchFilter.options[batchFilter.selectedIndex]?.text || batchFilter.value)}`;
  exportResult.innerHTML = `Exported ${payload.count} approved leads from ${batchText}: <a href="${link}">${escapeHtml(fileName)}</a>`;
}

document.querySelector("#refreshTop").addEventListener("click", loadLeads);
document.querySelector("#refreshLeads").addEventListener("click", loadLeads);
statusFilter.addEventListener("change", renderLeads);
batchFilter.addEventListener("change", renderLeads);
document.querySelector("#exportApproved").addEventListener("click", exportApproved);
leadRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id][data-status]");
  if (button) updateLead(button.dataset.id, button.dataset.status);
});

loadLeads();
