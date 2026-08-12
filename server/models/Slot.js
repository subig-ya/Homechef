const mongoose = require('mongoose');

// Slot Schema Definition
// Manages chef availability slots for specific dates and predefined periods (Morning, Afternoon, Evening)
const slotSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String, // Stored as ISO date string format YYYY-MM-DD
      required: [true, 'Slot date is required']
    },
    slotType: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING'],
      required: [true, 'Slot type is required']
    },
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'UNAVAILABLE'],
      default: 'AVAILABLE'
    },
    maxBookings: {
      type: Number,
      default: 1,
      min: 1
    },
    currentBookings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate slots for the same seller, date, and slot type
slotSchema.index({ sellerId: 1, date: 1, slotType: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
