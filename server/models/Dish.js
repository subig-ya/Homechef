const mongoose = require('mongoose');

// FoodListing Schema Definition
// Represents homemade food listings created by any registered User.
// A user becomes a seller simply by creating a listing — there is no
// separate buyer/seller account or "become a chef" flow.
const dishSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    cuisine: {
      type: String,
      required: [true, 'Cuisine is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    // Listing location — copied once from the seller's stored coordinates.
    location: {
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
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'UNAVAILABLE'],
      default: 'AVAILABLE'
    },
    dietary: [
      {
        type: String,
        enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Nut-Free', 'Dairy-Free']
      }
    ],
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 50,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Dish', dishSchema);
