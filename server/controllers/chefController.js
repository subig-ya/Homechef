const User = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');
const { calculateHaversineDistance, isWithinBoundingBox } = require('./dishController');

// Everything a customer needs to see on a chef profile. Password is never
// selected anywhere — this projection simply avoids extra document weight.
const CHEF_PROFILE_FIELDS =
  'name profileImage coverImage location latitude longitude tagline bio specialties yearsOfExperience portfolio phone';

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
 * entry carries real aggregate ratings, portfolio count, and the nearest
 * Haversine distance to the requesting user.
 */
const getChefs = async (req, res, next) => {
  try {
    const userLat = req.query.userLat ? Number(req.query.userLat) : 40.7128;
    const userLon = req.query.userLon ? Number(req.query.userLon) : -74.006;

    // Find users who own at least one listing.
    const sellers = await Dish.find().distinct('sellerId');
    const chefDocs = await User.find({ _id: { $in: sellers } }).select(CHEF_PROFILE_FIELDS);

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

        let distance = null;
        if (isWithinBoundingBox(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon)) {
          distance = calculateHaversineDistance(userLat, userLon, Number(c.latitude) || userLat, Number(c.longitude) || userLon);
        }

        return {
          ...c,
          listingCount: listingCounts[id] || 0,
          averageRating: rating.averageRating,
          reviewCount: rating.reviewCount,
          portfolioCount: (c.portfolio || []).length,
          distance
        };
      })
      .sort(
        (a, b) =>
          b.averageRating - a.averageRating ||
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
    const chef = await User.findById(req.params.id).select(CHEF_PROFILE_FIELDS);
    if (!chef) {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
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
    const { tagline, bio, specialties, yearsOfExperience, coverImage, profileImage, location } = req.body;

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

module.exports = {
  getChefs,
  getChefById,
  updateMyProfile,
  addPortfolioItem,
  removePortfolioItem,
  buildRatingMap
};
