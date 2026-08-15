const express = require('express');
const router = express.Router();
const { searchEverything } = require('../controllers/searchController');

// Public global search — matches chefs and dishes in one call.
router.get('/', searchEverything);

module.exports = router;
