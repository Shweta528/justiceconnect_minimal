// backend/src/server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB   = require('./config/db');
const authRoutes  = require('./routes/auth');
const apiRoutes   = require('./routes/api');
const casesRoutes = require('./routes/cases.routes');
const adminMetricsRoutes = require('./routes/admin.metrics.routes');
const app = express();

// Connect DB
connectDB();

// Security headers (local assets only; no inline)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "script-src": ["'self'"],
    "style-src": ["'self'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "frame-ancestors": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  }
}));

// Logging + parsers
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS (harmless if frontend served by same app)
app.use(cors({ origin: true, credentials: true }));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// Normalize req.user from session (handles id vs _id)
app.use((req, _res, next) => {
  if (req.session && req.session.user) {
    req.user = { ...req.session.user };
    if (req.user.id && !req.user._id) req.user._id = req.user.id;
  }
  next();
});

// Static frontend + uploads
app.use('/', express.static(path.join(__dirname, '../../frontend/public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// APIs
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api', apiRoutes);
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes); 
const adminCasesRoutes = require('./routes/admin.cases');
app.use('/api/admin', adminCasesRoutes);
app.use('/api/admin', adminMetricsRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`JusticeConnect running at http://localhost:${port}`));
