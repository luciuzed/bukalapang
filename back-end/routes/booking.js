const express = require('express');
const db = require('../config/database');

const router = express.Router();

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getConfirmedRevenueForField = async (fieldId) => {
  const [rows] = await db.execute(
    `
    SELECT COALESCE(SUM(booking_totals.total_amount), 0) AS revenue
    FROM (
      SELECT DISTINCT b.id, b.total_amount
      FROM booking b
      JOIN booking_slot bs ON b.id = bs.booking_id
      JOIN field_slot fs ON bs.slot_id = fs.id
      WHERE fs.field_id = ?
        AND b.status = 'confirmed'
    ) AS booking_totals
    `,
    [fieldId]
  );

  return Number(rows[0]?.revenue) || 0;
};


// POST /api/bookings
router.post('/', async (req, res) => {
  const { userId, fieldId, selectedSlotIds } = req.body;

  // Validate input
  if (!userId || !fieldId || !selectedSlotIds || !Array.isArray(selectedSlotIds) || selectedSlotIds.length === 0) {
    return res.status(400).json({ 
      error: 'Missing or invalid required fields: userId, fieldId, selectedSlotIds (non-empty array)' 
    });
  }

  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Get slot details and prices
    const placeholders = selectedSlotIds.map(() => '?').join(',');
    const [slots] = await connection.execute(
      `SELECT id, price, is_booked FROM field_slot WHERE id IN (${placeholders}) AND field_id = ?`,
      [...selectedSlotIds, fieldId]
    );

    // Check if all requested slots exist and belong to the field
    if (slots.length !== selectedSlotIds.length) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'One or more selected slots do not exist or do not belong to this field',
        requested: selectedSlotIds.length,
        found: slots.length
      });
    }

    // Check if any slot is already booked
    const bookedSlot = slots.find(s => s.is_booked === 1);
    if (bookedSlot) {
      await connection.rollback();
      return res.status(409).json({ error: 'One or more selected slots are already booked' });
    }

    // Keep backend total in sync with frontend pricing summary.
    const serviceFee = 1000;
    const slotsTotal = slots.reduce((sum, slot) => sum + parseFloat(slot.price), 0);
    const totalAmount = slotsTotal + serviceFee;

    // Step 1: Insert booking record into booking table with 'unpaid' status
    const [bookingResult] = await connection.execute(
      'INSERT INTO booking (user_id, status, total_amount) VALUES (?, ?, ?)',
      [userId, 'unpaid', totalAmount]
    );

    const bookingId = bookingResult.insertId;
    console.log('Booking created with ID:', bookingId);

    // Step 2: Create payment record for this booking
    const [paymentResult] = await connection.execute(
      'INSERT INTO payment (booking_id, amount, status) VALUES (?, ?, ?)',
      [bookingId, totalAmount, 'unpaid']
    );

    const paymentId = paymentResult.insertId;
    console.log('Payment created with ID:', paymentId);

    // Step 3: Insert entries into booking_slot for each slot
    for (const slotId of selectedSlotIds) {
      await connection.execute(
        'INSERT INTO booking_slot (booking_id, slot_id) VALUES (?, ?)',
        [bookingId, slotId]
      );
    }

    // Step 4: Mark all slots as booked in field_slot table
    for (const slotId of selectedSlotIds) {
      await connection.execute(
        'UPDATE field_slot SET is_booked = 1 WHERE id = ?',
        [slotId]
      );
    }

    // Commit transaction
    await connection.commit();

    // Return successful response with payment_id
    res.status(201).json({
      id: bookingId,
      paymentId: parseInt(paymentId),
      userId,
      fieldId,
      status: 'unpaid',
      serviceFee,
      slotsTotal,
      totalAmount,
      selectedSlots: selectedSlotIds,
      message: 'Booking created successfully. Proceeding to payment.'
    });

  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    console.error('Booking creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: err.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/bookings/:bookingId/confirm
router.post('/:bookingId/confirm', async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Verify booking exists and is pending
    const [booking] = await db.execute(
      'SELECT id, status FROM booking WHERE id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking[0].status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Update booking status to confirmed
    await db.execute(
      'UPDATE booking SET status = ? WHERE id = ?',
      ['confirmed', bookingId]
    );

    res.json({
      id: bookingId,
      status: 'confirmed',
      message: 'Booking confirmed successfully'
    });

  } catch (err) {
    console.error('Booking confirmation error:', err);
    res.status(500).json({ 
      error: 'Failed to confirm booking',
      details: err.message
    });
  }
});

