// backend/src/routes/auth.js
const router = require('express').Router();
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const mailer = require('../config/mail');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const {
      fname,
      lname,
      phone,
      email,
      password,
      role,
      expertise = [],
      licenseNumber,
      province,
      specialization,
      yearsExperience = 0
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already used' });
    }

    // ---------- Create User ----------
    const user = new User({
      fname,
      lname,
      phone,
      email,
      role,
      expertise,
      licenseNumber,
      status: (role === 'lawyer') ? 'pending' : 'approved'
    });

    await user.setPassword(password);
    await user.save();

    // ---------- If Lawyer, create Lawyer table entry ----------
    if (user.role === "lawyer") {
    await Lawyer.create({
        fullName: `${fname} ${lname}`.trim(),
        email: user.email,
        phone: user.phone || "",
        
        // REQUIRED FIELDS (use placeholder if missing)
        specialization: Array.isArray(expertise)
            ? expertise.join(", ")
            : expertise || "General Law",
        province: province || "Unknown",
        licenseProvince: req.body.licenseProvince || province || "Unknown",
        licenseNumber: licenseNumber || "N/A",
        yearsExperience: yearsExperience || 0,

        isActive: true,
        acceptingCases: false,
        status: "Active"
    });
}


    return res.json({
      message: (role === 'lawyer')
        ? "Registered. Verification pending."
        : "Registered successfully."
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !(await u.validatePassword(password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  req.session.user = { id: u._id.toString(), role: u.role, email: u.email };

  res.json({
    user: {
      id: u._id.toString(),
      role: u.role,
      email: u.email
    }
  });
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// WHO AM I
router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
