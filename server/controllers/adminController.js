const User = require('../models/User');
const Dish = require('../models/Dish');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const HomeChefApplication = require('../models/HomeChefApplication');

const getAdminDashboard = async (req, res, next) => {
  try {
    const [users, listings, bookings, orders, payments, sellers, pendingApplications] = await Promise.all([
      User.countDocuments(),
      Dish.countDocuments(),
      Booking.countDocuments(),
      Order.countDocuments(),
      Payment.countDocuments(),
      Dish.distinct('sellerId'),
      HomeChefApplication.countDocuments({ status: 'PENDING' })
    ]);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard fetched successfully',
      data: {
        users,
        sellers: sellers.length,
        listings,
        bookings,
        orders,
        payments,
        pendingApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard };
