const Favorite = require('../models/Favorite');
const User = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');

// Public chef profile fields used when a chef appears inside a favorite.
const FAVORITE_CHEF_FIELDS =
  'name profileImage coverImage location latitude longitude tagline bio specialties cuisines yearsOfExperience portfolio';

// Aggregate real reviews into an { averageRating, reviewCount } map per chef.
// Ratings come from the Review collection, never from seeded dish defaults.
const buildChefRatingMap = async (chefIds) => {
  const reviews = await Review.find({ sellerId: { $in: chefIds } }).select('sellerId rating');

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
 * GET /api/favorites — the logged-in user's saved chefs and dishes.
 * Returns a flat list where each entry carries the populated target document.
 * The client can derive chefIds/dishIds sets from it for heart states.
 */
const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).sort({ createdAt: -1 });
    if (favorites.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'Favorites fetched successfully', data: [] });
    }

    const chefIds = favorites.filter((f) => f.targetType === 'CHEF').map((f) => f.targetId);
    const dishIds = favorites.filter((f) => f.targetType === 'DISH').map((f) => f.targetId);

    const [chefDocs, dishDocs, dishCountDocs, ratingMap] = await Promise.all([
      chefIds.length ? User.find({ _id: { $in: chefIds } }).select(FAVORITE_CHEF_FIELDS) : Promise.resolve([]),
      dishIds.length
        ? Dish.find({ _id: { $in: dishIds } })
            .populate('sellerId', 'name location latitude longitude profileImage')
            .populate('categoryId', 'name')
        : Promise.resolve([]),
      chefIds.length ? Dish.find({ sellerId: { $in: chefIds } }).select('sellerId') : Promise.resolve([]),
      chefIds.length ? buildChefRatingMap(chefIds) : Promise.resolve({})
    ]);

    const listingCounts = {};
    dishCountDocs.forEach((dish) => {
      listingCounts[dish.sellerId.toString()] = (listingCounts[dish.sellerId.toString()] || 0) + 1;
    });

    const chefMap = {};
    chefDocs.forEach((chef) => {
      const c = chef.toObject();
      const id = c._id.toString();
      if (c.location && typeof c.location === 'object') c.location = c.location.address || '';
      const rating = ratingMap[id] || { averageRating: 0, reviewCount: 0 };
      chefMap[id] = {
        ...c,
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
        listingCount: listingCounts[id] || 0
      };
    });

    const dishMap = {};
    dishDocs.forEach((dish) => {
      dishMap[dish._id.toString()] = dish.toObject();
    });

    const data = favorites
      .map((favorite) => ({
        _id: favorite._id,
        targetType: favorite.targetType,
        targetId: favorite.targetId,
        createdAt: favorite.createdAt,
        target:
          favorite.targetType === 'CHEF'
            ? chefMap[favorite.targetId.toString()] || null
            : dishMap[favorite.targetId.toString()] || null
      }))
      .filter((f) => f.target);

    res.status(200).json({ success: true, count: data.length, message: 'Favorites fetched successfully', data });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/favorites/toggle — { targetType: 'CHEF'|'DISH', targetId }
 * Adds the favorite when missing, removes it when present. Returns whether
 * the item is now favorited so the client can flip the heart instantly.
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;

    if (!['CHEF', 'DISH'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'targetType must be CHEF or DISH.' });
    }

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'targetId is required.' });
    }

    // The target must exist, otherwise a dangling favorite is saved.
    const exists =
      targetType === 'CHEF'
        ? await User.exists({ _id: targetId })
        : await Dish.exists({ _id: targetId });

    if (!exists) {
      return res.status(404).json({ success: false, message: 'The item you tried to favorite no longer exists.' });
    }

    const existing = await Favorite.findOneAndDelete({ userId: req.user._id, targetType, targetId });

    if (existing) {
      return res.status(200).json({ success: true, favorited: false, message: 'Removed from favorites.' });
    }

    await Favorite.create({ userId: req.user._id, targetType, targetId });

    res.status(201).json({ success: true, favorited: true, message: 'Added to favorites.' });
  } catch (error) {
    // Duplicate key can only happen on a concurrent double-toggle; treat the
    // second one as "already favorited" instead of a 500.
    if (error.code === 11000) {
      return res.status(200).json({ success: true, favorited: true, message: 'Added to favorites.' });
    }
    next(error);
  }
};

module.exports = { getMyFavorites, toggleFavorite };
