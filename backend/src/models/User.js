const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    // survivor | lawyer | admin | donor
    role: {
      type: String,
      enum: ['survivor', 'lawyer', 'admin', 'donor'],
      required: true
    },

    // ===== Lawyer / admin specific fields =====
    expertise: [String],
    licenseNumber: String,

    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: function () {
        // admins + lawyers need approval; survivors/donors auto-approved
        return (this.role === 'admin' || this.role === 'lawyer')
          ? 'pending'
          : 'approved';
      }
    },

    // ===== Shared profile fields (survivor / lawyer / admin / donor) =====
    preferredName: { type: String },
    legalName: { type: String },

    contactMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'in-app'],
      default: 'email'
    },

    phone: { type: String },

    safeToContact: {
      type: Boolean,
      default: true
    },

    province: { type: String },
    city: { type: String },

    language: {
      type: String,
      default: 'English'
    },

    contactTimes: { type: String },     // e.g. "Mornings", "Evenings"
    accessNeeds: { type: String },      // accessibility / support needs
    notes: { type: String },            // notes for staff

    // if you later add uploads, store URL/path here
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

// ===== Password helpers =====
userSchema.methods.setPassword = async function (pwd) {
  this.passwordHash = await bcrypt.hash(pwd, 12);
};

userSchema.methods.validatePassword = function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
