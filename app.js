const express = require('express');
const cors = require('cors');
const path = require('path');
const { frontendOrigins } = require('./config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const { verifyAdmin } = require('./middlewares/auth');
const { uploadDir } = require('./utils/upload');
const { Item, Category } = require('./models');
const { getParts, getCatalog, getCategories } = require('./controllers/itemController');

const app = express();

app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/uploads', express.static(uploadDir));

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'home.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/items', itemRoutes);

app.get('/api/parts', getParts);
app.get('/api/v1/parts', verifyAdmin, getParts);
app.get('/api/catalog', getCatalog);
app.get('/api/categories', getCategories);

module.exports = app;
