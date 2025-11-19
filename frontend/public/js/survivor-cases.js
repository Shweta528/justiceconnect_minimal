// frontend/public/js/survivor-cases.js
(function () {

  // ---------- Helper: Safe selector ----------
  function $(id) {
    const el = document.getElementById(id);
    if (!el) console.warn("⚠ Missing HTML element:", id);
    return el;
  }

  // ---------- Formatters ----------
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function statusBadge(status) {
    const s = (status || "").toLowerCase();
    if (s === "submitted") return `<span class="badge bg-primary-subtle text-primary">Submitted</span>`;
    if (s === "review" || s === "in review") return `<span class="badge bg-warning text-dark">In Review</span>`;
    if (s === "assigned") return `<span class="badge bg-success-subtle text-success">Assigned</span>`;
    if (s === "closed") return `<span class="badge bg-secondary-subtle text-secondary">Closed</span>`;
    return `<span class="badge bg-secondary">${status}</span>`;
  }

  async function apiJson(path) {
    const res = await fetch(path, { credentials: "include" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  // ------------------ DELETE A CASE ------------------
  async function deleteCase(id) {
    if (!confirm("Are you sure you want to delete this case?")) return;

    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        alert("❌ Could not delete. Try again.");
        return;
      }

      alert("✔ Case deleted");
      location.reload();

    } catch (err) {
      console.error(err);
      alert("Error deleting case.");
    }
  }

  // ------------------ 1. SINGLE ROW SUMMARY ------------------
  async function renderLatestCaseRow() {
    const elId = $("cd-caseId");
    const elSt = $("cd-status");
    const elLaw = $("cd-lawyer");
    const elNext = $("cd-next");
    const elDesc = $("cd-desc");
    const elUpd = $("cd-updated");
    const elView = $("cd-view");
    const elEdit = $("cd-edit");
    const elDelete = $("cd-delete");

    // If summary row is not on this page, silently skip
    if (!elId || !elSt || !elLaw || !elNext || !elDesc || !elUpd) return;

    try {
      const data = await apiJson("/api/cases/latest");
      const c = data.case;

      if (!c) {
        elId.textContent = "—";
        elSt.innerHTML = statusBadge("Submitted");
        elLaw.textContent = "—";
        elNext.textContent = "—";
        elDesc.textContent = "No cases yet.";
        elUpd.textContent = "—";
        return;
      }

      // Fill fields
      elId.textContent = c.caseId;
      elSt.innerHTML = statusBadge(c.status);
      elLaw.textContent = c.assignedLawyerName || "—";
      elNext.textContent = c.desiredOutcome || "—";
      elDesc.textContent = c.situation || "—";
      elUpd.textContent = fmtDate(c.updatedAt);

      // ACTION BUTTONS
      if (elView)  elView.href  = `/case-view.html?id=${c._id}`;
      if (elEdit)  elEdit.href  = `/case-edit.html?id=${c._id}`;
      if (elDelete) elDelete.onclick = () => deleteCase(c._id);

    } catch (err) {
      console.error("Latest case error:", err);
    }
  }

  // ------------------ 2. FULL CASE LIST (optional) ------------------
  async function renderMyCasesList() {
    const tbody = document.getElementById("cases-tbody");
    if (!tbody) return;

    try {
      const { items } = await apiJson("/api/cases/mine");

      if (!items.length) {
        tbody.innerHTML = `
          <tr><td colspan="7" class="text-center text-muted">No cases found</td></tr>
        `;
        return;
      }

      tbody.innerHTML = items
        .map((c) => {
          return `
            <tr>
              <td>${c.caseId}</td>
              <td>${statusBadge(c.status)}</td>
              <td>${c.assignedLawyerName || "—"}</td>
              <td>${c.desiredOutcome || "—"}</td>
              <td>${c.situation || "—"}</td>
              <td>${fmtDate(c.updatedAt)}</td>
              <td>
                <a href="/case-view.html?id=${c._id}" class="btn btn-sm btn-primary">View</a>
                <a href="/case-edit.html?id=${c._id}" class="btn btn-sm btn-warning">Edit</a>
                <button class="btn btn-sm btn-danger" onclick="deleteCase('${c._id}')">Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");

    } catch (err) {
      console.error("Cases list error:", err);
      tbody.innerHTML = `
        <tr><td colspan="7" class="text-danger text-center">Error loading cases</td></tr>
      `;
    }
  }

  // ------------------ INITIALIZE ------------------
  function boot() {
    renderLatestCaseRow();
    renderMyCasesList();
  }

  // Ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Expose deleteCase so HTML buttons can call it
  window.deleteCase = deleteCase;

})();
