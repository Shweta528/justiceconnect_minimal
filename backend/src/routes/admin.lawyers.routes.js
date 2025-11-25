// backend/src/routes/admin.lawyers.routes.js
const express = require("express");
const router = express.Router();
const Lawyer = require("../models/Lawyer");

// GET /api/admin/lawyers
router.get("/lawyers", async (req, res) => {
  try {
    const lawyers = await Lawyer.find().sort({ fullName: 1 }).lean();
    res.json({ items: lawyers });
  } catch (err) {
    console.error("GET /api/admin/lawyers ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
