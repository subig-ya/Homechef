const Review = require('../models/Review');
const Dish = require('../models/Dish');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const createReview = async (req, res, next) => {
  try {
    const { dishId, orderId, sellerId, bookingId, rating, comment } = req.body;
    if (!sellerId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Seller, rating, and comment are required.' });
    }

    // A review must be tied to a real completed order, if one is provided.
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, customerId: req.user._id, sellerId });
      if (!order) {
        return res.status(400).json({ success: false, message: 'Order not found or not purchased from this seller.' });
      }
    }

    // A chef review may be tied to a booking (a home-cooking service). The
    // customer must own the booking and it must be accepted or later.
    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, customerId: req.user._id, sellerId });
      if (!booking) {
        return res.status(400).json({ success: false, message: 'Booking not found or not made with this chef.' });
      }
      if (!['ACCEPTED', 'CONFIRMED', 'COMPLETED'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'You can only review a chef after the booking has been accepted or completed.'
        });
      }
    }

    const existingReview = await Review.findOne({
      customerId: req.user._id,
      sellerId,
      $or: [{ dishId: dishId || null }, { bookingId: bookingId || null }, { orderId: orderId || null }]
    });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this chef.' });
    }

    const review = await Review.create({
      customerId: req.user._id,
      sellerId,
      dishId: dishId || null,
      bookingId: bookingId || null,
      orderId: orderId || null,
      rating,
      comment
    });

    // Recompute the listing's average rating + review count.
    if (dishId) {
      const reviews = await Review.find({ dishId });
      const averageRating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
      await Dish.findByIdAndUpdate(dishId, { rating: Number(averageRating.toFixed(1)), reviewCount: reviews.length });
    }

    await Notification.create({
      userId: req.user._id,
      title: 'Review submitted',
      message: 'Thank you for leaving a review for your experience.',
      type: 'REVIEW'
    });

    res.status(201).json({ success: true, message: 'Review created successfully', data: review });
  } catch (error) {
    next(error);
  }
};

const getReviewsByDish = async (req, res, next) => {
  try {
    const reviews = await Review.find({ dishId: req.params.dishId }).populate('customerId', 'name');
    res.status(200).json({ success: true, message: 'Reviews fetched successfully', data: reviews });
  } catch (error) {
    next(error);
  }
};

const getReviewsBySeller = async (req, res, next) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId })
      .populate('customerId', 'name')
      .populate('dishId', 'name');
    res.status(200).json({ success: true, message: 'Reviews fetched successfully', data: reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getReviewsByDish, getReviewsBySeller };
