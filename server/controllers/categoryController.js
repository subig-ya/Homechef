const Category = require('../models/Category');

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const category = await Category.create({ name, description, image });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Categories fetched successfully', data: categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCategory, getCategories };
