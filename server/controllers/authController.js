const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { geocodeAddress } = require('../services/geocode');

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
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'homechef-secret', {
    expiresIn: '7d'
  });
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

    const existingUser = await User.findOne({ email });
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
      name,
      email,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email });
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        token: generateToken(user._id)
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
      const nextLocation = typeof location === 'string'
        ? { address: location, latitude: req.user.latitude || 0, longitude: req.user.longitude || 0 }
        : {
            address: location?.address || '',
            latitude: Number(location?.latitude ?? req.user.latitude ?? 0),
            longitude: Number(location?.longitude ?? req.user.longitude ?? 0)
          };

      if (!nextLocation.address) {
        nextLocation.latitude = Number(location?.latitude ?? req.user.latitude ?? 0);
        nextLocation.longitude = Number(location?.longitude ?? req.user.longitude ?? 0);
      } else if (nextLocation.latitude === 0 && nextLocation.longitude === 0) {
        const { latitude, longitude } = await geocodeAddress(nextLocation.address);
        nextLocation.latitude = Number(latitude || 0);
        nextLocation.longitude = Number(longitude || 0);
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

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile
};
