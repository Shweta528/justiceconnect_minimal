// Load lawyer directory list
async function loadLawyerDirectory() {
    try {
        const res = await fetch("http://localhost:4000/api/admin/lawyers");
        const json = await res.json();

        if (!json.success) {
            console.error("Failed to load lawyers");
            return;
        }

        const tbody = document.getElementById("lawyerTableBody");
        tbody.innerHTML = "";

        json.data.forEach(lawyer => {
            tbody.innerHTML += `
<tr>
    <td>${lawyer.fullName}</td>
    <td>${lawyer.specialization}</td>
    <td>${lawyer.licenseProvince || "-"}</td>
    <td>${lawyer.licenseNumber || "-"}</td>
    <td>${lawyer.yearsExperience || 0} years</td>

    <td>${lawyer.acceptingCases ? "Available" : "Unavailable"}</td>

    <td>
        <div>${lawyer.email}</div>
        <div>${lawyer.phone || "-"}</div>
    </td>

    <td>
        <span class="badge ${lawyer.isActive ? "bg-success" : "bg-secondary"}">
            ${lawyer.status}
        </span>
    </td>

    <td>
        <button class="btn btn-primary btn-sm" onclick="assignCase('${lawyer._id}')">
            Assign Case
        </button>
    </td>
</tr>
`;

        });
    } catch (err) {
        console.error("Error fetching lawyers:", err);
    }
}
function assignCase(lawyerId) {
    // Redirect admin to your case queue page with the selected lawyer
    window.location.href = `/admin/cases/queue?assign=${lawyerId}`;
}

document.addEventListener("DOMContentLoaded", loadLawyerDirectory);
