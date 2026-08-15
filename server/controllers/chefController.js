const User = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');
const { calculateHaversineDistance, isWithinBoundingBox, calculateBayesianRating } = require('./dishController');

// Everything a customer needs to see on a chef profile. Password is never
// selected anywhere — this projection simply avoids extra document weight.
// The reliability counters are read-only ranking inputs.
const CHEF_PROFILE_FIELDS =
  'name profileImage coverImage location latitude longitude tagline bio specialties cuisines yearsOfExperience portfolio phone totalRequestsReceived expiredRequests chefCancellations';

// Aggregate real reviews into an { averageRating, reviewCount } map per chef.
// Ratings come from the Review collection, never from seeded dish defaults.
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
 * GET /api/chefs — public chef directory.
 * A chef is any registered user who has created at least one listing. Each
 * entry carries real aggregate ratings, a Bayesian-smoothed rating, portfolio
 * count, and the nearest Haversine distance to the requesting user. Results
 * are ranked by Bayesian rating (highest first) so a handful of 5-star reviews
 * cannot out-rank chefs with many reliable ratings.
 */
const getChefs = async (req, res, next) => {
  try {
    const userLat = req.query.userLat ? Number(req.query.userLat) : 40.7128;
    const userLon = req.query.userLon ? Number(req.query.userLon) : -74.006;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const sort = req.query.sort || 'top'; // 'top' (default) | 'nearby'

    // Find users who own at least one listing.
    const sellers = await Dish.find().distinct('sellerId');

    let query = { _id: { $in: sellers } };
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { tagline: regex },
        { bio: regex },
        { 'location.address': regex },
        { specialties: regex },
        { cuisines: regex }
      ];
    }

    const chefDocs = await User.find(query).select(CHEF_PROFILE_FIELDS);

    const chefIds = chefDocs.map((chef) => chef._id);

    const [dishes, ratingMap] = await Promise.all([
      Dish.find({ sellerId: { $in: chefIds } }).select('sellerId'),
      buildRatingMap(chefIds)
    ]);

    const listingCounts = {};
    dishes.forEach((dish) => {
      listingCounts[dish.sellerId.toString()] = (listingCounts[dish.sellerId.toString()] || 0) + 1;
    });

    const data = chefDocs
      .map((chef) => {
        const c = chef.toObject();
        const id = c._id.toString();
        const rating = ratingMap[id] || { averageRating: 0, reviewCount: 0 };

        // Keep location as a plain display string so customers' React views
        // never receive the internal { address, latitude, longitude } object.
        if (c.location && typeof c.location === 'object') {
          c.location = c.location.address || '';
        }

        let distance = null;
        if (isWithinBoundingBox(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon)) {
          distance = calculateHaversineDistance(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon);
        }

        // Bayesian-smoothed rating (Algorithm 7.3): pulls chefs with a handful
        // of 5-star reviews back toward the global mean so the directory ranks
        // the most *reliably* rated chefs first — highest at the top.
        const bayesianRating =
          rating.reviewCount > 0
            ? Number(calculateBayesianRating(rating.averageRating, rating.reviewCount).toFixed(2))
            : 0;

        // Reliability as a secondary signal: a chef who ignores requests or
        // cancels on customers ranks lower even with a perfect star rating.
        // No-response weighs more than chef-cancellations.
        const totalRequests = Number(c.totalRequestsReceived) || 0;
        const noResponseRate = totalRequests ? Number((Number(c.expiredRequests) || 0) / totalRequests) : 0;
        const chefCancellationRate = totalRequests ? Number((Number(c.chefCancellations) || 0) / totalRequests) : 0;
        const reliability = Math.max(0, 1 - (noResponseRate * 0.7 + chefCancellationRate * 0.3));
        // Subtracts up to 1.0 rating point; noResponseRate alone halves it.
        const reliabilityPenalty = Number(((1 - reliability) * 1.0).toFixed(2));

        return {
          ...c,
          listingCount: listingCounts[id] || 0,
          averageRating: rating.averageRating,
          reviewCount: rating.reviewCount,
          bayesianRating,
          reliability: Number(reliability.toFixed(2)),
          noResponseRate: Number(noResponseRate.toFixed(2)),
          chefCancellationRate: Number(chefCancellationRate.toFixed(2)),
          portfolioCount: (c.portfolio || []).length,
          distance
        };
      })
      // Sort order: "nearby" ranks by Haversine distance (unknown distance
      // last); the default "top" ranks by reliability-adjusted Bayesian rating
      // desc → review count desc → listing count desc.
      .sort(
        sort === 'nearby'
          ? (a, b) => {
              if (a.distance === null && b.distance === null) return b.bayesianRating - a.bayesianRating;
              if (a.distance === null) return 1;
              if (b.distance === null) return -1;
              return a.distance - b.distance;
            }
          : (a, b) =>
              b.bayesianRating - b.reliabilityPenalty - (a.bayesianRating - a.reliabilityPenalty) ||
              b.reviewCount - a.reviewCount ||
              b.listingCount - a.listingCount
      );

    res.status(200).json({ success: true, count: data.length, message: 'Chefs fetched successfully', data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chefs/:id — full public chef profile.
 * Returns the chef, their menu, portfolio and reviews, plus a 1–5 rating
 * breakdown computed from real reviews.
 */
const getChefById = async (req, res, next) => {
  try {
    const chefDoc = await User.findById(req.params.id).select(CHEF_PROFILE_FIELDS);
    if (!chefDoc) {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    // The stored location is an object { address, latitude, longitude }, but
    // public profiles only need a display string.
    const chef = chefDoc.toObject();
    if (chef.location && typeof chef.location === 'object') {
      chef.location = chef.location.address || '';
    }

    const [dishes, reviews] = await Promise.all([
      Dish.find({ sellerId: chef._id }).populate('categoryId', 'name').sort({ createdAt: -1 }),
      Review.find({ sellerId: chef._id })
        .populate('customerId', 'name profileImage')
        .sort({ createdAt: -1 })
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) breakdown[review.rating] += 1;
      sum += review.rating;
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount ? Number((sum / reviewCount).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      message: 'Chef profile fetched successfully',
      data: {
        chef,
        listingCount: dishes.length,
        averageRating,
        reviewCount,
        ratingBreakdown: breakdown,
        dishes,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/chefs/me/profile — HomeChef edits their own public profile.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, tagline, bio, specialties, cuisines, yearsOfExperience, coverImage, profileImage, location } = req.body;

    if (name !== undefined && String(name).trim()) req.user.name = String(name).trim();
    if (tagline !== undefined) req.user.tagline = String(tagline);
    if (bio !== undefined) req.user.bio = String(bio);
    if (coverImage !== undefined) req.user.coverImage = String(coverImage);
    if (profileImage !== undefined) req.user.profileImage = String(profileImage);
    if (yearsOfExperience !== undefined) req.user.yearsOfExperience = Math.max(0, Number(yearsOfExperience) || 0);
    if (specialties !== undefined) {
      req.user.specialties = Array.isArray(specialties)
        ? specialties.map((s) => String(s).trim()).filter(Boolean)
        : typeof specialties === 'string'
          ? specialties.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
    }
    if (cuisines !== undefined) {
      req.user.cuisines = Array.isArray(cuisines)
        ? cuisines.map((s) => String(s).trim()).filter(Boolean)
        : typeof cuisines === 'string'
          ? cuisines.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
    }
    if (location !== undefined) {
      const nextLocation = typeof location === 'string'
        ? { address: location, latitude: req.user.location?.latitude ?? req.user.latitude ?? 0, longitude: req.user.location?.longitude ?? req.user.longitude ?? 0 }
        : {
            address: location?.address || '',
            latitude: Number(location?.latitude ?? req.user.location?.latitude ?? req.user.latitude ?? 0),
            longitude: Number(location?.longitude ?? req.user.location?.longitude ?? req.user.longitude ?? 0)
          };

      req.user.location = nextLocation;
      req.user.latitude = Number(nextLocation.latitude || 0);
      req.user.longitude = Number(nextLocation.longitude || 0);
    }

    await req.user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chefs/me/portfolio — add a photo of the chef's work.
 */
const addPortfolioItem = async (req, res, next) => {
  try {
    const { image, title, caption } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'An image is required.' });
    }

    req.user.portfolio.push({
      image: String(image),
      title: String(title || ''),
      caption: String(caption || '')
    });
    await req.user.save();

    res.status(201).json({ success: true, message: 'Portfolio item added successfully', data: req.user.portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chefs/me/portfolio/:itemId — remove a portfolio photo.
 */
const removePortfolioItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = req.user.portfolio.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found.' });
    }

    req.user.portfolio.pull(itemId);
    await req.user.save();

    res.status(200).json({ success: true, message: 'Portfolio item removed successfully', data: req.user.portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chefs/me/reviews — the logged-in HomeChef's own reviews.
 * Returns the review list plus a 1–5 breakdown and a Bayesian-smoothed
 * rating so a handful of 5-star reviews cannot inflate the ranking.
 */
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ sellerId: req.user._id })
      .populate('customerId', 'name profileImage')
      .populate('dishId', 'name image')
      .sort({ createdAt: -1 });

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) breakdown[review.rating] += 1;
      sum += review.rating;
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount ? Number((sum / reviewCount).toFixed(1)) : 0;
    const bayesianRating = reviewCount
      ? Number(calculateBayesianRating(averageRating, reviewCount).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews,
        ratingBreakdown: breakdown,
        averageRating,
        bayesianRating,
        reviewCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChefs,
  getChefById,
  updateMyProfile,
  addPortfolioItem,
  removePortfolioItem,
  getMyReviews,
  buildRatingMap
};
