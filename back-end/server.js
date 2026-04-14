const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');

// Only try to load .env if it exists (for local development)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../dev-storage/uploads');
const paymentQrDir = process.env.PAYMENT_QR_DIR || path.resolve(__dirname, '../dev-storage/qr');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(paymentQrDir, { recursive: true });

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';

const getTodayInAppTimezone = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(new Date());
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use('/qr', express.static(paymentQrDir));

// routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/field');
const bookingRoutes = require('./routes/booking');
const courtRoutes = require('./routes/court');
const uploadRoutes = require('./routes/upload');


app.use('/api', authRoutes);
app.use('/api/fields-public', fieldRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api', uploadRoutes);

// Marks all slots with a date before today as unavailable.
const startPastSlotDisableJob = () => {
  const disablePastSlots = async () => {
    try {
      const todayInAppTimezone = getTodayInAppTimezone();

      const [result] = await db.execute(
        `UPDATE field_slot
         SET is_booked = 1
         WHERE is_booked = 0
           AND DATE(start_time) < ?`,
        [todayInAppTimezone]
      );

      if (result.affectedRows > 0) {
        console.log(`Auto-disabled ${result.affectedRows} past slots`);
      }
    } catch (err) {
      console.error('Past slot disable job error:', err);
    }
  };

  // Run once on startup so old slots are cleaned immediately.
  disablePastSlots();

  // Keep slots synced in case old dates are inserted later.
  setInterval(disablePastSlots, 60000);
};

// Runs every minute to check for unpaid payments older than 10 minutes
const startPaymentExpirationJob = () => {
  setInterval(async () => {
    try {
      const connection = await db.getConnection();
      
      // Find all unpaid payments older than 10 minutes
      const [expiredPayments] = await connection.execute(`
        SELECT p.id, p.booking_id
        FROM payment p
        JOIN booking b ON p.booking_id = b.id
        WHERE p.status = 'unpaid'
          AND p.transaction_time < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
      `);

      if (expiredPayments.length > 0) {
        console.log(`Found ${expiredPayments.length} expired unpaid payments. Marking as failed...`);

        for (const payment of expiredPayments) {
          try {
            await connection.beginTransaction();

            // Update payment status to 'failed'
            await connection.execute(
              'UPDATE payment SET status = ? WHERE id = ?',
              ['failed', payment.id]
            );

            // Update booking status to 'failed'
            await connection.execute(
              'UPDATE booking SET status = ? WHERE id = ?',
              ['failed', payment.booking_id]
            );

            // Unmark slots as booked
            await connection.execute(`
              UPDATE field_slot 
              SET is_booked = 0 
              WHERE id IN (
                SELECT slot_id FROM booking_slot WHERE booking_id = ?
              )
            `, [payment.booking_id]);

            await connection.commit();
            console.log(`Payment ${payment.id} marked as failed and slots released`);
          } catch (err) {
            try {
              await connection.rollback();
            } catch (rollbackErr) {
              console.error('Rollback error:', rollbackErr);
            }
            console.error(`Error processing payment ${payment.id}:`, err);
          }
        }
      }

      connection.release();
    } catch (err) {
      console.error('Payment expiration job error:', err);
    }
  }, 60000); // Run every 60 seconds (1 minute)
};

// Start the past slot disable job when server starts
startPastSlotDisableJob();

// Start the payment expiration job when server starts
startPaymentExpirationJob();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));