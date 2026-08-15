const User = require('../models/User');
const Dish = require('../models/Dish');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Slot = require('../models/Slot');
const Review = require('../models/Review');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const HomeChefApplication = require('../models/HomeChefApplication');
const SupportTicket = require('../models/SupportTicket');
const { calculateBayesianRating } = require('./dishController');

const getAdminDashboard = async (req, res, next) => {
  try {
    const [users, chefs, listings, bookings, orders, payments, pendingApplications, pendingReports, pendingSupport] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'HOMECHEF' }),
        Dish.countDocuments(),
        Booking.countDocuments(),
        Order.countDocuments(),
        Payment.countDocuments(),
        HomeChefApplication.countDocuments({ status: 'PENDING' }),
        Report.countDocuments({ status: 'PENDING' }),
        SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
      ]);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard fetched successfully',
      data: {
        users,
        chefs,
        listings,
        bookings,
        orders,
        payments,
        pendingApplications,
        pendingReports,
        pendingSupport
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Build per-chef activity by grouping each collection by sellerId once,
 * avoiding N+1 lookups.
 */
const buildChefActivity = async (chefIds) => {
  const [dishAgg, bookingAgg, orderAgg, reviewAgg, reportAgg] = await Promise.all([
    Dish.aggregate([
      { $match: { sellerId: { $in: chefIds } } },
      { $group: { _id: '$sellerId', count: { $sum: 1 } } }
    ]),
    Booking.aggregate([
      { $match: { sellerId: { $in: chefIds } } },
      {
        $group: {
          _id: '$sellerId',
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0] } }
        }
      }
    ]),
    Order.aggregate([
      { $match: { sellerId: { $in: chefIds } } },
      {
        $group: {
          _id: '$sellerId',
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0] } }
        }
      }
    ]),
    Review.aggregate([
      { $match: { sellerId: { $in: chefIds } } },
      {
        $group: {
          _id: '$sellerId',
          count: { $sum: 1 },
          sum: { $sum: '$rating' }
        }
      }
    ]),
    Report.aggregate([
      { $match: { targetType: 'CHEF', targetId: { $in: chefIds }, status: 'PENDING' } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } }
    ])
  ]);

  const toMap = (agg) => {
    const map = {};
    agg.forEach((row) => {
      map[row._id.toString()] = row;
    });
    return map;
  };

  return {
    dishes: toMap(dishAgg),
    bookings: toMap(bookingAgg),
    orders: toMap(orderAgg),
    reviews: toMap(reviewAgg),
    reports: toMap(reportAgg)
  };
};

const decorateChef = (chef, activity) => {
  const id = chef._id.toString();
  const reviews = activity.reviews[id];
  const reviewCount = reviews?.count || 0;
  const averageRating = reviewCount
    ? Number((reviews.sum / reviewCount).toFixed(1))
    : 0;
  const bayesianRating = reviewCount
    ? Number(calculateBayesianRating(averageRating, reviewCount).toFixed(2))
    : 0;

  const booking = activity.bookings[id];
  const order = activity.orders[id];

  return {
    _id: chef._id,
    name: chef.name,
    email: chef.email,
    phone: chef.phone,
    profileImage: chef.profileImage,
    role: chef.role,
    location: chef.location && typeof chef.location === 'object'
      ? chef.location.address || ''
      : chef.location || '',
    joinedAt: chef.createdAt,
    isBanned: chef.isBanned,
    banCount: chef.banCount || 0,
    bannedAt: chef.bannedAt || null,
    banReason: chef.banReason || '',
    listingCount: activity.dishes[id]?.count || 0,
    bookingCount: booking?.count || 0,
    orderCount: order?.count || 0,
    revenue: Number(((booking?.revenue || 0) + (order?.revenue || 0)).toFixed(2)),
    reviewCount,
    averageRating,
    bayesianRating,
    pendingReports: activity.reports[id]?.count || 0
  };
};

/**
 * GET /api/admin/chefs — all chef accounts with their platform activity.
 */
