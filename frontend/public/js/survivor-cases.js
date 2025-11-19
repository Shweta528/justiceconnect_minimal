(async () => {
  function $(id) { return document.getElementById(id); }

  const url = new URL(location.href);
  const id = url.searchParams.get("id");

  if (!id) {
    $("#errorBox").textContent = "No case ID provided.";
    $("#errorBox").classList.remove("d-none");
    return;
  }

  try {
    const res = await fetch(`/api/cases/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok) {
      $("#errorBox").textContent = data.message || "Cannot load case.";
      $("#errorBox").classList.remove("d-none");
      return;
    }

    const c = data.case;

    $("#c-caseId").textContent = c.caseId;
    $("#c-status").textContent = c.status;
    $("#c-created").textContent = new Date(c.createdAt).toLocaleString();
    $("#c-updated").textContent = new Date(c.updatedAt).toLocaleString();

    // Survivor info from CaseRequest
    $("#c-preferredName").textContent = c.preferredName;

    // Contact
    $("#c-contactMethod").textContent = c.contactMethod;
    $("#c-contactValue").textContent = c.contactValue;
    $("#c-safe").textContent = c.safeToContact ? "Yes" : "No";
    $("#c-contactTimes").textContent = c.contactTimes;

    // Location
    $("#c-province").textContent = c.province;
    $("#c-city").textContent = c.city;
    $("#c-language").textContent = c.language;

    // Case details
    $("#c-issue").textContent = c.issueCategory;
    $("#c-outcome").textContent = c.desiredOutcome;
    $("#c-situation").textContent = c.situation;
    $("#c-urgency").textContent = c.urgency;
    $("#c-safety").textContent = c.safetyConcern ? "Yes" : "No";

    // Additional
    $("#c-access").textContent = c.accessNeeds;
    $("#c-notes").textContent = c.confidentialNotes;

  } catch (err) {
    console.error("❌ JS Error:", err);
    $("#errorBox").textContent = "Error loading case.";
    $("#errorBox").classList.remove("d-none");
  }
})();
