const mysql = require('mysql2/promise');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Connected to MySQL");

    await connection.end();
  } catch (err) {
    console.error("Could not connect to DB.");
    console.error(err.message);
  }
}

testConnection();