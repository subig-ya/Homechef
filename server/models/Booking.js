const mongoose = require('mongoose');

// Booking Schema Definition
// Manages customer requests to book a chef for home services
const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    date: {
      type: String,
      required: true
    },
    slotType: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING'],
      required: true
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: 1
    },
    cuisinePreference: {
      type: String,
      default: ''
    },
    specialRequirements: {
      type: String,
      default: ''
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING'
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'UNPAID'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
