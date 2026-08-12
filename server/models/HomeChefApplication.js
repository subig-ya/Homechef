const mongoose = require('mongoose');

// HomeChefApplication Schema Definition
// Represents a single HomeChef application submitted by a registered User.
// It is NOT a separate account — it is always tied to the applicant's User
// document via the `user` reference. A user may have at most one active
// application; a rejected application is reset and reused if they re-apply.
const homeChefApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Address/location is required'],
      trim: true
    },
    about: {
      type: String,
      default: ''
    },
    specialties: [
      {
        type: String,
        trim: true
      }
    ],
    // Chef background information collected with the application.
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    kitchenType: {
      type: String,
      enum: ['', 'HOME_KITCHEN', 'RENTED_KITCHEN', 'COMMUNITY_KITCHEN', 'COMMERCIAL_KITCHEN', 'OTHER'],
      default: ''
    },
    serviceArea: {
      type: String,
      default: ''
    },
    // Draft menu items the applicant wants to cook. These are NOT live
    // listings yet — they are reviewed with the application and give the
    // admin a detailed look at the menu before approving.
    menuItems: [
      {
        name: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        price: { type: Number, default: 0 },
        cuisine: { type: String, trim: true, default: '' },
        dietary: [{ type: String, trim: true }],
        image: { type: String, default: '' }
      }
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    // Admin review information
    adminNote: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('HomeChefApplication', homeChefApplicationSchema);