const getAdminChefs = async (req, res, next) => {
  try {
    const chefs = await User.find({ role: 'HOMECHEF' }).sort({ createdAt: -1 });
    const chefIds = chefs.map((c) => c._id);
    const activity = await buildChefActivity(chefIds);

    const data = chefs
      .map((chef) => decorateChef(chef, activity))
      .sort((a, b) => b.pendingReports - a.pendingReports || b.bayesianRating - a.bayesianRating);

    res.status(200).json({ success: true, count: data.length, message: 'Chefs fetched successfully', data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/chefs/:id — full activity snapshot for one chef.
 */
const getAdminChefById = async (req, res, next) => {
  try {
    const chef = await User.findById(req.params.id);
    if (!chef || chef.role !== 'HOMECHEF') {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    const activity = await buildChefActivity([chef._id]);

    const [dishes, bookings, orders, reviews, slots, reports] = await Promise.all([
      Dish.find({ sellerId: chef._id }).select('name price availabilityStatus createdAt').sort({ createdAt: -1 }),
      Booking.find({ sellerId: chef._id }).select('customerId totalAmount status paymentStatus date createdAt').sort({ createdAt: -1 }),
      Order.find({ sellerId: chef._id }).select('customerId totalAmount status paymentStatus createdAt').sort({ createdAt: -1 }),
      Review.find({ sellerId: chef._id }).select('customerId rating comment createdAt').sort({ createdAt: -1 }),
      Slot.find({ sellerId: chef._id }).select('date slotType status').sort({ date: -1 }),
      Report.find({ targetType: 'CHEF', targetId: chef._id }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      message: 'Chef activity fetched successfully',
      data: {
        ...decorateChef(chef, activity),
        dishes,
        bookings,
        orders,
        reviews,
        slots,
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/chefs/:id/ban — suspend a chef (reversible). The reason is
 * stored for the audit trail and shown to the chef on their next login.
 */
const banChef = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const chef = await User.findById(req.params.id);
    if (!chef || chef.role !== 'HOMECHEF') {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    chef.isBanned = true;
    chef.banCount = (chef.banCount || 0) + 1;
    chef.bannedAt = new Date();
    chef.banReason = typeof reason === 'string' ? reason.trim().slice(0, 300) : '';
    await chef.save();

    res.status(200).json({
      success: true,
      message: `${chef.name} has been banned.`,
      data: { _id: chef._id, isBanned: true, banCount: chef.banCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/chefs/:id/unban — lift a suspension.
 */
const unbanChef = async (req, res, next) => {
  try {
    const chef = await User.findById(req.params.id);
    if (!chef || chef.role !== 'HOMECHEF') {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    chef.isBanned = false;
    chef.bannedAt = null;
    chef.banReason = '';
    await chef.save();

    res.status(200).json({
      success: true,
      message: `${chef.name} is no longer banned.`,
      data: { _id: chef._id, isBanned: false }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/chefs/:id — permanently remove a chef and all of their
 * platform data (listings, bookings, orders, slots, reviews, notifications,
 * applications, and the reports they authored).
 */
const removeChef = async (req, res, next) => {
  try {
    const chef = await User.findById(req.params.id);
    if (!chef || chef.role !== 'HOMECHEF') {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    await Promise.all([
      Dish.deleteMany({ sellerId: chef._id }),
      Booking.deleteMany({ sellerId: chef._id }),
      Order.deleteMany({ sellerId: chef._id }),
      Slot.deleteMany({ sellerId: chef._id }),
      Review.deleteMany({ sellerId: chef._id }),
      Review.deleteMany({ customerId: chef._id }),
      Payment.deleteMany({ userId: chef._id }),
      Notification.deleteMany({ userId: chef._id }),
      HomeChefApplication.deleteMany({ user: chef._id }),
      Report.deleteMany({ reporterId: chef._id }),
      Report.deleteMany({ targetType: 'CHEF', targetId: chef._id })
    ]);

    await chef.deleteOne();

    res.status(200).json({
      success: true,
      message: `${chef.name} and all related data have been removed.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users — every registered user (customers, chefs, admins)
 * with the basics the admin needs: name, email, role, registration date and
 * account status. Supports ?search, ?role and ?status=active|banned filters.
 */
const getAdminUsers = async (req, res, next) => {
  try {
    const { search = '', role = '', status = '' } = req.query;

    const query = {};
    const term = String(search).trim();
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }
    const roleValue = String(role).toUpperCase();
    if (['USER', 'HOMECHEF', 'ADMIN'].includes(roleValue)) {
      query.role = roleValue;
    }
    if (String(status).toLowerCase() === 'active') query.isBanned = false;
    if (String(status).toLowerCase() === 'banned') query.isBanned = true;

    const users = await User.find(query)
      .select(
        'name email phone profileImage role isBanned banCount bannedAt banReason homeChefApplicationStatus createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(1000);

    res.status(200).json({
      success: true,
      count: users.length,
      message: 'Users fetched successfully',
      data: users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        profileImage: u.profileImage,
        role: u.role,
        isBanned: u.isBanned,
        banCount: u.banCount || 0,
        bannedAt: u.bannedAt || null,
        banReason: u.banReason || '',
        applicationStatus: u.homeChefApplicationStatus,
        joinedAt: u.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/ban — suspend any non-admin account (reversible).
 * Admins are protected from banning themselves or other admins.
 */
const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (target.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be banned.' });
    }
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot ban your own account.' });
    }

    target.isBanned = true;
    target.banCount = (target.banCount || 0) + 1;
    target.bannedAt = new Date();
    target.banReason = typeof reason === 'string' ? reason.trim().slice(0, 300) : '';
    await target.save();

    res.status(200).json({
      success: true,
      message: `${target.name} has been banned.`,
      data: { _id: target._id, isBanned: true, banCount: target.banCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/unban — lift a suspension.
 */
const unbanUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    target.isBanned = false;
    target.bannedAt = null;
    target.banReason = '';
    await target.save();

    res.status(200).json({
      success: true,
      message: `${target.name} is no longer banned.`,
      data: { _id: target._id, isBanned: false }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  banUser,
  unbanUser,
  getAdminChefs,
  getAdminChefById,
  banChef,
  unbanChef,
  removeChef
};
