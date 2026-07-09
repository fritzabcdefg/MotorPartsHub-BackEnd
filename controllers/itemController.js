const fs = require('fs');
const path = require('path');
const { Item } = require('../models');
const ProductImage = require('../models/productImage'); // adjust path if your filename differs
const { itemUploadDir } = require('../utils/itemUpload');

function parseIntOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloatOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function toImageUrl(filename) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  const clean = filename.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `/uploads/${clean}`;
}

function deleteFileQuiet(filename) {
  if (!filename) return;
  const clean = filename.replace(/^\/+/, '').replace(/^uploads\//, '');
  fs.unlink(path.join(itemUploadDir, clean), () => {});
}

async function attachImages(item) {
  const plain = item.toJSON ? item.toJSON() : item;
  const photos = await ProductImage.findAll({ where: { item_id: plain.id }, order: [['id', 'ASC']] });
  plain.img_url = toImageUrl(plain.img_path);
  plain.images = photos.map((p) => ({ id: p.id, filename: p.filename, url: toImageUrl(p.filename) }));
  return plain;
}

async function listItems(req, res) {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const where = includeDeleted ? {} : { is_deleted: false };
    const items = await Item.findAll({ where, order: [['id', 'ASC']] });
    const withImages = await Promise.all(items.map(attachImages));
    res.json({ items: withImages });
  } catch (error) {
    console.error('GET /api/v1/items error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch items.', error: error.message });
  }
}

async function getItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    const withImages = await attachImages(item);
    res.json({ item: withImages });
  } catch (error) {
    console.error('GET /api/v1/items/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to fetch item.', error: error.message });
  }
}

async function createItem(req, res) {
  try {
    const mainFile = req.files?.image?.[0];
    const img = mainFile ? `/uploads/${mainFile.filename}` : null;

    const item = await Item.create({
      name: req.body.name,
      description: req.body.description || null,
      sell_price: parseFloatOrNull(req.body.sell_price) ?? 0,
      cost_price: parseFloatOrNull(req.body.cost_price),
      quantity: parseIntOrNull(req.body.quantity) ?? 0,
      supplier_name: req.body.supplier_name || null,
      category_id: parseIntOrNull(req.body.category_id),
      img_path: img
    });

    const photoFiles = req.files?.photos || [];
    if (photoFiles.length) {
      await ProductImage.bulkCreate(
        photoFiles.map((f) => ({ item_id: item.id, filename: f.filename, created_at: new Date() }))
      );
    }

    const withImages = await attachImages(item);
    res.status(201).json({ success: true, item: withImages });
  } catch (error) {
    console.error('POST /api/v1/items error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to create item.', error: error.message });
  }
}

async function updateItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    const mainFile = req.files?.image?.[0];
    let img = item.img_path;
    if (mainFile) {
      deleteFileQuiet(item.img_path);
      img = `/uploads/${mainFile.filename}`;
    }

    await item.update({
      name: req.body.name ?? item.name,
      description: req.body.description ?? item.description,
      sell_price: req.body.sell_price !== undefined ? (parseFloatOrNull(req.body.sell_price) ?? item.sell_price) : item.sell_price,
      cost_price: req.body.cost_price !== undefined ? parseFloatOrNull(req.body.cost_price) : item.cost_price,
      quantity: req.body.quantity !== undefined ? (parseIntOrNull(req.body.quantity) ?? item.quantity) : item.quantity,
      supplier_name: req.body.supplier_name ?? item.supplier_name,
      category_id: req.body.category_id !== undefined ? parseIntOrNull(req.body.category_id) : item.category_id,
      img_path: img
    });

    // Delete photos the user removed in the edit form
    let deleteIds = [];
    if (req.body.deletePhotoIds) {
      try { deleteIds = JSON.parse(req.body.deletePhotoIds); } catch { deleteIds = []; }
    }
    if (Array.isArray(deleteIds) && deleteIds.length) {
      const toDelete = await ProductImage.findAll({ where: { id: deleteIds, item_id: item.id } });
      toDelete.forEach((photo) => deleteFileQuiet(photo.filename));
      await ProductImage.destroy({ where: { id: deleteIds, item_id: item.id } });
    }

    // Add newly uploaded photos
    const photoFiles = req.files?.photos || [];
    if (photoFiles.length) {
      await ProductImage.bulkCreate(
        photoFiles.map((f) => ({ item_id: item.id, filename: f.filename, created_at: new Date() }))
      );
    }

    const withImages = await attachImages(item);
    res.json({ success: true, message: 'Item updated.', item: withImages });
  } catch (error) {
    console.error('PUT /api/v1/items/:id error:', error.stack || error.message);
    res.status(400).json({ message: 'Unable to update item.', error: error.message });
  }
}

async function deleteItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    await item.update({ is_deleted: true });

    res.json({ success: true, message: 'Item deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/items/:id error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to delete item.', error: error.message });
  }
}

async function restoreItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    await item.update({ is_deleted: false });
    res.json({ success: true, message: 'Item restored.' });
  } catch (error) {
    console.error('PUT /api/v1/items/:id/restore error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to restore item.', error: error.message });
  }
}

async function deletePhoto(req, res) {
  try {
    const photo = await ProductImage.findOne({ where: { id: req.params.photoId, item_id: req.params.id } });
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });
    deleteFileQuiet(photo.filename);
    await photo.destroy();
    res.json({ success: true, message: 'Photo deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/items/:id/photos/:photoId error:', error.stack || error.message);
    res.status(500).json({ message: 'Unable to delete photo.', error: error.message });
  }
}

async function getParts(req, res) {
  try {
    const items = await Item.findAll({ where: { is_deleted: false }, order: [['id', 'ASC']] });
    res.json({ success: true, parts: items });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch parts.', error: error.message });
  }
}

async function getCatalog(req, res) {
  try {
    const items = await Item.findAll({ where: { is_deleted: false }, order: [['id', 'ASC']] });
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
  restoreItem,
  deletePhoto,
  getParts,
  getCatalog,
  getCategories
};