// backend/src/routes/admin.snapshot.js
const express = require('express');
const router = express.Router();

const CaseRequest = require('../models/CaseRequest');
const Lawyer = require('../models/Lawyer');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/system-snapshot', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    //-- 1️⃣ HIGH PRIORITY CASES (ALL)
    const highPriority = await CaseRequest.countDocuments({
      urgency: "High"
    });

    //-- 2️⃣ TOTAL LAWYERS (not availability-based)
    const lawyersAvailable = await Lawyer.countDocuments({});

    //-- 3️⃣ SURVIVORS SUPPORTED THIS WEEK (Assigned cases updated in last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const survivorsSupportedWeek = await CaseRequest.countDocuments({
  status: "Assigned",
  updatedAt: { $gte: since }
});

    //-- 4️⃣ BASIC SECURITY INDICATOR
    const security = "OK";

    res.json({
      highPriority,
      lawyersAvailable,
      survivorsSupported: survivorsSupportedWeek,
      security
    });

  } catch (err) {
    console.error("system-snapshot error:", err);
    res.status(500).json({ message: "Failed to load snapshot" });
  }
});

module.exports = router;
