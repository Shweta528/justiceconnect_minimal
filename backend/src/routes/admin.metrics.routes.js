// backend/src/routes/admin.metrics.routes.js
const express = require('express');
const router = express.Router();
const CaseRequest = require('../models/CaseRequest');
const Lawyer = require('../models/Lawyer');

// For now, allow all (you can add admin auth later)
const requireAdmin = (req, res, next) => next();

router.get('/metrics/snapshot', requireAdmin, async (req, res) => {
  try {
    // HIGH PRIORITY + NOT ASSIGNED
    const highPriorityCases = await CaseRequest.countDocuments({
      urgency: 'High',
      status: { $in: ['Submitted', 'In Review'] },
      assignedLawyer: null
    });

    const lawyersAvailable = await Lawyer.countDocuments({
      isActive: true,
      acceptingCases: true
    });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const survivorsSupported = await CaseRequest.countDocuments({
      updatedAt: { $gte: weekStart },
      status: { $in: ['Assigned', 'Closed'] }
    });

    res.json({
      highPriorityCases,
      lawyersAvailable,
      survivorsSupported,
      security: 'OK'
    });

  } catch (err) {
    console.error('snapshot metrics error:', err);
    res.status(500).json({ message: 'Failed to load snapshot metrics' });
  }
});

module.exports = router;
