const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { calculateHaversineDistance } = require('./dishController');

// SLOT CAPACITY ALGORITHM:
// A booking is only allowed while currentBookings < maxBookings. On success the
// counter is incremented, and once currentBookings >= maxBookings the slot is
// marked FULL so it stops appearing in public slot listings.
const createBooking = async (req, res, next) => {
  try {
    const {
      sellerId,
      slotId,
      foodService,
      date,
      time,
      slotType,
      numberOfGuests,
      cuisinePreference,
      specialRequirements,
      bookingLocation,
      basePrice,
      additionalCharges
    } = req.body;

    if (!sellerId || !slotId || !date || !time || !slotType || !numberOfGuests || !bookingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Chef, slot, date, time, booking location, and guest count are required.'
      });
    }

    const slot = await Slot.findById(slotId);
    if (!slot || slot.sellerId.toString() !== sellerId.toString()) {
      return res.status(404).json({ success: false, message: 'Selected slot is invalid.' });
    }

    if (slot.status === 'FULL' || slot.currentBookings >= slot.maxBookings) {
      return res.status(400).json({ success: false, message: 'The selected slot is full.' });
    }

    const chef = await User.findById(sellerId).select('name location latitude longitude');
    if (!chef) {
      return res.status(404).json({ success: false, message: 'Chef not found.' });
    }

    const bookingCoords = {
      address: bookingLocation.address || '',
      latitude: Number(bookingLocation.latitude ?? 0),
      longitude: Number(bookingLocation.longitude ?? 0)
    };

    const chefLat = Number(chef.location?.latitude ?? chef.latitude ?? 0);
    const chefLon = Number(chef.location?.longitude ?? chef.longitude ?? 0);

    // Haversine Distance Algorithm
    // Calculates the approximate distance between the chef and the customer's
    // booking point using the spherical law formula for accurate real-world km.
    const calculatedDistance = bookingCoords.latitude && bookingCoords.longitude
      ? calculateHaversineDistance(bookingCoords.latitude, bookingCoords.longitude, chefLat, chefLon)
      : 0;

    const totalAmount = Number(basePrice || 0) + Number(additionalCharges || 0);

    const booking = await Booking.create({
      customerId: req.user._id,
      sellerId,
      slotId: slot._id,
      foodService: foodService || cuisinePreference || 'Chef service',
      date,
      time,
      slotType,
      numberOfGuests,
      cuisinePreference: cuisinePreference || '',
      specialRequirements: specialRequirements || '',
      bookingLocation: bookingCoords,
      calculatedDistance,
      basePrice: Number(basePrice || 0),
      additionalCharges: Number(additionalCharges || 0),
      totalAmount,
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    });

    await Notification.create({
      userId: req.user._id,
      recipient: sellerId,
      bookingId: booking._id,
      title: 'New Booking Request',
      message: `New booking request from ${req.user.name} for ${foodService || cuisinePreference || 'your service'}.`,
      type: 'BOOKING',
      isRead: false
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
