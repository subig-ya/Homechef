const User = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');
const { calculateHaversineDistance, calculateBayesianRating, isWithinBoundingBox } = require('./dishController');

// Everything a customer needs to preview a chef from search results.
const SEARCH_CHEF_FIELDS =
  'name profileImage coverImage location latitude longitude tagline bio specialties cuisines yearsOfExperience portfolio';

// Aggregate real reviews into an { averageRating, reviewCount } map per chef.
const buildRatingMap = async (sellerIds) => {
  const reviews = await Review.find({ sellerId: { $in: sellerIds } }).select('sellerId rating');

  const map = {};
  reviews.forEach((review) => {
    const key = review.sellerId.toString();
    if (!map[key]) map[key] = { sum: 0, reviewCount: 0, averageRating: 0 };
    map[key].sum += review.rating;
    map[key].reviewCount += 1;
  });

  Object.keys(map).forEach((key) => {
    map[key].averageRating = map[key].reviewCount ? Number((map[key].sum / map[key].reviewCount).toFixed(1)) : 0;
    delete map[key].sum;
  });

  return map;
};

/**
 * GET /api/search?q=...&userLat=...&userLon=...
 * One endpoint powering the dashboard's global search. Returns matching
 * chefs (name/tagline/specialties/cuisines/location) and dishes
 * (name/description/cuisine), each already ranked with the platform's
 * Haversine + Bayesian machinery. Chefs and dishes never mix: the client
 * renders them as two lists.
 */
const searchEverything = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const userLat = req.query.userLat ? Number(req.query.userLat) : 40.7128;
    const userLon = req.query.userLon ? Number(req.query.userLon) : -74.006;

    if (!q) {
      return res.status(400).json({ success: false, message: 'A search term is required.' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [chefDocs, dishes] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { tagline: regex },
          { bio: regex },
          { 'location.address': regex },
          { specialties: regex },
          { cuisines: regex }
        ]
      }).select(SEARCH_CHEF_FIELDS),
      Dish.find({ $or: [{ name: regex }, { description: regex }, { cuisine: regex }] })
        .populate('sellerId', 'name location latitude longitude profileImage')
        .populate('categoryId', 'name')
    ]);

    const chefIds = chefDocs.map((chef) => chef._id);
    const [dishCounts, ratingMap] = await Promise.all([
      chefIds.length ? Dish.find({ sellerId: { $in: chefIds } }).select('sellerId') : Promise.resolve([]),
      chefIds.length ? buildRatingMap(chefIds) : Promise.resolve({})
    ]);

    const listingCounts = {};
    dishCounts.forEach((dish) => {
      listingCounts[dish.sellerId.toString()] = (listingCounts[dish.sellerId.toString()] || 0) + 1;
    });

    const chefs = chefDocs.map((chef) => {
      const c = chef.toObject();
      const id = c._id.toString();
      if (c.location && typeof c.location === 'object') c.location = c.location.address || '';
      const rating = ratingMap[id] || { averageRating: 0, reviewCount: 0 };

      let distance = null;
      if (isWithinBoundingBox(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon)) {
        distance = calculateHaversineDistance(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon);
      }

      return {
        ...c,
        listingCount: listingCounts[id] || 0,
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
        bayesianRating:
          rating.reviewCount > 0 ? Number(calculateBayesianRating(rating.averageRating, rating.reviewCount).toFixed(2)) : 0,
        distance
      };
    }).sort((a, b) => b.bayesianRating - a.bayesianRating || b.reviewCount - a.reviewCount);

    // Dishes: rank with the same weighted score used by the marketplace.
    const inBox = dishes.filter((dish) =>
      isWithinBoundingBox(userLat, userLon, Number(dish.latitude) || userLat, Number(dish.longitude) || userLon)
    );

    let resultMinPrice = Infinity;
    let resultMaxPrice = -Infinity;
    inBox.forEach((dish) => {
      if (dish.price < resultMinPrice) resultMinPrice = dish.price;
      if (dish.price > resultMaxPrice) resultMaxPrice = dish.price;
    });
    if (resultMinPrice === Infinity) {
      resultMinPrice = 0;
      resultMaxPrice = 1;
    }

    const rankedDishes = inBox.map((dishDoc) => {
      const dishObj = dishDoc.toObject();
      const w1 = 0.5;
      const w2 = 0.3;
      const w3 = 0.2;
      const bayesianScore = calculateBayesianRating(dishObj.rating || 4.8, dishObj.reviewCount || 0);
      const normalizedRating = bayesianScore / 5.0;
      const sellerLat = Number(dishObj.latitude) || userLat;
      const sellerLon = Number(dishObj.longitude) || userLon;
      const distance = calculateHaversineDistance(userLat, userLon, sellerLat, sellerLon);
      const proximityFactor = 1 / (distance + 1);
      const priceSpan = resultMaxPrice - resultMinPrice;
      const normalizedPrice = priceSpan > 0 ? Math.max(0, Math.min(1, (dishObj.price - resultMinPrice) / priceSpan)) : 0;
      dishObj.calculatedDistance = distance;
      dishObj.calculatedScore = Number((w1 * normalizedRating + w2 * proximityFactor - w3 * normalizedPrice).toFixed(4));
      return dishObj;
    }).sort((a, b) => b.calculatedScore - a.calculatedScore);

    res.status(200).json({
      success: true,
      message: 'Search completed',
      data: {
        query: q,
        chefs,
        dishes: rankedDishes
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchEverything };
