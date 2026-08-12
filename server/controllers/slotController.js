const Slot = require('../models/Slot');

const getAllSlots = async (req, res, next) => {
  try {
    const slots = await Slot.find({ status: 'AVAILABLE' })
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

module.exports = { createSlot, getSlotsBySeller, getAllSlots };
