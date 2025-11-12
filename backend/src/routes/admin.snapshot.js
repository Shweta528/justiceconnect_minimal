// backend/src/routes/admin.snapshot.js
const express = require('express');
const router = express.Router();

const CaseRequest = require('../models/CaseRequest');
const { requireAuth, requireRole } = require('../middleware/auth');

// OPTIONAL: if you have a Lawyer or User model to count availability
let LawyerOrUser = null;
try {
  // Prefer a Lawyer model; otherwise fall back to User with role=lawyer
  LawyerOrUser = require('../models/Lawyer');
} catch (_) {
  try { LawyerOrUser = require('../models/User'); } catch (_) {}
}

router.get('/system-snapshot', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // High priority cases needing assignment now
    const highPriority = await CaseRequest.countDocuments({
      urgency: { $in: [/^High$/i] },
      status:  { $in: [/^Submitted$/i, /^In Review$/i] }
    });

    // Lawyers available (best effort)
    let lawyersAvailable = 0;
    if (LawyerOrUser) {
      // If using User model: expect { role:'lawyer', acceptingCases:true }
      // If using Lawyer model: expect { acceptingCases:true }
      const roleFilter =
        (LawyerOrUser.modelName === 'User')
          ? { role: { $in: ['lawyer', 'Lawyer'] } }
          : {};
      lawyersAvailable = await LawyerOrUser.countDocuments({
        ...roleFilter,
        $or: [
          { acceptingCases: true },
          { status: { $in: [/^Available$/i, /^Accepting$/i] } }
        ]
      });
    }

    // Survivors supported this week (proxy: cases updated in last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const survivorsSupportedWeek = await CaseRequest.countDocuments({
      updatedAt: { $gte: since }
    });

    // Simple access/security status (0 alerts -> OK)
    // Replace with your own checks (e.g., AuditLog collection)
    const security = { statusText: 'No policy violations', level: 'ok' };

    res.json({ highPriority, lawyersAvailable, survivorsSupportedWeek, security });
  } catch (err) {
    console.error('system-snapshot error:', err);
    res.status(500).json({ message: 'Failed to load snapshot' });
  }
});

module.exports = router;
