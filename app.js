const state = {
  apiBase: localStorage.getItem("larkLeadApiBase") || "",
  adminKey: sessionStorage.getItem("larkLeadAdminKey") || "",
  leads: [],
};

const accessForm = document.querySelector("#accessForm");
const loginPanel = document.querySelector("#loginPanel");
const reviewPanel = document.querySelector("#reviewPanel");
const loginStatus = document.querySelector("#loginStatus");
const leadRows = document.querySelector("#leadRows");
const leadSummary = document.querySelector("#leadSummary");
const exportResult = document.querySelector("#exportResult");

function apiUrl(path) {
  return `${state.apiBase.replace(/\/$/, "")}${path}`;
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Admin-Key": state.adminKey,
  };
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

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function warningSummary(lead) {
  const values = Object.values(lead.warnings || {}).filter(Boolean);
  return values.length ? values.join("; ") : "None";
}

async function loadLeads() {
  loginStatus.textContent = "";
  const response = await fetch(apiUrl("/api/leads"), {
    headers: adminHeaders(),
  });
  const payload = await response.json();
  if (!response.ok) {
    loginPanel.classList.remove("hidden");
    reviewPanel.classList.add("hidden");
    loginStatus.textContent = payload.error || "Unable to connect.";
    return;
  }
  state.leads = payload.leads || [];
  loginPanel.classList.add("hidden");
  reviewPanel.classList.remove("hidden");
  renderLeads();
}

function renderLeads() {
  const filter = document.querySelector("#statusFilter").value;
  const leads = state.leads.filter((lead) => filter === "all" || lead.status === filter);
  leadRows.replaceChildren();

  for (const lead of leads) {
    const fields = lead.fields || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="status ${escapeHtml(lead.status)}">${escapeHtml(lead.status)}</span></td>
      <td>${escapeHtml(lead.partner)}</td>
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
    `${state.leads.length} total · ${counts.pending || 0} pending · ${counts.approved || 0} approved · ${counts.rejected || 0} rejected`;
}

async function updateLead(id, status) {
  const response = await fetch(apiUrl(`/api/leads/${id}`), {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    alert("Update failed. Check admin key and API URL.");
    return;
  }
  await loadLeads();
}

async function exportApproved() {
  exportResult.textContent = "Generating export...";
  exportResult.classList.remove("hidden");
  const response = await fetch(apiUrl("/api/export?status=approved"), {
    headers: adminHeaders(),
  });
  const payload = await response.json();
  if (!response.ok) {
    exportResult.textContent = payload.error || "Export failed.";
    return;
  }
  const fileName = payload.path.split("/").pop();
  const link = `${apiUrl(`/exports/${fileName}`)}?admin_key=${encodeURIComponent(state.adminKey)}`;
  exportResult.innerHTML = `Exported ${payload.count} approved leads: <a href="${link}">${escapeHtml(fileName)}</a>`;
}

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.apiBase = document.querySelector("#apiBase").value.trim();
  state.adminKey = document.querySelector("#adminKey").value.trim();
  localStorage.setItem("larkLeadApiBase", state.apiBase);
  sessionStorage.setItem("larkLeadAdminKey", state.adminKey);
  loginStatus.textContent = "Connecting...";
  await loadLeads();
});

document.querySelector("#resetAccess").addEventListener("click", () => {
  sessionStorage.removeItem("larkLeadAdminKey");
  localStorage.removeItem("larkLeadApiBase");
  state.apiBase = "";
  state.adminKey = "";
  document.querySelector("#apiBase").value = "";
  document.querySelector("#adminKey").value = "";
  loginPanel.classList.remove("hidden");
  reviewPanel.classList.add("hidden");
});

document.querySelector("#refreshLeads").addEventListener("click", loadLeads);
document.querySelector("#statusFilter").addEventListener("change", renderLeads);
document.querySelector("#exportApproved").addEventListener("click", exportApproved);
leadRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id][data-status]");
  if (button) updateLead(button.dataset.id, button.dataset.status);
});

document.querySelector("#apiBase").value = state.apiBase;
document.querySelector("#adminKey").value = state.adminKey;
if (state.apiBase && state.adminKey) {
  loadLeads();
}
