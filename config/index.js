const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const frontendOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

module.exports = {
  port: process.env.PORT || 4000,
  frontendOrigins,
  rootDir: __dirname,
  uploadDir: path.resolve(__dirname, '..', 'frontend', 'public', 'uploads')
};
