const express = require('express');
const router = express.Router();
const { createDish, getAllDishes, getDishById, getMyDishes, updateDish, deleteDish } = require('../controllers/dishController');
const { protect, homechef } = require('../middleware/auth');

router.get('/', getAllDishes);
router.get('/my', protect, getMyDishes);
router.get('/:id', getDishById);
// Creating and managing listings is a HomeChef privilege.
router.post('/', protect, homechef, createDish);
router.put('/:id', protect, homechef, updateDish);
router.delete('/:id', protect, homechef, deleteDish);

module.exports = router;
