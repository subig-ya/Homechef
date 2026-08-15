const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { geocodeAddress, reverseGeocode } = require('../services/geocode');
const { sendPasswordResetEmail } = require('../services/email');
const { getJwtSecret } = require('../middleware/auth');

/**
 * AUTHENTICATION & PASSWORD ALGORITHMS
 * ---------------------------------------------------------
 *  1. bcrypt (Blowfish-based key derivation) with 10 salt rounds is used to
 *     hash passwords before storage. A unique random salt is embedded in each
 *     hash, so identical passwords never produce identical hashes.
 *  2. JSON Web Token (HMAC-SHA256 signature): after successful login the
 *     user's _id is signed and issued as a 7-day token; middleware re-fetches
 *     the user from the DB on every request so role/status changes apply
 *     immediately without a new login.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Centralised request-body guards. Keeps the handlers free of per-field
// validation while ensuring the API rejects junk/malformed input early.
const isValidEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());
const isValidName = (value) => typeof value === 'string' && value.trim().length >= 2;
const isValidPassword = (value) => typeof value === 'string' && value.length >= 8;

const generateToken = (id, rememberMe = false) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: rememberMe ? '30d' : '7d'
  });
};

// Hash a raw reset token with SHA-256 before storing. The raw token is only
// ever sent to the user's email; the database holds the hash.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/auth/forgot-password
 * Generates a one-time reset token (valid 1 hour) for the given email and
 * stores only its hash. The token is emailed to the user. The response is
 * intentionally identical whether or not the email exists, so attackers cannot
 * enumerate accounts, and it never contains the token itself.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email || '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send the code to the user's email. When no SMTP credentials are set up
    // yet, the service logs the token to the server console instead — it is
    // never returned through the API.
    try {
      const { delivered } = await sendPasswordResetEmail(normalizedEmail, resetToken);
      console.log(`[PasswordReset] ${normalizedEmail} → email ${delivered ? 'sent' : 'logged (no SMTP configured)'}`);
    } catch (mailError) {
      console.error('[PasswordReset] Email delivery failed:', mailError.message);
      // If the email could not be sent, invalidate the token so it can't be
      // abused, and surface the failure to the user.
      user.resetPasswordToken = '';
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(502).json({
        success: false,
        message: 'We could not send the reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'If that email is registered, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Sets a new password using a valid, unexpired reset token.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A reset token is required.'
      });
    }

    if (!isValidPassword(password || '')) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const hashedToken = hashToken(token.trim());
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.'
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = '';
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  homeChefApplicationStatus: user.homeChefApplicationStatus || 'NONE',
  phone: user.phone,
  location: user.location && typeof user.location === 'object'
    ? {
        address: user.location.address || '',
        latitude: Number(user.location.latitude ?? user.latitude ?? 0),
        longitude: Number(user.location.longitude ?? user.longitude ?? 0)
      }
    : {
        address: user.location || '',
        latitude: Number(user.latitude ?? 0),
        longitude: Number(user.longitude ?? 0)
      },
  latitude: Number(user.latitude ?? user.location?.latitude ?? 0),
  longitude: Number(user.longitude ?? user.location?.longitude ?? 0),
  profileImage: user.profileImage || '',
  tagline: user.tagline || '',
  bio: user.bio || '',
  specialties: user.specialties || [],
  cuisines: user.cuisines || [],
  yearsOfExperience: user.yearsOfExperience || 0,
  coverImage: user.coverImage || '',
  portfolio: user.portfolio || []
});

const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      role,
      specialties,
      yearsOfExperience
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!isValidName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const normalizedRole = role === 'HOMECHEF' ? 'HOMECHEF' : 'USER';
    const parsedSpecialties = Array.isArray(specialties)
      ? specialties.map((s) => String(s).trim()).filter(Boolean)
      : typeof specialties === 'string'
        ? specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    const parsedYearsOfExperience = Math.max(0, Number(yearsOfExperience) || 0);
    const parsedLocationAddress = typeof location === 'string'
      ? location
      : location?.address || '';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Location system: geocode the address ONCE and store the coordinates
    // so every search reuses them instead of re-geocoding repeatedly.
    const { latitude, longitude } = await geocodeAddress(parsedLocationAddress);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      location: {
        address: parsedLocationAddress,
        latitude: Number(latitude ?? 0),
        longitude: Number(longitude ?? 0)
      },
      latitude: Number(latitude ?? 0),
      longitude: Number(longitude ?? 0),
      role: normalizedRole,
      specialties: parsedSpecialties,
      yearsOfExperience: parsedYearsOfExperience
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: serializeUser(user),
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support for assistance.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        token: generateToken(user._id, rememberMe === true)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: serializeUser(req.user)
  });
};

// Update own profile (name, phone, location). Changing the location
// re-geocodes the new address once and stores fresh coordinates.
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, profileImage } = req.body;

    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (profileImage !== undefined) req.user.profileImage = profileImage;

    if (location !== undefined) {
      // Accept either a plain address string or { address, latitude, longitude }.
      // A location captured from the device's GPS arrives as coordinates; we
      // reverse-geocode it into a display address. A typed address with no
      // coordinates is forward-geocoded as before.
      const address = typeof location === 'string' ? location : location?.address || '';
      const latitude = Number(
        typeof location === 'string'
          ? req.user.latitude || 0
          : location?.latitude ?? req.user.latitude ?? 0
      );
      const longitude = Number(
        typeof location === 'string'
          ? req.user.longitude || 0
          : location?.longitude ?? req.user.longitude ?? 0
      );

      let nextLocation = { address, latitude, longitude };

      if (address && latitude === 0 && longitude === 0) {
        const geocoded = await geocodeAddress(address);
        nextLocation.latitude = Number(geocoded.latitude || 0);
        nextLocation.longitude = Number(geocoded.longitude || 0);
      } else if (!address && latitude !== 0 && longitude !== 0) {
        const reversed = await reverseGeocode(latitude, longitude);
        nextLocation.address = reversed.address || '';
        nextLocation.latitude = Number(reversed.latitude || latitude);
        nextLocation.longitude = Number(reversed.longitude || longitude);
      }

      req.user.location = nextLocation;
      req.user.latitude = Number(nextLocation.latitude || 0);
      req.user.longitude = Number(nextLocation.longitude || 0);
    }

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: serializeUser(req.user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/password
 * Changes the signed-in user's password after verifying the current one.
 * The user stays logged in — a fresh password simply takes effect from the
 * next login (JWTs are stateless and there is no token blacklist).
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Your current password is required.' });
    }

    if (!isValidPassword(newPassword || '')) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    // protect() strips the password hash, so load it back explicitly.
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Your current password is incorrect.' });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password.'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
