// app.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { frontendOrigins } = require('./utils/config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { verifyAdmin } = require('./middlewares/auth');
const { uploadDir } = require('./utils/upload');
const { Item, Category } = require('./models');
const { getParts, getCatalog, getCategories } = require('./controllers/itemController');
const orderController = require('./controllers/orderController');
const inventoryController = require('./controllers/inventoryController');
const reviewController = require('./controllers/reviewController');
const categoryController = require('./controllers/categoryController');

const app = express();

const candidateFrontendRoots = [
  path.resolve(__dirname, '..', 'MotorPartsHub-FrontEnd'),
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, '..', 'frontend')
].filter((candidate) => fs.existsSync(candidate));
const frontendRoot = candidateFrontendRoots[0] || path.resolve(__dirname, '..', 'MotorPartsHub-FrontEnd');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload.' });
  }
  next(err);
});

app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Backend is running' }));
app.get('/api/v1/health', (req, res) => res.json({ ok: true, message: 'Backend is running' }));

// Dashboard APIs
app.get('/api/v1/chart-data', orderController.getChartData);
app.get('/api/v1/dashboard-stats', orderController.getDashboardStats);

// Management Table APIs
app.use('/api/v1', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/orders', orderRoutes);
app.get('/api/v1/inventory', inventoryController.getAllInventory);
app.get('/api/v1/reviews', reviewController.getAllReviews);
app.get('/api/v1/categories', categoryController.getAllCategories);

// Catalog APIs
app.get('/api/v1/parts', verifyAdmin, getParts);
app.get('/api/catalog', getCatalog);
app.get('/api/categories', getCategories);

// Static files & fallbacks
app.get('/admin/:page', (req, res, next) => {
  const safePage = path.basename(req.params.page);
  const targetFile = path.join(frontendRoot, 'public', 'admin', safePage);
  if (fs.existsSync(targetFile)) {
    return res.sendFile(targetFile);
  }
  next();
});

app.use('/css', express.static(path.join(frontendRoot, 'css')));
app.use('/js', express.static(path.join(frontendRoot, 'js')));
app.use(express.static(path.join(frontendRoot, 'public')));
app.use('/uploads', express.static(uploadDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'public', 'home.html'));
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: origin not allowed.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = app;