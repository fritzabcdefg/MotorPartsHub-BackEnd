const { Item } = require('../models');

async function listItems(req, res) {
  try {
    const items = await Item.findAll({ order: [['id', 'ASC']] });
    const rows = items.map((i) => ({
      item_id: i.id,
      name: i.name,
      description: i.description || i.name,
      sell_price: i.sell_price,
      cost_price: null,
      category_id: null,
      category_name: null,
      img_path: i.img_path || '',
      quantity: i.quantity,
      supplier_name: null
    }));
    res.json({ rows });
  } catch (error) {
    console.error('GET /api/v1/items error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch items.', error: error.message });
  }
}

async function getItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json(item);
  } catch (error) {
    console.error('GET /api/v1/items/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch item.', error: error.message });
  }
}

async function createItem(req, res) {
  try {
    const img = req.file ? `/uploads/${req.file.filename}` : null;
    const item = await Item.create({
      name: req.body.name,
      description: req.body.description,
      sell_price: parseFloat(req.body.sell_price) || 0,
      quantity: parseInt(req.body.quantity, 10) || 0,
      img_path: img
    });
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('POST /api/v1/items error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to create item.', error: error.message });
  }
}

async function updateItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    const img = req.file ? `/uploads/${req.file.filename}` : item.img_path;
    await item.update({
      name: req.body.name || item.name,
      description: req.body.description || item.description,
      sell_price: req.body.sell_price ? parseFloat(req.body.sell_price) : item.sell_price,
      quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : item.quantity,
      img_path: img
    });
    res.json({ success: true, message: 'Item updated.', item });
  } catch (error) {
    console.error('PUT /api/v1/items/:id error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to update item.', error: error.message });
  }
}

async function deleteItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    await item.destroy();
    res.json({ success: true, message: 'Item deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/items/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to delete item.', error: error.message });
  }
}

async function getParts(req, res) {
  try {
    const items = await Item.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, parts: items });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch parts.', error: error.message });
  }
}

async function getCatalog(req, res) {
  try {
    const items = await Item.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, items });
  } catch (error) {
    console.error('GET /api/catalog error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch catalog.', error: error.message });
  }
}

async function getCategories(req, res) {
  try {
    const { Category } = require('../models');
    const categories = await Category.findAll({ order: [['category_id', 'ASC']] });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('GET /api/categories error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch categories.', error: error.message });
  }
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getParts,
  getCatalog,
  getCategories
};
