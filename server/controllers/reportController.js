const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

/**
 * POST /api/reports — a logged-in user files a report against a chef,
 * a listing, or a review so the admin can review it.
 */
const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!['CHEF', 'DISH', 'REVIEW'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'targetType must be one of CHEF, DISH, or REVIEW.'
      });
    }

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target id.'
      });
    }

    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the issue in at least 5 characters.'
      });
    }

    // Resolve the target so we never store a report against a deleted record
    // and so the admin can see who was reported.
    const target =
      targetType === 'CHEF'
        ? await User.findById(targetId)
        : targetType === 'DISH'
          ? await Dish.findById(targetId)
          : await Review.findById(targetId);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'The reported item no longer exists.'
      });
    }

    if (targetType === 'CHEF' && target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own profile.'
      });
    }

    const existing = await Report.findOne({
      reporterId: req.user._id,
      targetType,
      targetId,
      status: 'PENDING'
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this item. It is under review.'
      });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason: String(reason).trim()
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Thank you — our team will review it shortly.',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports — list reports, newest first. Optional ?status=
 * filter (PENDING | RESOLVED | DISMISSED).
 */
const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {};
    if (['PENDING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 });

    // Attach human-readable target summaries without leaking private fields.
    const enriched = await Promise.all(
      reports.map(async (report) => {
        const doc = report.toObject();
        doc.targetSummary = '';

        if (report.targetType === 'CHEF') {
          const chef = await User.findById(report.targetId).select('name email role isBanned profileImage');
          doc.targetSummary = chef
            ? {
                _id: chef._id,
                name: chef.name,
                email: chef.email,
                role: chef.role,
                isBanned: chef.isBanned,
                profileImage: chef.profileImage
              }
            : null;
        } else if (report.targetType === 'DISH') {
          const dish = await Dish.findById(report.targetId).select('name image price');
          doc.targetSummary = dish || null;
        } else if (report.targetType === 'REVIEW') {
          const review = await Review.findById(report.targetId).select('rating comment');
          doc.targetSummary = review || null;
        }

        return doc;
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      message: 'Reports fetched successfully',
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/reports/:id — mark a report RESOLVED or DISMISSED.
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be RESOLVED or DISMISSED.'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    report.status = status;
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report marked as ${status.toLowerCase()}.`,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getReports, updateReportStatus };
