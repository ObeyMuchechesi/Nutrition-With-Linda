const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 32 },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
let connectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      dbName: 'nutrition_db',
      serverSelectionTimeoutMS: 8000,
    });
  }

  try {
    await connectionPromise;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/bookings', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const dateValue = typeof req.body?.date === 'string' ? req.body.date.trim() : '';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? new Date(`${dateValue}T00:00:00.000Z`) : null;

  if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254 || phone.length < 6 || phone.length > 32 || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Please provide a valid name, email, phone number, and preferred date.' });
  }

  try {
    await connectToDatabase();
    await Booking.create({ name, email, phone, date: parsedDate });
    return res.status(201).json({ success: true, message: 'Booking request received.' });
  } catch (error) {
    console.error('Unable to save booking request:', error.message);
    return res.status(503).json({ success: false, message: 'Booking requests are temporarily unavailable. Please call 078 490 9690.' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error.message);
  res.status(500).json({ success: false, message: 'Something went wrong.' });
});

module.exports = app;
