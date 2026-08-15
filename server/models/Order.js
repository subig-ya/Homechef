const mongoose = require('mongoose');

// Order Schema Definition
// Manages marketplace orders for prepared homemade food placed by a customer
// against a seller (another User). A seller is just any user with listings.
const orderItemSchema = new mongoose.Schema({
  dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema(
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
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // When the customer wants the meal delivered/picked up.
    requestedTime: {
      type: Date,
      default: null
    },
    // DELIVERY or PICKUP — set once at request time and never changed later.
    deliveryType: {
      type: String,
      enum: ['DELIVERY', 'PICKUP'],
      default: 'PICKUP'
    },
    // PENDING requests must be answered by the chef before this deadline.
    // The server sweeper marks overdue requests EXPIRED and notifies the
    // customer, so a request can never hang in limbo forever.
    expiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'PAYMENT_PENDING', 'PAID', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING'
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'UNPAID'
    },
    // Asymmetric cancellation bookkeeping. refundType:
    //   FULL    — nothing was produced yet, nothing lost (customer-early, chef-cancel)
    //   PARTIAL — customer cancelled after the chef started prepping
    //   NONE    — free cancellation window passed or not applicable
    cancellation: {
      reason: { type: String, default: '' },
      cancelledBy: { type: String, enum: ['CUSTOMER', 'CHEF', 'SYSTEM'], default: null },
      refundType: { type: String, enum: ['FULL', 'PARTIAL', 'NONE'], default: null },
      refundAmount: { type: Number, default: 0 },
      cancelledAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
