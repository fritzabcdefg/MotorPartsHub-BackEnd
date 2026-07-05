const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1', 
  port: 3306,
  user: 'root',          
  password: '',          
  database: 'motorpartshub', // Updated with your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ XAMPP MySQL Connection Failed:', err.message);
  } else {
    console.log('✅ Connected to XAMPP MySQL Database successfully.');
    connection.release();
  }
});

module.exports = pool;