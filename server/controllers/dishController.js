const Dish = require('../models/Dish');
const Category = require('../models/Category');

/**
 * ALGORITHM 7.1: HAVERSINE DISTANCE ALGORITHM
 * ---------------------------------------------------------
 * Purpose: Calculates the real-world distance between the customer and a
 *          seller/listing using the Haversine formula.
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlong/2)
 *   distance = 2 × R × asin(√a)
 *   where R = 6371 km
 *
 * Before the exact calculation, a cheap bounding-box pre-filter of ±0.5°
 * latitude/longitude removes obviously distant listings.
 */
const BOUNDING_BOX_DEGREES = 0.5;
const EARTH_RADIUS_KM = 6371;

// Cheap pre-filter: returns true when the coordinates are inside the
// ±0.5° bounding box around the user's location.
const isWithinBoundingBox = (lat1, lon1, lat2, lon2) => {
  const latDiff = Math.abs(lat1 - lat2);
  const lonDiff = Math.abs(lon1 - lon2);
  return latDiff <= BOUNDING_BOX_DEGREES && lonDiff <= BOUNDING_BOX_DEGREES;
};

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  // Line: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlong/2)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  // Line: distance = 2 × R × asin(√a)
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));

  return Number(distance.toFixed(1));
};

/**
 * ALGORITHM 7.3: BAYESIAN AVERAGE RATING ALGORITHM
 * ---------------------------------------------------------
 * Purpose: Smoothes the average rating so listings with very few ratings do
 *          not unfairly rank above listings with many reliable ratings.
 * Formula: Bayesian Average = ((C × m) + sum_ratings) / (C + n)
 *   m = global mean (4.5), C = prior weight (5), n = review count.
 */
const calculateBayesianRating = (avgRating, reviewCount, globalMean = 4.5, priorWeight = 5) => {
  const sumRatings = avgRating * reviewCount;
  return (priorWeight * globalMean + sumRatings) / (priorWeight + reviewCount);
};

// Normalize a rating into the 0–1 range used by the ranking score.
const normalizeRating = (bayesianScore) => bayesianScore / 5.0;

/**
 * ALGORITHM 7.2: WEIGHTED RANKING SCORE ALGORITHM
 * ---------------------------------------------------------
 * Purpose: Ranks listings multi-dimensionally:
 *   score = (w1 × normalized_rating) + (w2 × (1 / (distance + 1))) − (w3 × normalized_price)
 * Weights are FIXED and explainable:
 *   w1 = 0.5 (50% rating), w2 = 0.3 (30% proximity), w3 = 0.2 (20% price)
 *
 * normalized_price is scaled 0–1 relative to the prices in the current result set.
 * The "+1" in the distance term prevents division by zero for a listing at the
 * customer's exact location.
 */
const calculateWeightedScore = (listing, userLat, userLon, minPrice, maxPrice) => {
  const w1 = 0.5; // Rating weight (50%)
  const w2 = 0.3; // Proximity weight (30%)
  const w3 = 0.2; // Price weight (20%)

  // Line: Bayesian-normalized rating scaled to 0–1
  const bayesianScore = calculateBayesianRating(listing.rating || 4.8, listing.reviewCount || 0);
  const normalizedRating = normalizeRating(bayesianScore);

  // Line: exact Haversine distance in km
  const sellerLat = Number(listing.latitude) || userLat;
  const sellerLon = Number(listing.longitude) || userLon;
  const distance = calculateHaversineDistance(userLat, userLon, sellerLat, sellerLon);

  // Line: proximity factor = 1 / (distance + 1) — avoids division by zero
  const proximityFactor = 1 / (distance + 1);

  // Line: price normalized against the current result set's price range
  const priceSpan = maxPrice - minPrice;
  const normalizedPrice = priceSpan > 0 ? Math.max(0, Math.min(1, (listing.price - minPrice) / priceSpan)) : 0;

  // Line: composite score = (w1 × rating) + (w2 × proximity) − (w3 × price)
  const score = w1 * normalizedRating + w2 * proximityFactor - w3 * normalizedPrice;

  return { score, distance };
};

