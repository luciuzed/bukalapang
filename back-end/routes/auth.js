const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { otpStore, passwordResetStore, generateOtp, generateResetToken, sendOtpEmail } = require('../utils/otp');

const router = express.Router();

const normalizeOtpRoleKey = (role = '') => {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'business' || normalized === 'admin') return 'business';
  return 'user';
};

const normalizeRoleLabel = (role = '') => (normalizeOtpRoleKey(role) === 'business' ? 'Business' : 'User');

const getAccountTable = (role = '') => (normalizeOtpRoleKey(role) === 'business' ? 'admin' : 'user');

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    const [existing] = await db.execute('SELECT id FROM user WHERE email = ?', [email]);
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

    void sendOtpEmail(email, otp).catch((e) => {
      console.error('Email send failed', e);
    });

    res.status(201).json({ message: "OTP sent for registration", otpNeeded: true, role: 'User' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post('/register-business', async (req, res) => {
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

    console.log(`[REGISTER-BUSINESS] Generated OTP for ${email} with key: ${key}, OTP: ${otp}`);
    console.log(`[REGISTER-BUSINESS] OTP expires at: ${new Date(otpStore[key].expiresAt)}`);

    void sendOtpEmail(email, otp).catch((e) => {
      console.error('Email send failed', e);
    });

    res.status(201).json({ message: "OTP sent for business registration", otpNeeded: true, role: 'Business' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required', field: 'email' });
  }

  try {
    const table = getAccountTable(role);
    const [rows] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email does not exist for the selected account type', field: 'email' });
    }

    const otp = generateOtp();
    const normalizedRole = normalizeRoleLabel(role);
    const key = `${email}:${normalizeOtpRoleKey(role)}`;

    otpStore[key] = {
      code: otp,
      expiresAt: Date.now() + 60_000,
      used: false,
      type: 'forgot-password',
      role: normalizedRole,
    };

    void sendOtpEmail(email, otp, {
      purpose: 'password-reset',
      role: normalizedRole,
    }).catch((e) => {
      console.error('[FORGOT-PASSWORD] Email send failed', e);
    });

    return res.json({ message: 'OTP sent for password reset', otpNeeded: true, role: normalizedRole });
  } catch (err) {
    console.error('[FORGOT-PASSWORD] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to start password reset' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('[LOGIN][User] Querying account by email');
    const [rows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('[LOGIN][User] Account not found');
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];
    const storedHash = typeof user.password === 'string' ? user.password : '';
    if (!storedHash) {
      console.error('[LOGIN][User] Missing or invalid password hash. Available columns:', Object.keys(user));
      return res.status(500).json({ error: 'Server error' });
    }

    console.log('[LOGIN][User] Comparing password hash');
    const isMatch = await bcrypt.compare(password, storedHash);

    if (isMatch) {
      console.log('[LOGIN][User] Credentials valid, generating OTP');
      const otp = generateOtp();
      const key = `${email}:user`;
      otpStore[key] = {
        code: otp,
        expiresAt: Date.now() + 60_000,
        used: false,
        type: 'login',
        role: 'User',
      };

      console.log('[LOGIN][User] OTP stored, sending email');
      void sendOtpEmail(email, otp).catch((e) => {
        console.error('[LOGIN][User] Email send failed', e);
      });

      console.log('[LOGIN][User] Returning OTP-needed response');
      return res.json({ message: "OTP sent", otpNeeded: true, user: { name: user.name, email: user.email }, role: 'User' });
    } else {
      console.log('[LOGIN][User] Wrong credentials');
      return res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    console.error('[LOGIN][User] Unexpected error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/login-business', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('[LOGIN][Business] Querying account by email');
    const [rows] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('[LOGIN][Business] Account not found');
      return res.status(401).json({ error: "Account not found" });
    }

    const admin = rows[0];
    const storedHash = typeof admin.password === 'string' ? admin.password : '';
    if (!storedHash) {
      console.error('[LOGIN][Business] Missing or invalid password hash. Available columns:', Object.keys(admin));
      return res.status(500).json({ error: 'Server error' });
    }

    console.log('[LOGIN][Business] Comparing password hash');
    const isMatch = await bcrypt.compare(password, storedHash);

    if (isMatch) {
      console.log('[LOGIN][Business] Credentials valid, generating OTP');
      const otp = generateOtp();
      const key = `${email}:business`;
      otpStore[key] = {
        code: otp,
        expiresAt: Date.now() + 60_000,
        used: false,
        type: 'login',
        role: 'Business',
      };

      console.log('[LOGIN][Business] OTP stored, sending email');
      void sendOtpEmail(email, otp).catch((e) => {
        console.error('[LOGIN][Business] Email send failed', e);
      });

      console.log('[LOGIN][Business] Returning OTP-needed response');
      return res.json({ message: "OTP sent", otpNeeded: true, admin: { name: admin.name, email: admin.email }, role: 'Business' });
    } else {
      console.log('[LOGIN][Business] Wrong credentials');
      return res.status(401).json({ error: "Wrong credentials" });
    }
  } catch (err) {
    console.error('[LOGIN][Business] Unexpected error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  const key = `${email}:${normalizeOtpRoleKey(role)}`;
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
    void sendOtpEmail(email, otp, {
      purpose: entry.type === 'forgot-password' ? 'password-reset' : 'verification',
      role: entry.role,
    }).catch((e) => {
      console.error('Resend OTP email failed', e);
    });
    return res.json({ message: 'OTP resent', otpNeeded: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, role, otp } = req.body;
  if (!email || !role || !otp) {
    return res.status(400).json({ error: 'Email, role, and OTP are required' });
  }

  const key = `${email}:${normalizeOtpRoleKey(role)}`;
  const entry = otpStore[key];

  console.log(`[VERIFY-OTP] Attempting to verify OTP`);
  console.log(`[VERIFY-OTP] Email: ${email}, Role: ${role}, OTP: ${otp}`);
  console.log(`[VERIFY-OTP] Looking for key: ${key}`);
  console.log(`[VERIFY-OTP] Current OTP store keys:`, Object.keys(otpStore));
  console.log(`[VERIFY-OTP] Entry found:`, entry ? 'YES' : 'NO');

  if (!entry) {
    return res.status(401).json({ error: 'OTP not found or expired' });
  }

  if (entry.used) {
    return res.status(401).json({ error: 'OTP already used' });
  }

  if (Date.now() > entry.expiresAt) {
    console.log(`[VERIFY-OTP] OTP expired. Current time: ${new Date()}, Expires at: ${new Date(entry.expiresAt)}`);
    delete otpStore[key];
    return res.status(401).json({ error: 'OTP expired' });
  }

  if (entry.code !== otp) {
    console.log(`[VERIFY-OTP] OTP code mismatch. Expected: ${entry.code}, Received: ${otp}`);
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  console.log(`[VERIFY-OTP] OTP verified successfully for ${email}`);
  entry.used = true;

  if (entry.type === 'forgot-password') {
    const resetToken = generateResetToken();
    passwordResetStore[resetToken] = {
      email,
      role: entry.role,
      expiresAt: Date.now() + 10 * 60_000,
      used: false,
    };

    delete otpStore[key];

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      role: entry.role,
      email,
      resetToken,
    });
  }

  let userData = { email: email, role: entry.role };

  if (entry.type === 'register') {
    // Use the data we stored in the otpStore during the /register call
    userData.name = entry.payload.name;
    userData.phone = entry.payload.phone;

    try {
      const table = entry.role === 'Business' ? 'admin' : 'user';
      const phoneCol = entry.role === 'Business' ? 'number' : 'number';
      await db.execute(
        `INSERT INTO ${table} (email, password, name, ${phoneCol}) VALUES (?, ?, ?, ?)`,
        [entry.payload.email, entry.payload.password, entry.payload.name, entry.payload.phone]
      );
      
      // Fetch the ID after inserting
      const [rows] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
      if (rows.length > 0) {
        userData.id = rows[0].id;
      }
    } catch (err) {
      console.error('Registration commit failed', err);
      return res.status(500).json({ error: 'Database insert failed' });
    }
  } else {
    // FOR LOGIN: We need to ask the Database for the name/phone since they aren't in the OTP store
    const table = entry.role === 'Business' ? 'admin' : 'user';
    const phoneCol = entry.role === 'Business' ? 'number' : 'number';
    const [rows] = await db.execute(`SELECT id, name, ${phoneCol} as phone FROM ${table} WHERE email = ?`, [email]);
    
    if (rows.length > 0) {
      userData.id = rows[0].id;
      userData.name = rows[0].name;
      userData.phone = rows[0].phone;
    }
  }

  delete otpStore[key];

  res.json({ 
    success: true, 
    user: userData,
    redirect: entry.role === 'Business' ? '/admin/dashboard' : '/venue' 
  });
});

router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Reset token, new password, and confirm password are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match', field: 'confirmPassword' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters', field: 'newPassword' });
  }

  const session = passwordResetStore[resetToken];

  if (!session) {
    return res.status(401).json({ error: 'Reset session not found or expired' });
  }

  if (session.used) {
    return res.status(401).json({ error: 'Reset session already used' });
  }

  if (Date.now() > session.expiresAt) {
    delete passwordResetStore[resetToken];
    return res.status(401).json({ error: 'Reset session expired' });
  }

  try {
    const table = getAccountTable(session.role);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [rows] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [session.email]);
    if (rows.length === 0) {
      delete passwordResetStore[resetToken];
      return res.status(404).json({ error: 'Account not found' });
    }

    await db.execute(`UPDATE ${table} SET password = ? WHERE email = ?`, [hashedPassword, session.email]);

    session.used = true;
    delete passwordResetStore[resetToken];

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[RESET-PASSWORD] Error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/admin/change-password', async (req, res) => {
  const { adminId, currentPassword, newPassword } = req.body;

  if (!adminId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'adminId, currentPassword, and newPassword are required' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const [rows] = await db.execute('SELECT id, password FROM admin WHERE id = ?', [adminId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const admin = rows[0];
    const storedHash = typeof admin.password === 'string' ? admin.password : '';

    if (!storedHash) {
      return res.status(500).json({ error: 'Server error' });
    }

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect', field: 'currentPassword' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admin SET password = ? WHERE id = ?', [newHashedPassword, adminId]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[ADMIN][CHANGE_PASSWORD] Error:', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.post('/user/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'userId, currentPassword, and newPassword are required' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const [rows] = await db.execute('SELECT id, password FROM user WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const user = rows[0];
    const storedHash = typeof user.password === 'string' ? user.password : '';

    if (!storedHash) {
      return res.status(500).json({ error: 'Server error' });
    }

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect', field: 'currentPassword' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE user SET password = ? WHERE id = ?', [newHashedPassword, userId]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[USER][CHANGE_PASSWORD] Error:', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
