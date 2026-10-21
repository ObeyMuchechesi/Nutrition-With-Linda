const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('node:crypto');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const ADMIN_SESSION_COOKIE = 'nutrition_admin_session';
const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;
const HARARE_UTC_OFFSET_MS = 2 * 60 * 60 * 1000;
const loginFailures = new Map();

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 32 },
  date: { type: Date, required: true },
  status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
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

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !password || password.length < 12 || !sessionSecret || sessionSecret.length < 32) return null;
  return { email, password, sessionSecret };
}

function constantTimeTextEqual(left, right) {
  const leftDigest = crypto.createHash('sha256').update(String(left)).digest();
  const rightDigest = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function signAdminSession(payload, secret) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyAdminSession(token, config) {
  if (!token || typeof token !== 'string') return false;
  const [encodedPayload, providedSignature, extra] = token.split('.');
  if (!encodedPayload || !providedSignature || extra) return false;

  const expectedSignature = crypto.createHmac('sha256', config.sessionSecret).update(encodedPayload).digest('base64url');
  if (!constantTimeTextEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.sub === config.email && Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function getAdminSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie ? cookie.slice(ADMIN_SESSION_COOKIE.length + 1) : '';
}

function setAdminCookie(res, token, maxAge = ADMIN_SESSION_MAX_AGE) {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

function adminAuth(req, res, next) {
  const config = getAdminConfig();
  if (!config) return res.status(503).json({ message: 'Admin access is not configured.' });
  if (!verifyAdminSession(getAdminSession(req), config)) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function rateLimitAdminLogin(req, res, next) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
  const entry = loginFailures.get(email);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  if (entry && now - entry.startedAt >= windowMs) loginFailures.delete(email);
  const current = loginFailures.get(email);
  if (current && current.count >= 10) {
    return res.status(429).json({ message: 'Too many sign-in attempts. Please try again in 15 minutes.' });
  }
  req.adminLoginKey = email;
  next();
}

function recordAdminLoginFailure(key) {
  if (!key) return;
  const now = Date.now();
  const current = loginFailures.get(key);
  if (!current || now - current.startedAt >= 15 * 60 * 1000) {
    loginFailures.set(key, { count: 1, startedAt: now });
  } else {
    current.count += 1;
  }

  if (loginFailures.size > 1000) {
    for (const [entryKey, entry] of loginFailures) {
      if (now - entry.startedAt >= 15 * 60 * 1000) loginFailures.delete(entryKey);
    }
  }
}

function harareDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Harare',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, Number(value)]));
}

function harareMonthStart(date, monthOffset = 0) {
  const { year, month } = harareDateParts(date);
  return new Date(Date.UTC(year, month - 1 + monthOffset, 1) - HARARE_UTC_OFFSET_MS);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bookingStatusFilter(status) {
  if (status === 'pending') {
    return { $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }] };
  }
  return { status };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/admin/status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const config = getAdminConfig();
  return res.json({
    configured: Boolean(config),
    authenticated: Boolean(config && verifyAdminSession(getAdminSession(req), config)),
  });
});

app.post('/api/admin/login', rateLimitAdminLogin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const config = getAdminConfig();
  if (!config) return res.status(503).json({ message: 'Admin access is not configured.' });

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!constantTimeTextEqual(email, config.email) || !constantTimeTextEqual(password, config.password)) {
    recordAdminLoginFailure(req.adminLoginKey);
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  loginFailures.delete(req.adminLoginKey);
  const now = Math.floor(Date.now() / 1000);
  const token = signAdminSession({ sub: config.email, iat: now, exp: now + ADMIN_SESSION_MAX_AGE }, config.sessionSecret);
  setAdminCookie(res, token);
  return res.json({ success: true });
});

app.post('/api/admin/logout', (_req, res) => {
  setAdminCookie(res, '', 0);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
});

app.get('/api/admin/overview', adminAuth, async (_req, res) => {
  try {
    await connectToDatabase();
    const now = new Date();
    const todayParts = harareDateParts(now);
    const today = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day) - HARARE_UTC_OFFSET_MS);
    const monthStart = harareMonthStart(now);
    const trendStart = harareMonthStart(now, -5);
    const activeRequestStatus = { $or: [{ status: { $in: ['pending', 'confirmed'] } }, { status: { $exists: false } }, { status: null }] };

    const [totalRequests, pendingRequests, upcomingConsultations, thisMonthRequests, monthlyCounts] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments(bookingStatusFilter('pending')),
      Booking.countDocuments({ date: { $gte: today }, ...activeRequestStatus }),
      Booking.countDocuments({ createdAt: { $gte: monthStart } }),
      Booking.aggregate([
        { $match: { createdAt: { $gte: trendStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Africa/Harare' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const countsByMonth = new Map(monthlyCounts.map(({ _id, count }) => [_id, count]));
    const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
      const monthDate = harareMonthStart(now, index - 5);
      const monthKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Harare', year: 'numeric', month: '2-digit' }).format(monthDate);
      return {
        month: new Intl.DateTimeFormat('en', { timeZone: 'Africa/Harare', month: 'short' }).format(monthDate),
        count: countsByMonth.get(monthKey) || 0,
      };
    });

    return res.json({ totalRequests, pendingRequests, upcomingConsultations, thisMonthRequests, monthlyTrend });
  } catch (error) {
    console.error('Unable to load admin overview:', error.message);
    return res.status(503).json({ message: 'The dashboard is temporarily unavailable.' });
  }
});

app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  const requestedStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 100000);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);

  if (requestedStatus !== 'all' && !BOOKING_STATUSES.includes(requestedStatus)) {
    return res.status(400).json({ message: 'Choose a valid booking status.' });
  }

  try {
    await connectToDatabase();
    const conditions = [];
    if (requestedStatus !== 'all') conditions.push(bookingStatusFilter(requestedStatus));
    if (search) {
      const term = new RegExp(escapeRegex(search), 'i');
      conditions.push({ $or: [{ name: term }, { email: term }, { phone: term }] });
    }
    const filter = conditions.length ? { $and: conditions } : {};
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .select('name email phone date createdAt status')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return res.json({ bookings, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Unable to load admin bookings:', error.message);
    return res.status(503).json({ message: 'Bookings are temporarily unavailable.' });
  }
});

app.patch('/api/admin/bookings/:id/status', adminAuth, async (req, res) => {
  const { id } = req.params;
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Choose a valid booking.' });
  if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ message: 'Choose a valid booking status.' });

  try {
    await connectToDatabase();
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .select('name email phone date createdAt status')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    return res.json({ booking });
  } catch (error) {
    console.error('Unable to update booking status:', error.message);
    return res.status(503).json({ message: 'The booking could not be updated right now.' });
  }
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
