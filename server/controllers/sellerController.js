const User = require('../models/User');
const Dish = require('../models/Dish');
const { calculateHaversineDistance, calculateBayesianRating, isWithinBoundingBox } = require('./dishController');

/**
 * ALGORITHM 7.1 (HAVERSINE) + 7.3 (BAYESIAN) — HOMECHEF DIRECTORY
 * ---------------------------------------------------------
 * A "HomeChef"/seller is simply any registered User who has created at least
 * one food listing. There is no separate seller account or application.
 *
 * Algorithms used here:
 *  1. Bounding-box pre-filter (Algorithm 7.1b): cheap ±0.5° lat/lon window
 *     that drops obviously distant listings BEFORE the exact distance call.
 *  2. Haversine distance (Algorithm 7.1): exact great-circle distance in km
 *     between the customer and each seller; the nearest distance is returned.
 *  3. Bayesian average rating (Algorithm 7.3): the seller's overall rating is
 *     read directly from the stored listing rating/reviewCount aggregate.
 */
const getAllSellers = async (req, res, next) => {
  try {
    const { userLat, userLon } = req.query;
    const parsedLat = userLat ? Number(userLat) : 40.7128;
    const parsedLon = userLon ? Number(userLon) : -74.006;

    const dishes = await Dish.find().populate('sellerId', 'name email phone location latitude longitude profileImage');

    const sellerMap = new Map();

    dishes.forEach((dish) => {
      const seller = dish.sellerId;
      if (!seller) return;

      if (!sellerMap.has(seller._id.toString())) {
        sellerMap.set(seller._id.toString(), {
          seller,
          listingCount: 0,
          ratingSum: 0,
          reviewCount: 0,
          distances: []
        });
      }

      const entry = sellerMap.get(seller._id.toString());
      entry.listingCount += 1;
      entry.ratingSum += dish.rating || 0;
      entry.reviewCount += dish.reviewCount || 0;

      // Bounding-box pre-filter before the exact Haversine calculation.
      if (isWithinBoundingBox(parsedLat, parsedLon, Number(seller.latitude) || parsedLat, Number(seller.longitude) || parsedLon)) {
        const distance = calculateHaversineDistance(parsedLat, parsedLon, Number(seller.latitude) || parsedLat, Number(seller.longitude) || parsedLon);
        entry.distances.push(distance);
      }
    });

    const sellers = Array.from(sellerMap.values()).map((entry) => {
      const seller = entry.seller;
      const averageRating = entry.listingCount > 0 ? entry.ratingSum / entry.listingCount : 0;
      const distance = entry.distances.length > 0 ? Math.min(...entry.distances) : null;

      return {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        location: seller.location,
        latitude: seller.latitude,
        longitude: seller.longitude,
        profileImage: seller.profileImage || '',
        listingCount: entry.listingCount,
        averageRating,
        reviewCount: entry.reviewCount,
        calculatedDistance: distance
      };
    });

    res.status(200).json({
      success: true,
      count: sellers.length,
      message: 'HomeChefs fetched successfully',
      data: sellers
    });
  } catch (error) {
    next(error);
  }
};

const getSellerById = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.id).select('name email phone location latitude longitude profileImage');

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    const dishes = await Dish.find({ sellerId: seller._id })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    const averageRating = dishes.length > 0 ? dishes.reduce((sum, dish) => sum + (dish.rating || 0), 0) / dishes.length : 0;

    res.status(200).json({
      success: true,
      message: 'Seller fetched successfully',
      data: {
        seller,
        listingCount: dishes.length,
        averageRating,
        dishes
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllSellers, getSellerById };
