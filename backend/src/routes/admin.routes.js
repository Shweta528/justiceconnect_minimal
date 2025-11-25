// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const CaseRequest = require('../models/CaseRequest');
const Lawyer = require("../models/Lawyer");

function priorityBadge(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u === 'high') return { label: 'High', class: 'bg-danger' };
  if (u === 'medium') return { label: 'Medium', class: 'bg-warning text-dark' };
  return { label: 'Low', class: 'bg-secondary' };
}

// ⭐ ONLY ONE ROUTE — KEEP THIS ONE
router.get('/cases/queue', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const statuses = ['Submitted', 'In Review', 'Assigned'];

    const cases = await CaseRequest.find({ status: { $in: statuses } })
      .sort({ createdAt: -1 })
      .select(
        'caseId status urgency province issueCategory preferredName safetyConcern ' +
        'assignedLawyer assignedLawyerName updatedAt'
      )
      .lean();

    const mapped = cases.map(doc => {
      const survivorLabel =
        doc.preferredName && !doc.safetyConcern
          ? doc.preferredName
          : "Anonymous Survivor";

      return {
        caseId: doc.caseId,
        survivorLabel,
        survivorSub: `${doc.province || '—'} • ${doc.issueCategory || '—'}`,
        urgency: priorityBadge(doc.urgency),
        rowStatus: doc.status,
        
        // ⭐ REQUIRED FIELDS FOR BUTTON LOGIC ⭐
        assignedLawyer: doc.assignedLawyer || null,
        assignedLawyerName: doc.assignedLawyerName || ""
      };
    });

    return res.json({ items: mapped });

  } catch (err) {
    console.error("QUEUE ERROR:", err);
    res.status(500).json({ message: "Error loading queue" });
  }
});

// SINGLE LAWYERS ROUTE
router.get("/lawyers", requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const lawyers = await Lawyer.find().lean();
    res.json({ success: true, data: lawyers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load lawyers" });
  }
});

module.exports = router;
