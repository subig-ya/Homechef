const mongoose = require('mongoose');

// Payment Schema Definition
// Tracks Khalti online transaction details and payment verification statuses
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    transactionId: {
      type: String,
      default: ''
    },
    pidx: {
      type: String,
      default: '' // Khalti Payment Process ID
    },
    gateway: {
      type: String,
      default: 'Khalti'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    paymentResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
