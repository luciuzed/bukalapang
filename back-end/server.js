const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 6767;

const db = mysql.createPool({
  host: '127.0.0.1', // for deployment, use "db"
  user: 'root',
  password: 'root123',
  database: 'bukalapang_db'
});


//REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (email, password, name, phone_number) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, phone]
    );
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/register-business', async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO admin (email, password, name, phone_number) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, phone]
    );
    res.status(201).json({ message: "Business registered" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

//LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/login-business', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Account not found" });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (isMatch) {
      res.json({ message: "Login successful", admin: { name: admin.name, email: admin.email } });
    } else {
      res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(5000, () => console.log('Backend running on http://localhost:5000'));