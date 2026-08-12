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
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'],
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

module.exports = mongoose.model('Order', orderSchema);
