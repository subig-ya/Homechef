const mongoose = require('mongoose');

// User Schema Definition
// Represents every registered person in the HomeChef platform (Customer, Chef, or Admin)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    // Public chef profile: what customers see on the chef directory/profile.
    tagline: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    specialties: [
      {
        type: String,
        trim: true
      }
    ],
    cuisines: [
      {
        type: String,
        trim: true
      }
    ],
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    },
    coverImage: {
      type: String,
      default: ''
    },
    // Portfolio of the chef's work — photos of dishes/events they cooked for.
    portfolio: [
      {
        image: { type: String, required: true },
        title: { type: String, default: '' },
        caption: { type: String, default: '' }
      }
    ],
    location: {
      address: {
        type: String,
        default: ''
      },
      latitude: {
        type: Number,
        default: 0
      },
      longitude: {
        type: Number,
        default: 0
      }
    },
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    role: {
      type: String,
      enum: ['USER', 'HOMECHEF', 'ADMIN'],
      default: 'USER'
    },
    // Tracks where the user's HomeChef application currently stands.
    // Independent of `role`: a USER can have a PENDING application, and only
    // an approved applicant becomes a HOMECHEF.
    homeChefApplicationStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE'
    },
    // Moderation: admins can suspend a chef after verified reports. Banned
    // users cannot log in or use any protected API route (see middleware).
    isBanned: {
      type: Boolean,
      default: false
    },
    banCount: {
      type: Number,
      default: 0
    },
    bannedAt: {
      type: Date,
      default: null
    },
    banReason: {
      type: String,
      default: ''
    },
    // Password reset: only the SHA-256 hash of the token is stored, and it
    // expires after 1 hour, so a leaked database can never be used to reset
    // another user's password.
    resetPasswordToken: {
      type: String,
      default: ''
    },
    resetPasswordExpire: {
      type: Date,
      default: null
    },
    // Chef reliability counters — fed by the order lifecycle and used as a
    // secondary signal in chef ranking (a chef who ignores requests or cancels
    // often ranks lower even with a perfect star rating).
    totalRequestsReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    expiredRequests: {
      type: Number,
      default: 0,
      min: 0
    },
    chefCancellations: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('User', userSchema);
