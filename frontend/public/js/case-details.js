// ===== Helpers =====
const qs = (k) => new URLSearchParams(location.search).get(k);
const fmtYN = (b) => (b ? "Yes" : "No");
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
const priorityBadge = (p) => {
  const map = { High: "warning text-dark", Medium: "info text-dark", Low: "secondary" };
  const cls = map[p] || "secondary";
  return `<span class="badge bg-${cls}">${p}</span>`;
};

// ===== Load lawyers dynamically into dropdown (MUST be above init!) =====
async function loadLawyersIntoDropdown() {
  try {
    const res = await fetch("/api/admin/lawyers", { credentials: "include" });
    const json = await res.json();

    if (!json.success) {
      console.error("Failed to load lawyers");
      return;
    }

    const lawyers = json.data;
    const select = document.getElementById("as-lawyer");

    // Reset dropdown
    select.innerHTML = `<option value="" disabled selected>Choose a lawyer…</option>`;

    lawyers.forEach((lawyer) => {
      const option = document.createElement("option");
      option.value = lawyer._id;
      option.textContent = `${lawyer.fullName} (${lawyer.specialization})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading lawyers:", err);
  }
}

// ===== API call to load case =====
async function loadCase(caseId) {
  const url = `/api/admin/cases/${encodeURIComponent(caseId)}`;
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json();
}

// ===== Main Init =====
(async function init() {
  try {
    const caseId = qs("caseId");

    if (!caseId) {
      document.querySelector("main").innerHTML =
        '<div class="alert alert-danger mt-4">Missing <code>caseId</code>.</div>';
      return;
    }

    const backLink = document.getElementById("backLink");
    const backLink2 = document.getElementById("backLink2");
    if (backLink) backLink.href = "admin.html";
    if (backLink2) backLink2.href = "admin.html";

    // Load case data
    const data = await loadCase(caseId);

    // Load lawyers into dropdown BEFORE filling form
    await loadLawyersIntoDropdown();

    // ===== Fill Summary =====
    document.getElementById("cd-caseId").textContent = `Case: ${data.caseId}`;
    document.getElementById("priorityPill").innerHTML = priorityBadge(data.urgency || data.priority || "—");
    document.getElementById("statusPill").textContent = data.status || "—";

    document.getElementById("cd-name").textContent = data.preferredName || "—";
    document.getElementById("cd-location").textContent =
      [data.province, data.city].filter(Boolean).join(" • ") || "—";
    document.getElementById("cd-category").textContent = data.issueCategory || "—";
    document.getElementById("cd-created").textContent = fmtDateTime(data.created);
    document.getElementById("cd-desc").textContent = data.situation || "—";

    // ===== Contact =====
    document.getElementById("rd-contactMethod").textContent = data.contactMethod || "—";
    document.getElementById("rd-contactValue").textContent = data.contactValue || "—";
    document.getElementById("rd-safe").textContent = fmtYN(!!data.safeToContact);

    // ===== Location =====
    document.getElementById("rd-province").textContent = data.province || "—";
    document.getElementById("rd-city").textContent = data.city || "—";
    document.getElementById("rd-language").textContent = data.language || "—";

    // ===== Issue =====
    document.getElementById("rd-issueCategory").textContent = data.issueCategory || "—";
    document.getElementById("rd-desiredOutcome").textContent = data.desiredOutcome || "—";
    document.getElementById("rd-situation").textContent = data.situation || "—";

    // ===== Urgency & Safety =====
    document.getElementById("rd-urgency").textContent = data.urgency || "—";
    document.getElementById("rd-safetyConcern").textContent = fmtYN(!!data.safetyConcern);

    // ===== Preferences =====
    document.getElementById("rd-contactTimes").textContent = data.contactTimes || "—";
    document.getElementById("rd-accessNeeds").textContent = data.accessNeeds || "—";
    document.getElementById("rd-confidentialNotes").textContent = data.confidentialNotes || "—";

    // ===== Attachments =====
    const list = document.getElementById("rd-attachments");
    list.innerHTML = "";
    if (Array.isArray(data.attachments) && data.attachments.length > 0) {
      data.attachments.forEach((f) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/uploads/${encodeURIComponent(f.filename)}" download>${f.originalName || f.filename}</a>`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>—</li>";
    }

    // ===== Assign Form Defaults =====
    const asSelected = document.getElementById("as-selected");
    if (asSelected)
      asSelected.value = `${data.caseId} — ${data.preferredName || "Survivor"} (${data.issueCategory || "Case"})`;

    const prioritySel = document.getElementById("as-priority");
    if (prioritySel) prioritySel.value = data.urgency || "Medium";

    const statusSel = document.getElementById("as-status");
    if (statusSel) statusSel.value = data.status || "Submitted";

    // ===== Hide Assign Form If Already Assigned =====
    if (data.assignedLawyer) {
      document.querySelector("#assignForm").classList.add("d-none");
      document.querySelector("#assignSuccess").classList.add("d-none");

      const box = document.createElement("div");
      box.className = "alert alert-info mt-2";
      box.innerHTML = `This case is already assigned to <b>${data.assignedLawyerName}</b>.`;
      document.querySelector(".card-body").prepend(box);
      return;
    }

    // ===== Handle Assign Submission =====
    const form = document.getElementById("assignForm");
    const ok = document.getElementById("assignSuccess");
    const err = document.getElementById("assignError");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }
        err.classList.add("d-none");
        ok.classList.add("d-none");

        const payload = {
          lawyer: document.getElementById("as-lawyer").value,
          priority: document.getElementById("as-priority").value,
          status: document.getElementById("as-status").value,
          notes: document.getElementById("as-notes").value,
        };

        const res = await fetch(`/api/admin/cases/${encodeURIComponent(data.caseId)}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          err.textContent = "Unable to save assignment. Please try again.";
          err.classList.remove("d-none");
          return;
        }

        ok.classList.remove("d-none");
        setTimeout(() => {
          window.location.href = "admin.html?assigned=" + encodeURIComponent(data.caseId);
        }, 1200);
      });
    }
  } catch (e) {
    console.error(e);
  }
})();
