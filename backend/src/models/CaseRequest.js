// backend/src/models/CaseRequest.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  mimeType: String,
  path: String,
}, { _id: false });

const CaseRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Contact
  preferredName: { type: String, required: true, trim: true },
  contactMethod: { type: String, enum: ['email', 'phone', 'sms', 'in-app'], required: true },
  contactValue: { type: String, default: '' },
  safeToContact: { type: Boolean, default: true },

  // Location
  province: { type: String, required: true },
  city: { type: String, default: '' },
  language: { type: String, default: 'English' },

  // Issue
  issueCategory: { type: String, required: true },
  desiredOutcome: { type: String, default: '' },
  situation: { type: String, required: true, maxlength: 4000 },

  // Urgency/Safety
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  safetyConcern: { type: Boolean, default: false },

  // Preferences
  contactTimes: { type: String, default: '' },
  accessNeeds: { type: String, default: '' },
  confidentialNotes: { type: String, default: '' },

  // Files
  attachments: [fileSchema],

  // Lawyer Assignment
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', default: null },
  assignedLawyerName: { type: String, default: "" },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  internalNotes: { type: String, default: "" },

  // System
  status: { type: String, enum: ['Submitted', 'Review', 'Assigned', 'Closed'], default: 'Submitted', index: true },
  caseId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('CaseRequest', CaseRequestSchema);
