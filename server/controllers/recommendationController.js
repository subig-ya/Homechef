const Dish = require('../models/Dish');
const { calculateHaversineDistance, calculateBayesianRating, isWithinBoundingBox } = require('./dishController');

/**
 * ALGORITHM 7.2: WEIGHTED RANKING SCORE — TOP HOMECHEFS
 * ---------------------------------------------------------
 * HomeChef does NOT use TF-IDF, cosine similarity, collaborative filtering,
 * or any other recommendation model. It ranks sellers with the same
 * explainable fixed-weight formula:
 *   score = (w1 × normalized_rating) + (w2 × (1 / (distance + 1))) − (w3 × normalized_price)
 *   w1 = 0.5, w2 = 0.3, w3 = 0.2
 */
const getRecommendedSellers = async (req, res, next) => {
  try {
    const userLat = req.query.userLat ? Number(req.query.userLat) : 40.7128;
    const userLon = req.query.userLon ? Number(req.query.userLon) : -74.006;

    const dishes = await Dish.find().populate('sellerId', 'name location latitude longitude profileImage');

    const sellerMap = new Map();

    dishes.forEach((dish) => {
      const seller = dish.sellerId;
      if (!seller) return;

      const key = seller._id.toString();
      if (!sellerMap.has(key)) {
        sellerMap.set(key, {
          seller,
          listingCount: 0,
          ratingSum: 0,
          reviewCount: 0,
          priceSum: 0,
          distances: []
        });
      }

      const entry = sellerMap.get(key);
      entry.listingCount += 1;
      entry.ratingSum += dish.rating || 0;
      entry.reviewCount += dish.reviewCount || 0;
      entry.priceSum += dish.price || 0;

      if (isWithinBoundingBox(userLat, userLon, Number(seller.latitude) || userLat, Number(seller.longitude) || userLon)) {
        entry.distances.push(
          calculateHaversineDistance(userLat, userLon, Number(seller.latitude) || userLat, Number(seller.longitude) || userLon)
        );
      }
    });

    const sellers = Array.from(sellerMap.values());

    // Price normalization is relative to the current set of sellers.
    const avgPrices = sellers.map((entry) => entry.priceSum / entry.listingCount);
    const minPrice = avgPrices.length ? Math.min(...avgPrices) : 0;
    const maxPrice = avgPrices.length ? Math.max(...avgPrices) : 1;
    const priceSpan = maxPrice - minPrice;

    const recommended = sellers
      .map((entry) => {
        const { seller, listingCount } = entry;
        const avgRating = entry.ratingSum / listingCount;
        const avgPrice = entry.priceSum / listingCount;
        const distance = entry.distances.length > 0 ? Math.min(...entry.distances) : 0;

        // Bayesian average rating normalized to 0–1.
        const bayesianScore = calculateBayesianRating(avgRating || 4.5, entry.reviewCount || 0);
        const normalizedRating = bayesianScore / 5.0;

        const proximityFactor = 1 / (distance + 1);
        const normalizedPrice = priceSpan > 0 ? Math.max(0, Math.min(1, (avgPrice - minPrice) / priceSpan)) : 0;

        const w1 = 0.5;
        const w2 = 0.3;
        const w3 = 0.2;
        const score = w1 * normalizedRating + w2 * proximityFactor - w3 * normalizedPrice;

        return {
          seller,
          listingCount,
          averageRating: Number(avgRating.toFixed(1)),
          reviewCount: entry.reviewCount,
          distance,
          score: Number(score.toFixed(4))
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.status(200).json({ success: true, message: 'Recommendations fetched successfully', data: recommended });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendedSellers };
