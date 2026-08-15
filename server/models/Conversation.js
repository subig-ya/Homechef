const mongoose = require('mongoose');

// A 1:1 conversation between two users (e.g. a customer and a chef). Kept
// generic so any two registered accounts can chat.
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // Deterministic key from the two sorted participant ids (e.g.
    // "aaa_bbb"). Guarantees a 1:1 conversation is never created twice, even
    // when two requests race (e.g. React StrictMode double-mount).
    participantKey: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
