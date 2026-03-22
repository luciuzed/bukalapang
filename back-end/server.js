const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const app = express();

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const otpStore = {}; 

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const sendOtpEmail = async (recipient, otpCode) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"MainYuk Support" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `Your Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Poppins,sans-serif; min-width:1000px; overflow:auto; line-height:2">
        <div style="margin:50px auto; width:70%; padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em; color: #009966; text-decoration:none; font-weight:600">MainYuk!</a>
          </div>
          <p style="font-size:1.1em">Your MainYuk Verification Code</p>
          <p>This code expires after 1 minute or if you request a new one.</p>
          <h2 style="background: #009966; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">
            ${otpCode}
          </h2>
          <p style="font-size:0.9em;">Regards,<br />MainYuk Team</p>
          <hr style="border:none; border-top:1px solid #eee" />
          <div style="float:right; padding:8px 0; color:#aaa; font-size:0.8em; line-height:1; font-weight:300">
            <p>MainYuk Support</p>
            <p>Indonesia</p>
          </div>
        </div>
      </div>
    `,
  });

  console.log('OTP email sent:', info.messageId);
  return info;
};

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


//REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const key = `${email}:user`;
    otpStore[key] = {
      code: otp,
      expiresAt: Date.now() + 60_000,
      used: false,
      type: 'register',
      role: 'User',
      payload: {
        name,
        email,
        password: hashedPassword,
        phone,
      }
    };

    await sendOtpEmail(email, otp).catch((e) => {
      console.error('Email send failed', e);
    });

    res.status(201).json({ message: "OTP sent for registration", otpNeeded: true, role: 'User' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/register-business', async (req, res) => {
  const { email, password, name, phone } = req.body;
  
  try {
    const [existing] = await db.execute('SELECT id FROM admin WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const key = `${email}:business`;
    otpStore[key] = {
      code: otp,
      expiresAt: Date.now() + 60_000,
      used: false,
      type: 'register',
      role: 'Business',
      payload: {
        name,
        email,
        password: hashedPassword,
        phone,
      }
    };

    await sendOtpEmail(email, otp).catch((e) => {
      console.error('Email send failed', e);
    });

    res.status(201).json({ message: "OTP sent for business registration", otpNeeded: true, role: 'Business' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

//LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`${password} vs ${user.password}`);

    if (isMatch) {
      const otp = generateOtp();
      const key = `${email}:user`;
      otpStore[key] = {
        code: otp,
        expiresAt: Date.now() + 60_000,
        used: false,
        type: 'login',
        role: 'User',
      };

      await sendOtpEmail(email, otp).catch((e) => {
        console.error('Email send failed', e);
      });

      return res.json({ message: "OTP sent", otpNeeded: true, user: { name: user.name, email: user.email }, role: 'User' });
    } else {
      res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/login-business', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  try {
    const [rows] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Account not found" });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(`${password} vs ${admin.password}`);

    if (isMatch) {
      const otp = generateOtp();
      const key = `${email}:business`;
      otpStore[key] = {
        code: otp,
        expiresAt: Date.now() + 60_000,
        used: false,
        type: 'login',
        role: 'Business',
      };

      await sendOtpEmail(email, otp).catch((e) => {
        console.error('Email send failed', e);
      });

      return res.json({ message: "OTP sent", otpNeeded: true, admin: { name: admin.name, email: admin.email }, role: 'Business' });
    } else {
      res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/resend-otp', async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  const key = `${email}:${role.toLowerCase()}`;
  const entry = otpStore[key];

  if (!entry) {
    return res.status(404).json({ error: 'No pending OTP session found' });
  }

  const otp = generateOtp();
  otpStore[key] = {
    ...entry,
    code: otp,
    expiresAt: Date.now() + 60_000,
    used: false,
  };

  try {
    await sendOtpEmail(email, otp);
    return res.json({ message: 'OTP resent', otpNeeded: true });
  } catch (err) {
    console.error('Resend OTP email failed', err);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, role, otp } = req.body;
  if (!email || !role || !otp) {
    return res.status(400).json({ error: 'Email, role, and OTP are required' });
  }

  const key = `${email}:${role.toLowerCase()}`;
  const entry = otpStore[key];

  if (!entry) {
    return res.status(401).json({ error: 'OTP not found or expired' });
  }

  if (entry.used) {
    return res.status(401).json({ error: 'OTP already used' });
  }

  if (Date.now() > entry.expiresAt) {
    delete otpStore[key];
    return res.status(401).json({ error: 'OTP expired' });
  }

  if (entry.code !== otp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  // Inside /api/verify-otp ... after checking if OTP is valid
  entry.used = true;

  let userData = { email: email, role: entry.role };

  if (entry.type === 'register') {
    // Use the data we stored in the otpStore during the /register call
    userData.name = entry.payload.name;
    userData.phone = entry.payload.phone;

    try {
      const table = entry.role === 'Business' ? 'admin' : 'users';
      const phoneCol = entry.role === 'Business' ? 'number' : 'phone_number';
      await db.execute(
        `INSERT INTO ${table} (email, password, name, ${phoneCol}) VALUES (?, ?, ?, ?)`,
        [entry.payload.email, entry.payload.password, entry.payload.name, entry.payload.phone]
      );
    } catch (err) {
      return res.status(500).json({ error: 'Database insert failed' });
    }
  } else {
    // FOR LOGIN: We need to ask the Database for the name/phone since they aren't in the OTP store
    const table = entry.role === 'Business' ? 'admin' : 'users';
    const phoneCol = entry.role === 'Business' ? 'number' : 'phone_number';
    const [rows] = await db.execute(`SELECT name, ${phoneCol} as phone FROM ${table} WHERE email = ?`, [email]);
    
    if (rows.length > 0) {
      userData.name = rows[0].name;
      userData.phone = rows[0].phone;
    }
  }

  delete otpStore[key];

  // ✅ SEND THE DATA BACK
  res.json({ 
    success: true, 
    user: userData, // This now contains name and phone!
    redirect: entry.role === 'Business' ? '/dashboard' : '/venue' 
  });
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));