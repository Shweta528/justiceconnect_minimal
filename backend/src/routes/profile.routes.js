// backend/src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');


// Simple auth guard – adjust to match your existing session logic
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  req.userId = req.session.user.id; // attach user id for convenience
  next();
}

/**
 * GET /api/profile/me
 * Returns profile data for the currently logged-in user
 */
router.get('/profile/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      email: user.email,
      role: user.role,
      preferredName: user.preferredName || '',
      legalName: user.legalName || '',
      contactMethod: user.contactMethod || '',
      phone: user.phone || '',
      safeToContact: !!user.safeToContact,
      province: user.province || '',
      city: user.city || '',
      language: user.language || 'English',
      contactTimes: user.contactTimes || '',
      accessNeeds: user.accessNeeds || '',
      notes: user.notes || '',
      avatarUrl: user.avatarUrl || ''
    });
  } catch (err) {
    console.error('GET /api/profile/me error:', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});


/**
 * PUT /api/profile/me
 * Updates profile data for the current user
 */
router.put('/profile/me', requireAuth, async (req, res) => {
  try {
    const allowed = [
      'preferredName', 'legalName', 'contactMethod', 'phone',
      'safeToContact', 'province', 'city', 'language',
      'contactTimes', 'accessNeeds', 'notes'
    ];

    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    if (typeof update.safeToContact === 'string') {
      update.safeToContact = update.safeToContact === 'true';
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('PUT /api/profile/me error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});


module.exports = router;
