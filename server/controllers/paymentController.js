const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, orderId, amount } = req.body;
    const payment = await Payment.create({
      userId: req.user._id,
      bookingId: bookingId || null,
      orderId: orderId || null,
      amount: amount || 0,
      status: 'PENDING',
      paymentResponse: { message: 'Payment initialized' }
    });

    res.status(201).json({ success: true, message: 'Payment initiated', data: payment });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    payment.status = 'PAID';
    payment.paymentResponse = { verified: true };
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'PAID', status: 'COMPLETED' });
    }

    if (payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'PAID', status: 'COMPLETED' });
    }

    await Notification.create({
      userId: payment.userId,
      title: 'Payment confirmed',
      message: 'Your payment has been confirmed and the request is now complete.',
      type: 'PAYMENT'
    });

    res.status(200).json({ success: true, message: 'Payment verified', data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = { initiatePayment, verifyPayment };
