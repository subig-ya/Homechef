const express = require('express');
const router = express.Router();
const { getAllSellers, getSellerById } = require('../controllers/sellerController');

// GET /api/sellers — every registered User who has created a food listing.
router.get('/', getAllSellers);
router.get('/:id', getSellerById);

module.exports = router;
