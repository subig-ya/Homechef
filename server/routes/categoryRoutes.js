const express = require('express');
const router = express.Router();
const { createCategory, getCategories } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', protect, admin, createCategory);

module.exports = router;