const createDish = async (req, res, next) => {
  try {
    const { categoryId, name, description, image, cuisine, price, availableQuantity, availabilityStatus, dietary, rating } = req.body;

    if (!categoryId || !name || !cuisine || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category, name, cuisine, and price are required.'
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    // A user becomes a seller simply by creating a listing — no application,
    // no separate seller account. The listing inherits the seller's stored
    // location coordinates so they are never re-geocoded per search.
    const dish = await Dish.create({
      sellerId: req.user._id,
      categoryId,
      name,
      description: description || '',
      image: image || '',
      cuisine,
      price,
      location: req.user.location || '',
      latitude: req.user.latitude || 0,
      longitude: req.user.longitude || 0,
      availableQuantity: availableQuantity || 10,
      availabilityStatus: availabilityStatus || 'AVAILABLE',
      dietary: dietary || [],
      rating: rating || 4.8
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

const getAllDishes = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, dietary, sort, userLat, userLon } = req.query;

    // Multi-criteria MongoDB query construction
    let query = {};

    if (category) {
      const catDoc = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
      if (catDoc) {
        query.categoryId = catDoc._id;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (dietary) {
      const dietaryArray = dietary.split(',').map((d) => d.trim());
      query.dietary = { $in: dietaryArray };
    }

    const dishes = await Dish.find(query)
      .populate('sellerId', 'name location latitude longitude profileImage')
      .populate('categoryId', 'name');

    const parsedLat = userLat ? Number(userLat) : 40.7128;
    const parsedLon = userLon ? Number(userLon) : -74.006;

    // STEP 1 (Section 7.1): Bounding-box pre-filter — drop obviously distant
    // listings BEFORE any exact Haversine calculation.
    const inBox = dishes.filter((dish) =>
      isWithinBoundingBox(parsedLat, parsedLon, Number(dish.latitude) || parsedLat, Number(dish.longitude) || parsedLon)
    );

    // STEP 2: Price normalization range is derived from the CURRENT result set.
    let resultMinPrice = Infinity;
    let resultMaxPrice = -Infinity;
    inBox.forEach((dish) => {
      if (dish.price < resultMinPrice) resultMinPrice = dish.price;
      if (dish.price > resultMaxPrice) resultMaxPrice = dish.price;
    });
    if (resultMinPrice === Infinity) {
      resultMinPrice = Number(minPrice) || 0;
      resultMaxPrice = Number(maxPrice) || 1;
    }

    // STEP 3-5: Exact Haversine distance, Bayesian rating, normalized values,
    // then the fixed-weight ranking score.
    const dishesWithScore = inBox.map((dishDoc) => {
      const dishObj = dishDoc.toObject();
      const { score, distance } = calculateWeightedScore(dishObj, parsedLat, parsedLon, resultMinPrice, resultMaxPrice);
      dishObj.calculatedScore = Number(score.toFixed(4));
      dishObj.calculatedDistance = distance;
      return dishObj;
    });

    // STEP 6: Sort highest score first (default "recommended").
    if (sort === 'popular') {
      dishesWithScore.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sort === 'price') {
      dishesWithScore.sort((a, b) => a.price - b.price);
    } else if (sort === 'rating') {
      dishesWithScore.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      dishesWithScore.sort((a, b) => b.calculatedScore - a.calculatedScore);
    }

    res.status(200).json({
      success: true,
      count: dishesWithScore.length,
      message: 'Listings fetched successfully',
      data: dishesWithScore
    });
  } catch (error) {
    next(error);
  }
};

const getDishById = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id)
      .populate('sellerId', 'name location latitude longitude profileImage phone')
      .populate('categoryId', 'name');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Listing fetched successfully',
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

// A logged-in seller's own listings (for "My Listings" on the profile page).
const getMyDishes = async (req, res, next) => {
  try {
    const dishes = await Dish.find({ sellerId: req.user._id })
      .populate('sellerId', 'name location latitude longitude profileImage')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: dishes.length,
      message: 'My listings fetched successfully',
      data: dishes
    });
  } catch (error) {
    next(error);
  }
};

const updateDish = async (req, res, next) => {
  try {
    const dish = await Dish.findOne({ _id: req.params.id, sellerId: req.user._id });

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or you do not own it.'
      });
    }

    const allowedFields = ['name', 'description', 'image', 'cuisine', 'price', 'availableQuantity', 'availabilityStatus', 'categoryId', 'dietary', 'rating'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        dish[field] = req.body[field];
      }
    });

    await dish.save();

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

const deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findOne({ _id: req.params.id, sellerId: req.user._id });

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or you do not own it.'
      });
    }

    await dish.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDish,
  getAllDishes,
  getDishById,
  getMyDishes,
  updateDish,
  deleteDish,
  calculateHaversineDistance,
  calculateBayesianRating,
  calculateWeightedScore,
  isWithinBoundingBox
};
