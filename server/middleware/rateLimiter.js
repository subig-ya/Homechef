const rateLimit = require('express-rate-limit');

// Brute-force protection for authentication endpoints: 20 attempts per
// 15-minute window per IP. Kept above 10 so a genuine user who mistypes a
// forgotten password is not locked out, while still throttling attackers.
//
// This is a factory on purpose: every protected route gets its OWN limiter
// instance (and therefore its own counter), so hammering one endpoint such as
// /auth/password cannot lock a user out of /auth/login and vice versa. Using a
// single shared instance across all auth routes lets one test suite or bot
// freeze the whole auth area for 15 minutes.
const createAuthLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many attempts. Please try again later.'
    }
  });

// Tight limit for password-reset endpoints so an attacker cannot flood reset
// tokens for other users' accounts.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many reset attempts. Please try again in a few minutes.'
  }
});

// Loose global safety net for the whole API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

module.exports = { createAuthLimiter, resetLimiter, apiLimiter };
