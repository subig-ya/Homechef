const mongoose = require('mongoose');

// Favorite Schema Definition
// A customer can save a chef (for later booking) or a dish (for later
// ordering). The compound unique index guarantees one favorite per
// user + target, and makes "toggle" a safe single document operation.
const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['CHEF', 'DISH'],
      required: true
    },
    // Either a User (CHEF) or a Dish (DISH).
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  {
    timestamps: true
  }
);

favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
