const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization || '';

    if (!token.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.'
      });
    }

    token = token.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'homechef-secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.'
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Admin access required.'
  });
};

// HomeChef/seller access: approved HomeChefs and admins only.
const homechef = (req, res, next) => {
  if (req.user && (req.user.role === 'HOMECHEF' || req.user.role === 'ADMIN')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'HomeChef access required. Become a HomeChef first.'
  });
};

module.exports = { protect, admin, homechef };
