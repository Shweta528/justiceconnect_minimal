// backend/src/routes/cases.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");

const CaseRequest = require("../models/CaseRequest"); // ✅ correct model

// ===== AUTH =====
function mustBeLoggedIn(req, res, next) {
  if (!req.user && !req.session?.userId)
    return res.status(401).json({ message: "Not logged in" });
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role)
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

// ===== FILE UPLOAD =====
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, safe);
  },
});

const allowed = new Set([
  "application/pdf",
  "text/plain",
  "application/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
]);

function fileFilter(_req, file, cb) {
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type: " + file.mimetype), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
});

// ===== VALIDATION =====
const validateCreate = [
  body("preferredName").trim().notEmpty(),
  body("contactMethod").isIn(["email", "phone", "sms", "in-app"]),
  body("province").trim().notEmpty(),
  body("issueCategory").trim().notEmpty(),
  body("situation").trim().notEmpty(),
  body("urgency").isIn(["Low", "Medium", "High"]),
];

// ===== GENERATE CASE ID =====
async function nextCaseId() {
  const year = new Date().getFullYear();
  const prefix = `JC-${year}-`;
  const last = await CaseRequest.findOne({
    caseId: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select("caseId")
    .lean();

  let n = 1;
  if (last?.caseId) {
    const m = last.caseId.match(/-(\d+)$/);
    if (m) n = parseInt(m[1]) + 1;
  }

  return prefix + String(n).padStart(3, "0");
}

// ================================================
// POST /api/cases/request  (Create new survivor case)
// ================================================
router.post(
  "/request",
  mustBeLoggedIn,
  upload.array("attachments", 5),
  validateCreate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const byField = {};
      errors.array().forEach((e) => (byField[e.path] = e.msg));
      return res.status(400).json({ message: "Validation failed", errors: byField });
    }

    try {
      const userId = req.user?._id || req.session.userId;

      const files = (req.files || []).map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        mimeType: f.mimetype,
        path: f.path,
      }));

      const doc = await CaseRequest.create({
        user: userId,
        preferredName: req.body.preferredName,
        contactMethod: req.body.contactMethod,
        contactValue: req.body.contactValue || "",
        safeToContact: String(req.body.safeToContact) === "true",

        province: req.body.province,
        city: req.body.city || "",
        language: req.body.language || "English",

        issueCategory: req.body.issueCategory,
        desiredOutcome: req.body.desiredOutcome || "",
        situation: req.body.situation,

        urgency: req.body.urgency,
        safetyConcern: String(req.body.safetyConcern) === "true",

        contactTimes: req.body.contactTimes || "",
        accessNeeds: req.body.accessNeeds || "",
        confidentialNotes: req.body.confidentialNotes || "",

        attachments: files,
        status: "Submitted",
        caseId: await nextCaseId(),
      });

      return res.json({
        message: "Your request has been submitted.",
        caseId: doc.caseId,
      });
    } catch (err) {
      console.error("Case request error:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// ================================================
// GET /api/cases/latest
// ================================================
router.get("/latest", mustBeLoggedIn, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;

    const c = await CaseRequest.findOne({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ case: c || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ================================================
// GET /api/cases/mine
// ================================================
router.get("/mine", mustBeLoggedIn, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;

    const list = await CaseRequest.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ items: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ================================================
// GET /api/cases/:id   (Full case details)
// ================================================
router.get('/:id', async (req, res) => {
  const caseId = req.params.id;

  console.log("========================================");
  console.log("📌 Request to GET /api/cases/:id");
  console.log("➡️ Incoming caseId:", caseId);
  console.log("➡️ Session user:", req.session.user);

  if (!req.session?.user) {
    console.log("❌ Not authenticated");
    console.log("========================================");
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = req.session.user.id;
  console.log("➡️ Extracted userId:", userId);

  try {
    // Fetch case from DB
    const c = await CaseRequest.findOne({
      _id: caseId,
      user: userId
    }).lean();

    console.log("⬅️ Case fetched from DB:", c);

    if (!c) {
      console.log("❌ Case not found or does not belong to user");
      console.log("========================================");
      return res.status(404).json({ message: 'Case not found' });
    }

    console.log("✅ Sending case JSON to frontend");
    console.log("========================================");

    res.json({ case: c });

  } catch (err) {
    console.error("❌ SERVER ERROR in GET /api/cases/:id:", err);
    console.log("========================================");
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================
// DELETE /api/cases/:id
// ================================================
router.delete("/:id", mustBeLoggedIn, async (req, res) => {
  try {
    const c = await CaseRequest.findOneAndDelete({
      _id: req.params.id,
      user: req.user?._id || req.session.userId,
    });

    if (!c) return res.status(404).json({ message: "Case not found" });

    res.json({ message: "Case deleted" });
  } catch (err) {
    console.error("DELETE /cases error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
