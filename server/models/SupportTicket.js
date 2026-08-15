const mongoose = require('mongoose');

// Support ticket filed by a chef. The ticket lands in the admin's support
// queue so a chef can report issues or complain about anything on the
// platform instead of emailing support.
const supportTicketSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['ACCOUNT', 'PAYMENTS', 'ORDERS', 'BOOKINGS', 'TECHNICAL', 'OTHER'],
      default: 'OTHER'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