// POST /api/bookings/:bookingId/cancel-unpaid
router.post('/:bookingId/cancel-unpaid', async (req, res) => {
  const { bookingId } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify booking exists and is unpaid
    const [booking] = await connection.execute(
      'SELECT id, status FROM booking WHERE id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking[0].status !== 'unpaid') {
      await connection.rollback();
      return res.status(400).json({ error: 'Only unpaid bookings can be cancelled. Current status: ' + booking[0].status });
    }

    // Update booking status to cancelled
    await connection.execute(
      'UPDATE booking SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );

    // Unmark all slots as booked
    await connection.execute(`
      UPDATE field_slot 
      SET is_booked = 0 
      WHERE id IN (
        SELECT slot_id FROM booking_slot WHERE booking_id = ?
      )
    `, [bookingId]);

    // Update associated payment to failed
    await connection.execute(
      'UPDATE payment SET status = ? WHERE booking_id = ?',
      ['failed', bookingId]
    );

    await connection.commit();

    res.json({
      id: bookingId,
      status: 'cancelled',
      message: 'Unpaid booking cancelled successfully. Slots have been released.'
    });

  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    console.error('Cancel unpaid booking error:', err);
    res.status(500).json({ 
      error: 'Failed to cancel booking',
      details: err.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/bookings/:bookingId/cancel
router.post('/:bookingId/cancel', async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Verify booking exists
    const [booking] = await db.execute(
      'SELECT id, status FROM booking WHERE id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update booking status to cancelled
    await db.execute(
      'UPDATE booking SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );

    // Unmark slots as booked
    await db.execute(`
      UPDATE field_slot 
      SET is_booked = 0 
      WHERE id IN (
        SELECT slot_id FROM booking_slot WHERE booking_id = ?
      )
    `, [bookingId]);

    res.json({
      id: bookingId,
      status: 'cancelled',
      message: 'Booking cancelled successfully'
    });

  } catch (err) {
    console.error('Booking cancellation error:', err);
    res.status(500).json({ 
      error: 'Failed to cancel booking',
      details: err.message
    });
  }
});

// GET /api/user/:userId/bookings
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [bookings] = await db.execute(`
      SELECT 
        b.id,
        MAX(p.id) as payment_id,
        b.user_id,
        b.booking_date,
        b.status,
        b.total_amount,
        f.id as field_id,
        f.name as field_name,
        f.category,
        f.image_url,
        f.address,
        f.city,
        GROUP_CONCAT(CONCAT(fs.start_time, ' - ', fs.end_time) SEPARATOR ', ') as time_slots
      FROM booking b
      LEFT JOIN payment p ON p.booking_id = b.id
      JOIN booking_slot bs ON b.id = bs.booking_id
      JOIN field_slot fs ON bs.slot_id = fs.id
      JOIN field f ON fs.field_id = f.id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.booking_date DESC
    `, [userId]);

    res.json(bookings);

  } catch (err) {
    console.error('Fetch user bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/admin/:adminId/performance
router.get('/admin/:adminId/performance', async (req, res) => {
  const { adminId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT DATE(fs.start_time) AS slot_date, COUNT(DISTINCT fs.id) AS booked_slots
      FROM field_slot fs
      JOIN field f ON fs.field_id = f.id
      JOIN booking_slot bs ON bs.slot_id = fs.id
      JOIN booking b ON b.id = bs.booking_id
      WHERE f.admin_id = ?
        AND fs.is_booked = 1
        AND b.status = 'confirmed'
        AND DATE(fs.start_time) BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                                  AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)
      GROUP BY DATE(fs.start_time)
      ORDER BY slot_date ASC
      `,
      [adminId]
    );

    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() - mondayOffset);

    const weeklyDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return formatDateLocal(date);
    });

    const countByDate = rows.reduce((acc, row) => {
      const key = formatDateLocal(new Date(row.slot_date));
      acc[key] = Number(row.booked_slots) || 0;
      return acc;
    }, {});

    const daily = weeklyDates.map((date, index) => ({
      label: dayLabels[index],
      date,
      bookedSlots: countByDate[date] || 0,
    }));

    res.json({
      weekStart: weeklyDates[0],
      weekEnd: weeklyDates[6],
      daily,
    });
  } catch (err) {
    console.error('Fetch admin weekly performance error:', err);
    res.status(500).json({
      error: 'Failed to fetch weekly performance',
      details: err.message,
    });
  }
});

// GET /api/bookings/admin/:adminId/revenue
router.get('/admin/:adminId/revenue', async (req, res) => {
  const { adminId } = req.params;

  try {
    const [fields] = await db.execute(
      `
      SELECT id, name
      FROM field
      WHERE admin_id = ?
      ORDER BY is_active DESC, created_at DESC
      `,
      [adminId]
    );

    let totalRevenue = 0;
    const venues = [];

    for (const field of fields) {
      const revenue = await getConfirmedRevenueForField(field.id);
      totalRevenue += revenue;

      venues.push({
        id: field.id,
        name: field.name,
        revenue,
      });
    }

    const revenueByVenue = venues.map((venue) => ({
      ...venue,
      percentage: totalRevenue > 0 ? Number(((venue.revenue / totalRevenue) * 100).toFixed(2)) : 0,
    }));

    res.json({
      totalRevenue,
      venues: revenueByVenue,
    });
  } catch (err) {
    console.error('Fetch admin revenue error:', err);
    res.status(500).json({
      error: 'Failed to fetch revenue',
      details: err.message,
    });
  }
});

// GET /api/bookings/admin/:adminId
router.get('/admin/:adminId', async (req, res) => {
  const { adminId } = req.params;

  try {
    const [bookings] = await db.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.booking_date,
        b.status,
        b.total_amount,
        f.id as field_id,
        f.name as field_name,
        u.name as user_name,
        u.email as user_email,
        u.number as user_phone,
        GROUP_CONCAT(CONCAT(fs.start_time, ' - ', fs.end_time) SEPARATOR ', ') as time_slots
      FROM booking b
      JOIN booking_slot bs ON b.id = bs.booking_id
      JOIN field_slot fs ON bs.slot_id = fs.id
      JOIN field f ON fs.field_id = f.id
      JOIN user u ON b.user_id = u.id
      WHERE f.admin_id = ?
        AND b.status IN ('pending', 'confirmed', 'cancelled')
      GROUP BY b.id
      ORDER BY b.booking_date DESC
    `, [adminId]);

    res.json(bookings);

  } catch (err) {
    console.error('Fetch admin bookings error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: err.message
    });
  }
});

// GET /api/bookings/payment/:paymentId
router.get('/payment/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  try {
    console.log('Fetching payment with ID:', paymentId);
    
    // First check if payment exists
    const [payment] = await db.execute(
      'SELECT id, booking_id, amount, status, transaction_time FROM payment WHERE id = ?',
      [paymentId]
    );

    console.log('Payment query result:', payment);

    if (!payment || payment.length === 0) {
      console.log('Payment not found in database');
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Then get booking details
    const [booking] = await db.execute(
      'SELECT id, status, total_amount FROM booking WHERE id = ?',
      [payment[0].booking_id]
    );

    console.log('Booking query result:', booking);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: 'Associated booking not found' });
    }

    res.json({
      id: payment[0].id,
      booking_id: payment[0].booking_id,
      amount: payment[0].amount,
      status: payment[0].status,
      transaction_time: payment[0].transaction_time,
      booking_status: booking[0].status,
      total_amount: booking[0].total_amount
    });

  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch payment',
      details: err.message
    });
  }
});

