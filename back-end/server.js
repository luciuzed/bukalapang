const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));