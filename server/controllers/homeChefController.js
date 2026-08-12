const HomeChefApplication = require('../models/HomeChefApplication');
const User = require('../models/User');

// Normalize an array of draft menu items submitted with the application.
// Only items with a name and a positive price are kept.
const parseMenuItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      name: String(item.name || '').trim(),
      description: String(item.description || '').trim(),
      price: Number(item.price) || 0,
      cuisine: String(item.cuisine || '').trim(),
      image: String(item.image || '').trim(),
      dietary: Array.isArray(item.dietary)
        ? item.dietary.map((d) => String(d).trim()).filter(Boolean)
        : []
    }))
    .filter((item) => item.name && item.price > 0);
};

// Submit (or re-submit) a HomeChef application for the logged-in user.
// A user may only have ONE pending application at a time. If their previous
// application was rejected, this reuses that document and resets it to
// PENDING so they can apply again.
const submitApplication = async (req, res, next) => {
  try {
    const { fullName, phone, location, about, specialties, yearsOfExperience, kitchenType, serviceArea, menuItems } = req.body;

    if (!fullName || !phone || !location) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone number, and address/location are required.'
      });
    }

    if (req.user.role === 'HOMECHEF') {
      return res.status(400).json({
        success: false,
        message: 'You are already a HomeChef.'
      });
    }

    const parsedSpecialties = Array.isArray(specialties)
      ? specialties.map((s) => String(s).trim()).filter(Boolean)
      : typeof specialties === 'string'
        ? specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const parsedMenuItems = parseMenuItems(menuItems);

    const allowedKitchenTypes = ['HOME_KITCHEN', 'RENTED_KITCHEN', 'COMMUNITY_KITCHEN', 'COMMERCIAL_KITCHEN', 'OTHER'];
    const parsedKitchenType = allowedKitchenTypes.includes(kitchenType) ? kitchenType : '';

    const applicationData = {
      fullName,
      phone,
      location,
      about: about || '',
      specialties: parsedSpecialties,
      yearsOfExperience: Math.max(0, Number(yearsOfExperience) || 0),
      kitchenType: parsedKitchenType,
      serviceArea: String(serviceArea || '').trim(),
      menuItems: parsedMenuItems
    };

    let application = await HomeChefApplication.findOne({ user: req.user._id });

    if (application) {
      Object.assign(application, applicationData);
      application.status = 'APPROVED';
      application.adminNote = 'Auto-approved: new HomeChef access enabled.';
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      await application.save();
    } else {
      application = await HomeChefApplication.create({
        user: req.user._id,
        ...applicationData,
        status: 'APPROVED',
        adminNote: 'Auto-approved: new HomeChef access enabled.',
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      });
    }

    req.user.role = 'HOMECHEF';
    req.user.homeChefApplicationStatus = 'APPROVED';
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'You are now a HomeChef. Your kitchen access is active immediately.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// Get the logged-in user's application (or null if they have never applied).
const getMyApplication = async (req, res, next) => {
  try {
    const application = await HomeChefApplication.findOne({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Application fetched successfully',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// Admin: list all applications, optionally filtered by status.
const getAllApplications = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      const normalized = String(status).toUpperCase();
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(normalized)) {
        query.status = normalized;
      }
    }

    const applications = await HomeChefApplication.find(query)
      .populate('user', 'name email phone location profileImage')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      message: 'Applications fetched successfully',
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// Admin: approve an application. The applicant becomes a HOMECHEF.
const approveApplication = async (req, res, next) => {
  try {
    const application = await HomeChefApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (application.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'This application has already been approved.'
      });
    }

    const user = await User.findById(application.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Applicant account not found.'
      });
    }

    application.status = 'APPROVED';
    application.adminNote = req.body.adminNote || application.adminNote;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Grant HomeChef privileges on the same account — no separate auth.
    user.role = 'HOMECHEF';
    user.homeChefApplicationStatus = 'APPROVED';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Application approved. The user is now a HomeChef.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// Admin: reject an application. The applicant stays a normal customer but may
// apply again later.
const rejectApplication = async (req, res, next) => {
  try {
    const application = await HomeChefApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (application.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'This application has already been rejected.'
      });
    }

    const user = await User.findById(application.user);

    application.status = 'REJECTED';
    application.adminNote = req.body.adminNote || application.adminNote;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    if (user) {
      // Keep the account usable as a normal customer.
      user.homeChefApplicationStatus = 'REJECTED';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected. The user remains a normal customer.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitApplication,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication
};