// POST /api/bookings/payment/:paymentId/confirm
router.post('/payment/:paymentId/confirm', async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Get payment and booking details
    const [payment] = await db.execute(`
      SELECT p.id, p.booking_id, p.status, b.id as booking_id, b.status as booking_status
      FROM payment p
      JOIN booking b ON p.booking_id = b.id
      WHERE p.id = ?
    `, [paymentId]);

    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment[0].status !== 'unpaid') {
      return res.status(400).json({ error: 'Payment is not in unpaid status' });
    }

    const bookingId = payment[0].booking_id;

    // Update payment status to 'paid'
    await db.execute(
      'UPDATE payment SET status = ? WHERE id = ?',
      ['paid', paymentId]
    );

    // Update booking status to 'pending'
    await db.execute(
      'UPDATE booking SET status = ? WHERE id = ?',
      ['pending', bookingId]
    );

    res.json({
      paymentId,
      bookingId,
      status: 'paid',
      bookingStatus: 'pending',
      message: 'Payment confirmed successfully'
    });

  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      details: err.message
    });
  }
});

// POST /api/bookings/payment/:paymentId/fail
router.post('/payment/:paymentId/fail', async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Get payment and booking details
    const [payment] = await db.execute(`
      SELECT p.id, p.booking_id, p.status, b.id as booking_id, b.status as booking_status
      FROM payment p
      JOIN booking b ON p.booking_id = b.id
      WHERE p.id = ?
    `, [paymentId]);

    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment[0].status !== 'unpaid') {
      return res.status(400).json({ error: 'Payment is not in unpaid status' });
    }

    const bookingId = payment[0].booking_id;

    // Update payment status to 'failed'
    await db.execute(
      'UPDATE payment SET status = ? WHERE id = ?',
      ['failed', paymentId]
    );

    // Update booking status to 'failed'
    await db.execute(
      'UPDATE booking SET status = ? WHERE id = ?',
      ['failed', bookingId]
    );

    // Unmark slots as booked
    await db.execute(`
      UPDATE field_slot 
      SET is_booked = 0 
      WHERE id IN (
        SELECT slot_id FROM booking_slot WHERE booking_id = ?
      )
    `, [bookingId]);

    res.json({
      paymentId,
      bookingId,
      status: 'failed',
      bookingStatus: 'failed',
      message: 'Payment marked as failed'
    });

  } catch (err) {
    console.error('Payment failure mark error:', err);
    res.status(500).json({ 
      error: 'Failed to mark payment as failed',
      details: err.message
    });
  }
});


// GET /api/bookings/:bookingId
router.get('/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    const [bookingData] = await db.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.booking_date,
        b.status,
        b.total_amount,
        f.id as field_id,
        f.name as field_name
      FROM booking b
      JOIN booking_slot bs ON b.id = bs.booking_id
      JOIN field_slot fs ON bs.slot_id = fs.id
      JOIN field f ON fs.field_id = f.id
      WHERE b.id = ?
      LIMIT 1
    `, [bookingId]);

    if (bookingData.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get all slots for this booking
    const [slots] = await db.execute(`
      SELECT fs.id, fs.start_time, fs.end_time, fs.price
      FROM booking_slot bs
      JOIN field_slot fs ON bs.slot_id = fs.id
      WHERE bs.booking_id = ?
      ORDER BY fs.start_time ASC
    `, [bookingId]);

    res.json({
      ...bookingData[0],
      slots
    });

  } catch (err) {
    console.error('Fetch booking error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch booking',
      details: err.message
    });
  }
});

module.exports = router;
