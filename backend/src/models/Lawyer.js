const mongoose = require('mongoose');

const LawyerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },       // e.g., "A. Patel"
  specialization: { type: String },                  // e.g., "Family Law"
  province: { type: String },                        // e.g., "Ontario"
  licenseNumber: { type: String },                   // e.g., "ON-2023-4521"
  yearsExperience: { type: Number, default: 0 },
  email: { type: String },
  phone: { type: String },

  // Flags we need for the snapshot
  isActive: { type: Boolean, default: true },
  acceptingCases: { type: Boolean, default: false },

  // Optional: status fields
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Lawyer', LawyerSchema);
