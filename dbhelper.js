const mysql = require('mysql2/promise');
require("dotenv").config();

const pool = new mysql.createPool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
});

module.exports = { pool };
