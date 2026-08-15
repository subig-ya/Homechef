const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { calculateHaversineDistance } = require('./dishController');
const { reserveSlot, releaseSlot, markFullIfNeeded } = require('./slotController');
const { computeExpiry } = require('../utils/responseWindow');

// SLOT CAPACITY ALGORITHM (race-safe):
// Capacity is enforced atomically in reserveSlot() — a booking only succeeds
// while `currentBookings < maxBookings`, and the increment and the check happen
// in the same MongoDB update, so two simultaneous requests for the last spot
// cannot both succeed. Once full, the slot stops appearing in search listings.
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

    // Validate the slot exists and belongs to the chef being booked.
    const slot = await Slot.findById(slotId);
    if (!slot || slot.sellerId.toString() !== sellerId.toString()) {
      return res.status(404).json({ success: false, message: 'Selected slot is invalid.' });
    }

    // Atomic reservation — the real capacity gate. Returns null if full.
    const reserved = await reserveSlot(slotId);
    if (!reserved) {
      return res.status(400).json({ success: false, message: 'The selected slot is full.' });
    }

    const chef = await User.findById(sellerId).select('name location latitude longitude');
    if (!chef) {
      // Release the reservation again if the chef vanished between the read
      // and the reserve.
      await releaseSlot(slotId);
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

    const parsedDate = new Date(`${date}T00:00:00`);

    let booking;
    try {
      booking = await Booking.create({
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
        paymentStatus: 'UNPAID',
        expiresAt: computeExpiry(parsedDate)
      });
    } catch (createError) {
      // Booking creation failed — give the spot back so it's not leaked.
      await releaseSlot(slotId);
      throw createError;
    }

    // Flip the search flag to FULL once capacity is exhausted.
    await markFullIfNeeded(reserved);

    await Notification.create({
      userId: req.user._id,
      recipient: sellerId,
      bookingId: booking._id,
      title: 'New Booking Request',
      message: `New booking request from ${req.user.name} for ${foodService || cuisinePreference || 'your service'}.`,
      type: 'BOOKING',
      isRead: false
    });

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
      .populate('customerId', 'name profileImage location')
      .sort({ createdAt: -1 });

    const chefLat = Number(req.user.location?.latitude ?? req.user.latitude ?? 0);
    const chefLon = Number(req.user.location?.longitude ?? req.user.longitude ?? 0);

    // Backend-computed travel distance; the customer's exact coordinates are
    // stripped from the payload so the chef UI never sees raw lat/lon.
    const data = bookings.map((booking) => {
      const plain = booking.toObject();
      const customer = plain.customerId;
      let distanceKm = null;

      if (customer?.location) {
        const cLat = Number(customer.location.latitude) || 0;
        const cLon = Number(customer.location.longitude) || 0;
        if (cLat && cLon && (chefLat || chefLon)) {
          distanceKm = calculateHaversineDistance(chefLat, chefLon, cLat, cLon);
        }
        customer.location = { address: customer.location.address || '' };
      }

      // Fall back to the distance captured at booking creation time.
      plain.distanceKm = distanceKm ?? (plain.calculatedDistance || null);
      return plain;
    });

    res.status(200).json({ success: true, message: 'Bookings fetched successfully', data });
  } catch (error) {
    next(error);
  }
};

const acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.status === 'EXPIRED') {
      return res.status(409).json({ success: false, message: 'This request already expired and can no longer be accepted.' });
    }

    booking.status = 'ACCEPTED';
    booking.paymentStatus = 'PENDING';
    booking.expiresAt = null;
    await booking.save();

    await Notification.create({
      recipient: booking.customerId,
      bookingId: booking._id,
      title: 'Booking accepted',
      message: `${req.user.name} accepted your booking for ${booking.date} (${booking.slotType.toLowerCase()}).`,
      type: 'BOOKING'
    });

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
    booking.expiresAt = null;
    await booking.save();

    // The chef declined — give the reserved spot back to other customers.
    await releaseSlotCapacity(booking.slotId);

    await Notification.create({
      recipient: booking.customerId,
      bookingId: booking._id,
      title: 'Booking declined',
      message: `${req.user.name} could not take your booking for ${booking.date}.`,
      type: 'BOOKING'
    });

    res.status(200).json({ success: true, message: 'Booking rejected', data: booking });
  } catch (error) {
    next(error);
  }
};

// Customer cancels a booking; chef cancels too. Frees the reserved slot and
// releases any live payment so nobody is charged for a cancelled commitment.
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isChef = booking.sellerId.toString() === req.user._id.toString();
    if (!isCustomer && !isChef) {
      return res.status(403).json({ success: false, message: 'You cannot cancel this booking.' });
    }

    if (['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `This booking is already ${booking.status.toLowerCase()}.` });
    }

    booking.status = 'CANCELLED';
    booking.paymentStatus = 'CANCELLED';
    booking.expiresAt = null;
    await booking.save();

    await releaseSlotCapacity(booking.slotId);

    await Payment.updateMany(
      { bookingId: booking._id, status: { $in: ['PENDING', 'PAID'] } },
      {
        $set: {
          status: 'CANCELLED',
          paymentResponse: { released: true, message: 'Payment released after booking cancellation.' }
        }
      }
    );

    await Notification.create({
      recipient: isCustomer ? booking.sellerId : booking.customerId,
      bookingId: booking._id,
      title: 'Booking cancelled',
      message: `${req.user.name} cancelled the booking for ${booking.date}.`,
      type: 'BOOKING'
    });

    res.status(200).json({ success: true, message: 'Booking cancelled.', data: booking });
  } catch (error) {
    next(error);
  }
};

const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.status = 'COMPLETED';
    booking.paymentStatus = 'PAID';
    await booking.save();

    await Notification.create({
      recipient: booking.customerId,
      bookingId: booking._id,
      title: 'Booking completed',
      message: `Your booking with ${req.user.name} for ${booking.date} is complete.`,
      type: 'BOOKING'
    });

    res.status(200).json({ success: true, message: 'Booking completed', data: booking });
  } catch (error) {
    next(error);
  }
};

// Release a slot's reserved spot and clear the FULL flag if capacity allows
// again. Idempotent — releasing a slot that was never reserved is harmless.
const releaseSlotCapacity = async (slotId) => {
  const slot = await releaseSlot(slotId);
  if (slot && slot.status === 'FULL' && slot.currentBookings < slot.maxBookings) {
    await Slot.updateOne({ _id: slot._id, status: 'FULL' }, { $set: { status: 'AVAILABLE' } });
  }
};

/**
 * Sweeper: expire PENDING bookings whose response window lapsed. Frees the
 * reserved slot capacity and notifies both parties. Called by the server
 * interval alongside the order sweeper.
 */
const expireStaleBookings = async () => {
  const now = new Date();
  const stale = await Booking.find({ status: 'PENDING', expiresAt: { $lte: now } });

  for (const booking of stale) {
    booking.status = 'EXPIRED';
    booking.paymentStatus = 'UNPAID';
    await booking.save();

    await releaseSlotCapacity(booking.slotId);

    await Notification.create({
      recipient: booking.customerId,
      bookingId: booking._id,
      title: 'Booking request expired',
      message: `The chef did not respond to your booking request before it expired. The slot is free for another request.`,
      type: 'BOOKING'
    });

    await Notification.create({
      recipient: booking.sellerId,
      bookingId: booking._id,
      title: 'Booking request expired',
      message: `A booking request expired because you did not respond in time.`,
      type: 'BOOKING'
    });
  }

  return stale.length;
};

module.exports = {
  createBooking,
  getMyBookings,
  getSellerBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  expireStaleBookings
};
