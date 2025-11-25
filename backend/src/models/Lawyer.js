// backend/src/models/Lawyer.js
const mongoose = require("mongoose");

const LawyerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },        // e.g., "A. Patel"
    specialization: { type: String, required: true },  // e.g., "Family & Protection Law"
    province: { type: String, required: true },        // e.g., "Ontario"

    licenseProvince: { type: String, required: true }, // e.g., "ON"
    licenseNumber: { type: String, required: true },   // full like: "ON-2023-4521"

    yearsExperience: { type: Number, default: 0 },

    email: { type: String, required: true },
    phone: { type: String, default: "" },

    // Availability
    availability: {
      type: String,
      enum: ["Available", "Busy", "Unavailable"],
      default: "Unavailable",
    },

    // Admin status
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },

    // Whether taking new cases
    acceptingCases: { type: Boolean, default: false },

    // Link to user account
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lawyer", LawyerSchema);
