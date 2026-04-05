const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/field');
const bookingRoutes = require('./routes/booking');
const courtRoutes = require('./routes/court');


app.use('/api', authRoutes);
app.use('/api/fields-public', fieldRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/courts', courtRoutes);

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

// Start the payment expiration job when server starts
startPaymentExpirationJob();

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));