const { Category } = require('../models');

async function getAllCategories(req, res) {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const where = includeDeleted ? {} : { is_deleted: false };
    const categories = await Category.findAll({ where, order: [['category_id', 'ASC']] });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('GET /api/v1/categories error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch categories.', error: error.message });
  }
}

async function getCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ success: true, category });
  } catch (error) {
    console.error('GET /api/v1/categories/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch category.', error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    const category = await Category.create({
      name: name.trim(),
      description: description || null
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('POST /api/v1/categories error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to create category.', error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    await category.update({
      name: req.body.name !== undefined ? req.body.name.trim() : category.name,
      description: req.body.description !== undefined ? req.body.description : category.description
    });

    res.json({ success: true, message: 'Category updated.', category });
  } catch (error) {
    console.error('PUT /api/v1/categories/:id error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to update category.', error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    await category.update({ is_deleted: true });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/categories/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to delete category.', error: error.message });
  }
}

async function restoreCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    await category.update({ is_deleted: false });
    res.json({ success: true, message: 'Category restored.' });
  } catch (error) {
    console.error('PUT /api/v1/categories/:id/restore error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to restore category.', error: error.message });
  }
}

module.exports = {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
};