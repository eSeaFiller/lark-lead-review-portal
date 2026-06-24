const state = {
  leads: [],
};

const leadRows = document.querySelector("#leadRows");
const leadSummary = document.querySelector("#leadSummary");
const exportResult = document.querySelector("#exportResult");
const systemNotice = document.querySelector("#systemNotice");
const statusFilter = document.querySelector("#statusFilter");
const activityFilter = document.querySelector("#activityFilter");
const batchFilter = document.querySelector("#batchFilter");

const FIELD_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  country: "Country",
  companyName: "Company Name",
  mobileNumber: "Mobile Number",
  workEmail: "Work Email",
  jobTitle: "Job Title",
  companySize: "Company Size",
  industry: "Industry",
  subIndustry: "Sub Industry",
  trackingCode: "Tracking Code",
};

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

function formatShortDate(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function warningSummary(lead) {
  const values = Object.entries(lead.warnings || {})
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => {
      const label = FIELD_LABELS[field] || field;
      const text = String(message);
      return text.includes(":") ? text : `${label}: ${text}`;
    });
  return values.length ? values.join("; ") : "None";
}

function leadBatchId(lead) {
  return lead.uploadBatchId || "__none__";
}

function leadBatchLabel(lead) {
  const batchId = lead.uploadBatchId || "";
  const shortBatch = batchId && batchId !== "__none__" ? batchId.slice(-6) : "";
  const createdAt = lead.uploadBatchCreatedAt || lead.createdAt || "";
  if (shortBatch) {
    return `${formatShortDate(createdAt)} · ${activityName(lead)} · Batch ${shortBatch}`;
  }
  if (lead.uploadBatchLabel) return lead.uploadBatchLabel;
  if (createdAt) return `${formatShortDate(createdAt)} · ${activityName(lead)}`;
  return "No batch";
}

function activityName(lead) {
  return lead.partner || "Unknown activity";
}

function partnerName(lead) {
  return lead.partnerName || "Unknown partner";
}

function getActivities() {
  const activities = new Map();
  for (const lead of state.leads) {
    const name = activityName(lead);
    activities.set(name, (activities.get(name) || 0) + 1);
  }
  return [...activities.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderActivityFilter() {
  const current = activityFilter.value || "all";
  const activities = getActivities();
  activityFilter.replaceChildren(new Option("All activities", "all"));
  for (const activity of activities) {
    activityFilter.append(new Option(`${activity.name} (${activity.count})`, activity.name));
  }
  activityFilter.value = activities.some((activity) => activity.name === current) ? current : "all";
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
  renderActivityFilter();
  renderBatchFilter();
  renderLeads();
}

function renderLeads() {
  const status = statusFilter.value;
  const activity = activityFilter.value;
  const batchId = batchFilter.value;
  const leads = state.leads.filter((lead) => {
    const statusMatches = status === "all" || lead.status === status;
    const activityMatches = activity === "all" || activityName(lead) === activity;
    const batchMatches = batchId === "all" || leadBatchId(lead) === batchId;
    return statusMatches && activityMatches && batchMatches;
  }).sort((a, b) => {
    const activityCompare = activityName(a).localeCompare(activityName(b));
    if (activityCompare) return activityCompare;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
  leadRows.replaceChildren();

  if (!leads.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="11" class="empty-state">No leads match this filter.</td>`;
    leadRows.append(tr);
  }

  let currentActivity = "";
  for (const lead of leads) {
    const fields = lead.fields || {};
    const activity = activityName(lead);
    if (activity !== currentActivity) {
      currentActivity = activity;
      const group = document.createElement("tr");
      const count = leads.filter((item) => activityName(item) === activity).length;
      group.className = "activity-group";
      group.innerHTML = `<td colspan="11"><span>Activity</span><strong>${escapeHtml(activity)}</strong><em>${count} leads</em></td>`;
      leadRows.append(group);
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="status ${escapeHtml(lead.status)}">${escapeHtml(lead.status)}</span></td>
      <td>${escapeHtml(activity)}</td>
      <td>${escapeHtml(partnerName(lead))}</td>
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
    `${state.leads.length} total · ${leads.length} shown · ${getActivities().length} activities · ${getBatches().length} batches · ${counts.pending || 0} pending · ${counts.approved || 0} approved · ${counts.rejected || 0} rejected`;
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
  if (batchFilter.value === "all") {
    exportResult.textContent = "Choose one upload batch before exporting with a tracking code.";
    exportResult.classList.remove("hidden");
    return;
  }

  const trackingCode = window.prompt("Tracking code for this export batch");
  if (trackingCode === null) return;
  const normalizedTrackingCode = trackingCode.trim();
  if (!normalizedTrackingCode) {
    exportResult.textContent = "Tracking code is required for export.";
    exportResult.classList.remove("hidden");
    return;
  }

  exportResult.textContent = "Generating export...";
  exportResult.classList.remove("hidden");
  const params = new URLSearchParams({ status: "approved", trackingCode: normalizedTrackingCode });
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
  exportResult.innerHTML = `Exported ${payload.count} approved leads from ${batchText} with tracking code ${escapeHtml(normalizedTrackingCode)}: <a href="${link}">${escapeHtml(fileName)}</a>`;
}

document.querySelector("#refreshTop").addEventListener("click", loadLeads);
document.querySelector("#refreshLeads").addEventListener("click", loadLeads);
statusFilter.addEventListener("change", renderLeads);
activityFilter.addEventListener("change", renderLeads);
batchFilter.addEventListener("change", renderLeads);
document.querySelector("#exportApproved").addEventListener("click", exportApproved);
leadRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id][data-status]");
  if (button) updateLead(button.dataset.id, button.dataset.status);
});

loadLeads();
