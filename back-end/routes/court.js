const express = require('express');
const db = require('../config/database');

const router = express.Router();

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

const formatDateTimeToLocalSql = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  const hour = String(dateValue.getHours()).padStart(2, '0');
  const minute = String(dateValue.getMinutes()).padStart(2, '0');
  const second = String(dateValue.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// Get all courts for a field
router.get('/:fieldId', async (req, res) => {
  const { fieldId } = req.params;
  try {
    const [courts] = await db.execute(
      'SELECT id, field_id, name FROM court WHERE field_id = ? ORDER BY name ASC',
      [fieldId]
    );
    res.json(courts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

// Create a new court for a field
router.post('/:fieldId', async (req, res) => {
  const { fieldId } = req.params;
  const { adminId, name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Court name is required' });
  }

  try {
    // Verify field belongs to admin
    const [field] = await db.execute('SELECT id FROM field WHERE id = ? AND admin_id = ?', [fieldId, adminId]);
    if (field.length === 0) {
      return res.status(403).json({ error: 'Not authorized to modify this field' });
    }

    const [result] = await db.execute(
      'INSERT INTO court (field_id, name) VALUES (?, ?)',
      [fieldId, name]
    );

    res.status(201).json({ id: result.insertId, field_id: fieldId, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create court' });
  }
});

// Delete a court
router.delete('/:fieldId/:courtId', async (req, res) => {
  const { fieldId, courtId } = req.params;
  const { adminId } = req.body;

  try {
    // Verify field belongs to admin
    const [field] = await db.execute('SELECT id FROM field WHERE id = ? AND admin_id = ?', [fieldId, adminId]);
    if (field.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete court (cascade will delete related slots)
    const [result] = await db.execute(
      'DELETE FROM court WHERE id = ? AND field_id = ?',
      [courtId, fieldId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Court not found' });
    }

    res.json({ message: 'Court deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete court' });
  }
});

// Generate hourly slots for a court based on schedule
router.post('/:fieldId/generate-slots', async (req, res) => {
  const { fieldId } = req.params;
  const { adminId, courtId, courtName, openingTime, closingTime, price, startDate, duration, durationType, daysOfWeek } = req.body;

  if (!courtId || !openingTime || !closingTime || !price || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const todayInAppTimezone = getTodayInAppTimezone();
  if (startDate < todayInAppTimezone) {
    return res.status(400).json({ error: 'startDate must be today or a future date' });
  }

  try {
    // Verify field belongs to admin
    const [field] = await db.execute('SELECT id FROM field WHERE id = ? AND admin_id = ?', [fieldId, adminId]);
    if (field.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Parse times
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    // Generate all dates to create slots for
    const baseDate = new Date(startDate);
    baseDate.setHours(0, 0, 0, 0);
    
    const datesForSlots = [];
    const endDate = new Date(baseDate);
    
    if (durationType === 'specific') {
      // Just one date
      datesForSlots.push(new Date(baseDate));
    } else if (durationType === 'weekly') {
      // Repeat for N days, only on selected days of week
      endDate.setDate(baseDate.getDate() + duration);
      
      for (let d = new Date(baseDate); d < endDate; d.setDate(d.getDate() + 1)) {
        if (daysOfWeek.includes(d.getDay())) {
          datesForSlots.push(new Date(d));
        }
      }
    }

    // For each date, create hourly slots
    let slotsCreated = 0;
    let duplicatesSkipped = 0;
    const attemptedStarts = new Set();

    for (const date of datesForSlots) {
      const currentTime = new Date(date);
      currentTime.setHours(openHour, openMin, 0, 0);

      const closeDateTime = new Date(date);
      closeDateTime.setHours(closeHour, closeMin, 0, 0);

      while (currentTime < closeDateTime) {
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime);
        endTime.setHours(endTime.getHours() + 1);

        const startTimeSql = formatDateTimeToLocalSql(startTime);
        const endTimeSql = formatDateTimeToLocalSql(endTime);
        const uniqueSlotKey = `${fieldId}:${courtId}:${startTimeSql}`;

        if (attemptedStarts.has(uniqueSlotKey)) {
          duplicatesSkipped++;
          currentTime.setHours(currentTime.getHours() + 1);
          continue;
        }
        attemptedStarts.add(uniqueSlotKey);

        // Prevent duplicate slots for same field, court, date, and time regardless of price.
        const [existing] = await db.execute(
          'SELECT id FROM field_slot WHERE field_id = ? AND court_id = ? AND start_time = ? LIMIT 1',
          [fieldId, courtId, startTimeSql]
        );

        if (existing.length === 0) {
          await db.execute(
            'INSERT INTO field_slot (field_id, court_id, start_time, end_time, price, is_booked) VALUES (?, ?, ?, ?, ?, 0)',
            [fieldId, courtId, startTimeSql, endTimeSql, price]
          );
          slotsCreated++;
        } else {
          duplicatesSkipped++;
        }

        currentTime.setHours(currentTime.getHours() + 1);
      }
    }

    res.json({ message: 'Slots generated', count: slotsCreated, duplicatesSkipped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
});

// Create or update a schedule override for a specific date
router.post('/:fieldId/slots/override', async (req, res) => {
  const { fieldId } = req.params;
  const { adminId, courtId, overrideDate, openingTime, closingTime, price } = req.body;

  if (!courtId || !overrideDate || !openingTime || !closingTime || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify field belongs to admin
    const [field] = await db.execute('SELECT id FROM field WHERE id = ? AND admin_id = ?', [fieldId, adminId]);
    if (field.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Parse override times
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    const date = new Date(overrideDate);
    date.setHours(0, 0, 0, 0);

    // Delete existing slots for this court on this date
    await db.execute(
      `DELETE FROM field_slot 
       WHERE field_id = ? AND court_id = ? 
       AND DATE(start_time) = DATE(?)`,
      [fieldId, courtId, date]
    );

    // Create new slots with override schedule
    const currentTime = new Date(date);
    currentTime.setHours(openHour, openMin, 0, 0);

    const closeDateTime = new Date(date);
    closeDateTime.setHours(closeHour, closeMin, 0, 0);

    let slotsCreated = 0;
    while (currentTime < closeDateTime) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime);
      endTime.setHours(endTime.getHours() + 1);

      await db.execute(
        'INSERT INTO field_slot (field_id, court_id, start_time, end_time, price, is_booked) VALUES (?, ?, ?, ?, ?, 0)',
        [fieldId, courtId, startTime, endTime, price]
      );
      slotsCreated++;

      currentTime.setHours(currentTime.getHours() + 1);
    }

    res.json({ message: 'Schedule override applied', count: slotsCreated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply override' });
  }
});

module.exports = router;
