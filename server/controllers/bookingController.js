const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Notification = require('../models/Notification');

// SLOT CAPACITY ALGORITHM:
// A booking is only allowed while currentBookings < maxBookings. On success the
// counter is incremented, and once currentBookings >= maxBookings the slot is
// marked FULL so it stops appearing in public slot listings.
const createBooking = async (req, res, next) => {
  try {
    const { sellerId, slotId, date, slotType, numberOfGuests, cuisinePreference, specialRequirements, basePrice, additionalCharges } = req.body;

    if (!sellerId || !slotId || !date || !slotType || !numberOfGuests) {
      return res.status(400).json({ success: false, message: 'Seller, slot, date, slot type, and guest count are required.' });
    }

    const slot = await Slot.findById(slotId);
    if (!slot || slot.sellerId.toString() !== sellerId.toString()) {
      return res.status(404).json({ success: false, message: 'Selected slot is invalid.' });
    }

    if (slot.status === 'FULL' || slot.currentBookings >= slot.maxBookings) {
      return res.status(400).json({ success: false, message: 'The selected slot is full.' });
    }

    const totalAmount = Number(basePrice || 0) + Number(additionalCharges || 0);

    const booking = await Booking.create({
      customerId: req.user._id,
      sellerId,
      slotId: slot._id,
      date,
      slotType,
      numberOfGuests,
      cuisinePreference: cuisinePreference || '',
      specialRequirements: specialRequirements || '',
      basePrice: Number(basePrice || 0),
      additionalCharges: Number(additionalCharges || 0),
      totalAmount
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Booking request received',
      message: `Your booking request is pending review.`,
      type: 'BOOKING'
    });

    slot.currentBookings += 1;
    if (slot.currentBookings >= slot.maxBookings) {
      slot.status = 'FULL';
    }
    await slot.save();

    res.status(201).json({ success: true, message: 'Booking created successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('sellerId', 'name location')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Bookings fetched successfully', data: bookings });
  } catch (error) {
    next(error);
  }
};

const getSellerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ sellerId: req.user._id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Bookings fetched successfully', data: bookings });
  } catch (error) {
    next(error);
  }
};

const acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.status = 'ACCEPTED';
    booking.paymentStatus = 'PENDING';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking accepted', data: booking });
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.status = 'REJECTED';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking rejected', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getSellerBookings, acceptBooking, rejectBooking };
