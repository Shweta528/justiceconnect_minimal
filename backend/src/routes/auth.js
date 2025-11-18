const router = require('express').Router();
const User = require('../models/User');
const mailer = require('../config/mail');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fname, lname, phone, email, password, role, expertise = [], licenseNumber } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already used' });
    }

    // Create the new user
    const u = new User({
      fname,
      lname,
      phone,
      email,
      role,
      expertise,
      licenseNumber,
      status: (role === 'admin' || role === 'lawyer') ? 'pending' : 'approved'
    });

    await u.setPassword(password);
    await u.save();

    // If role requires approval, send email
    if (role === 'admin' || role === 'lawyer') {
      try {
        await mailer.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_NOTIFY, // comma-separated list if multiple
          subject: `Approval Required: New ${role} Registration`,
          text: `A new ${role} has registered and requires approval:\n
Name: ${fname} ${lname}
Email: ${email}
Phone: ${phone}
Expertise: ${expertise.join(', ')}`
        });
      } catch (mailErr) {
        console.error('Email sending failed:', mailErr);
        // still allow registration to succeed
      }
    }

    // Single response back to client
    return res.json({
      message: (role === 'admin' || role === 'lawyer')
        ? 'Registered successfully. Verification pending from super admin.'
        : 'Registered successfully. You can now log in.'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if(!u || !(await u.validatePassword(password))) {
    return res.status(400).json({message:'Invalid credentials'});
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

// Logout
router.post('/logout', (req,res)=>{
  req.session.destroy(()=> res.json({message:'Logged out'}));
});

// Who am I
router.get('/me', (req,res)=>{
  res.json({ user: req.session.user || null });
});

module.exports = router;
