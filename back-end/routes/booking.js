const express = require('express');
const db = require('../config/database');

const router = express.Router();

// ============ CREATE BOOKING ============
// POST /api/bookings
router.post('/', async (req, res) => {
  const { userId, fieldId, selectedSlotIds } = req.body;

  // Validate input
  if (!userId || !fieldId || !selectedSlotIds || !Array.isArray(selectedSlotIds) || selectedSlotIds.length === 0) {
    return res.status(400).json({ 
      error: 'Missing or invalid required fields: userId, fieldId, selectedSlotIds (non-empty array)' 
    });
  }

  try {
    // Get slot details and prices
    const placeholders = selectedSlotIds.map(() => '?').join(',');
    const [slots] = await db.execute(
      `SELECT id, price, is_booked FROM field_slot WHERE id IN (${placeholders}) AND field_id = ?`,
      [...selectedSlotIds, fieldId]
    );

    // Check if all requested slots exist and belong to the field
    if (slots.length !== selectedSlotIds.length) {
      return res.status(400).json({ 
        error: 'One or more selected slots do not exist or do not belong to this field',
        requested: selectedSlotIds.length,
        found: slots.length
      });
    }

    // Check if any slot is already booked
    const bookedSlot = slots.find(s => s.is_booked === 1);
    if (bookedSlot) {
      return res.status(409).json({ error: 'One or more selected slots are already booked' });
    }

    // Calculate total amount
    const totalAmount = slots.reduce((sum, slot) => sum + parseFloat(slot.price), 0);

    // Step 1: Insert booking record into booking table
    const [bookingResult] = await db.execute(
      'INSERT INTO booking (user_id, status, total_amount) VALUES (?, ?, ?)',
      [userId, 'pending', totalAmount]
    );

    const bookingId = bookingResult.insertId;

    // Step 2: Insert entries into booking_slot for each slot
    for (const slotId of selectedSlotIds) {
      await db.execute(
        'INSERT INTO booking_slot (booking_id, slot_id) VALUES (?, ?)',
        [bookingId, slotId]
      );
    }

    // Step 3: Mark all slots as booked in field_slot table
    for (const slotId of selectedSlotIds) {
      await db.execute(
        'UPDATE field_slot SET is_booked = 1 WHERE id = ?',
        [slotId]
      );
    }

    // Return successful response
    res.status(201).json({
      id: bookingId,
      userId,
      fieldId,
      status: 'pending',
      totalAmount,
      selectedSlots: selectedSlotIds,
      message: 'Booking created successfully'
    });

  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: err.message
    });
  }
});

// ============ CONFIRM PAYMENT (Update booking status to confirmed) ============
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

// ============ CANCEL BOOKING ============
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


// ============ GET BOOKINGS FOR A USER ============
// GET /api/user/:userId/bookings
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

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
        f.category,
        f.image_url,
        f.address,
        f.city,
        GROUP_CONCAT(CONCAT(fs.start_time, ' - ', fs.end_time) SEPARATOR ', ') as time_slots
      FROM booking b
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

// ============ GET BOOKINGS FOR AN ADMIN (All their fields' bookings) ============
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

// ============ GET SINGLE BOOKING DETAILS ============
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
