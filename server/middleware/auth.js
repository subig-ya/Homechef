const jwt = require('jsonwebtoken');
const User = require('../models/User');

// The JWT secret must come from the environment. The server refuses to boot
// without it (checked in server.js), so there is never a hard-coded fallback
// secret that an attacker could use to forge admin tokens.
const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  return process.env.JWT_SECRET;
};

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

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Suspended/removed accounts are rejected on every request so a ban takes
    // effect immediately, even for a token that was already issued.
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support for assistance.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'jwt expired') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
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

module.exports = { protect, admin, homechef, getJwtSecret };
