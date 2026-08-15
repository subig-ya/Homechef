const Slot = require('../models/Slot');

// RACE-SAFE SLOT CAPACITY ALGORITHM
// ---------------------------------------------------------
// Capacity is enforced with a single atomic `findOneAndUpdate` whose filter
// checks `currentBookings < maxBookings` inside an `$expr`. Two customers
// requesting the very last spot cannot both pass — MongoDB serializes the
// update, and only one reservation increments the counter. The `status` flag
// (FULL) is only a search convenience; the real gate is the counter.

// Atomically reserve one spot. Returns the updated slot, or null when full.
const reserveSlot = async (slotId) => {
  return Slot.findOneAndUpdate(
    {
      _id: slotId,
      status: { $ne: 'UNAVAILABLE' },
      $expr: { $lt: ['$currentBookings', '$maxBookings'] }
    },
    { $inc: { currentBookings: 1 } },
    { returnDocument: 'after' }
  );
};

// Release one spot (cancelled/rejected/expired booking). Returns the updated slot.
const releaseSlot = async (slotId) => {
  return Slot.findByIdAndUpdate(
    slotId,
    { $inc: { currentBookings: -1 } },
    { returnDocument: 'after' }
  );
};

// Flip the status flag to FULL once capacity is exhausted (idempotent).
const markFullIfNeeded = async (slot) => {
  if (slot.currentBookings >= slot.maxBookings && slot.status !== 'FULL') {
    await Slot.updateOne({ _id: slot._id, status: { $ne: 'FULL' } }, { $set: { status: 'FULL' } });
  }
};

const getAllSlots = async (req, res, next) => {
  try {
    const { sellerId } = req.query;

    // Only AVAILABLE *and* not-yet-at-capacity slots are shown. Filtering on
    // the counter too means a slot whose flag is stale never misleads.
    const filter = {
      status: 'AVAILABLE',
      $expr: { $lt: ['$currentBookings', '$maxBookings'] }
    };
    if (sellerId) filter.sellerId = sellerId;

    const slots = await Slot.find(filter)
      .populate('sellerId', 'name location')
      .sort({ date: 1, slotType: 1 });

    res.status(200).json({ success: true, message: 'Slots fetched successfully', data: slots });
  } catch (error) {
    next(error);
  }
};

const createSlot = async (req, res, next) => {
  try {
    const { date, slotType, startTime, endTime, maxBookings, status } = req.body;
    if (!date || !slotType) {
      return res.status(400).json({ success: false, message: 'Date and slot type are required.' });
    }

    const existingSlot = await Slot.findOne({ sellerId: req.user._id, date, slotType });
    if (existingSlot) {
      return res.status(400).json({ success: false, message: 'A slot for this date and time already exists.' });
    }

    const slot = await Slot.create({
      sellerId: req.user._id,
      date,
      slotType,
      startTime: startTime || '',
      endTime: endTime || '',
      status: status || 'AVAILABLE',
      maxBookings: maxBookings || 1
    });

    res.status(201).json({ success: true, message: 'Slot created successfully', data: slot });
  } catch (error) {
    next(error);
  }
};

const getSlotsBySeller = async (req, res, next) => {
  try {
    const slots = await Slot.find({ sellerId: req.user._id }).sort({ date: 1 });
    res.status(200).json({ success: true, message: 'Slots fetched successfully', data: slots });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSlot, getSlotsBySeller, getAllSlots, reserveSlot, releaseSlot, markFullIfNeeded };
