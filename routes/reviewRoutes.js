const express = require('express');
const router = express.Router({ mergeParams: true });
const Review = require('../models/Review');
const { verifyToken } = require('../middlewares/auth');

// GET /api/v1/items/:itemId/reviews  (public — no auth needed to read)
router.get('/:itemId/reviews', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const reviews = await Review.findAll({
      where: {
        item_id: itemId,
        is_visible: true,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });

    const count = reviews.length;
    const average_rating = count
      ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1))
      : 0;

    res.json({ reviews, count, average_rating });
  } catch (err) {
    console.error('Failed to fetch reviews', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/v1/items/:itemId/reviews  (requires login)
router.post('/:itemId/reviews', verifyToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const { rating, comment, orderinfo_id } = req.body;

    if (Number.isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    if (rating != null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Trust the verified token, not the request body, for identity fields
    const userId = req.user.id || req.user.user_id;
    const userName = req.user.name || req.user.username || req.user.first_name || 'Anonymous';

    const review = await Review.create({
      item_id: itemId,
      orderinfo_id: orderinfo_id || null,
      user_id: userId || null,
      user_name: userName,
      rating: rating || null,
      comment: comment.trim()
    });

    res.status(201).json({ review });
  } catch (err) {
    console.error('Failed to create review', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;