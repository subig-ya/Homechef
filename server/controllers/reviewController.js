const Review = require('../models/Review');
const Dish = require('../models/Dish');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const createReview = async (req, res, next) => {
  try {
    // TRUST & FRAUD GATE: a review is only meaningful when it comes from a
    // customer with a genuinely completed transaction with this chef. Anything
    // earlier (pending, rejected, cancelled, expired) is not evidence of an
    // experience — rejecting it keeps the Bayesian average game-resistant.
    const { sellerId, rating, comment, orderId, bookingId, dishId } = req.body;
    if (!sellerId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Seller, rating, and comment are required.' });
    }

    let verifiedOrder = null;
    let verifiedBooking = null;

    if (orderId) {
      verifiedOrder = await Order.findOne({
        _id: orderId,
        customerId: req.user._id,
        sellerId,
        status: 'COMPLETED'
      });
      if (!verifiedOrder) {
        return res.status(400).json({
          success: false,
          message: 'You can only review an order after it has been completed.'
        });
      }
    }

    if (bookingId) {
      verifiedBooking = await Booking.findOne({
        _id: bookingId,
        customerId: req.user._id,
        sellerId,
        status: 'COMPLETED'
      });
      if (!verifiedBooking) {
        return res.status(400).json({
          success: false,
          message: 'You can only review a chef after the booking has been completed.'
        });
      }
    }

    // A dish review must be backed by a completed order that actually included
    // that dish — nobody can rate food they never received.
    if (!verifiedOrder && !verifiedBooking) {
      if (dishId) {
        verifiedOrder = await Order.findOne({
          customerId: req.user._id,
          sellerId,
          status: 'COMPLETED',
          'items.dishId': dishId
        });
        if (!verifiedOrder) {
          return res.status(400).json({
            success: false,
            message: 'You can only review food you actually ordered and received.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Reviews must be tied to a completed order or booking.'
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
      bookingId: verifiedBooking ? verifiedBooking._id : (bookingId || null),
      orderId: verifiedOrder ? verifiedOrder._id : (orderId || null),
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
