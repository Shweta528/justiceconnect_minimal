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

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const casesRoutes = require('./routes/cases.routes');
const adminMetricsRoutes = require('./routes/admin.metrics.routes');
const profileRoutes = require('./routes/profile.routes');
const adminRoutes = require('./routes/admin.routes');
const adminCasesRoutes = require('./routes/admin.cases');
const adminSnapshotRoutes = require('./routes/admin.snapshot');

const app = express();

// Connect database
connectDB();

// 🔥 FIXED CORS — MUST specify the real origin
app.use(cors({
  origin: "http://localhost:4000",
  credentials: true
}));

// 🔥 FIXED HELMET — allow scripts, styles & CDN
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": [
        "'self'",
        "http://localhost:4000",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "blob:",
        "data:"
      ],
      "style-src": ["'self'", "http://localhost:4000", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'", "http://localhost:4000"],
    }
  })
);

// Logging & parsing
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🔥 FIXED SESSION
app.use(
  session({
    secret: process.env.SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
      httpOnly: true,
      secure: false, // must be false on localhost
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// normalize req.user
app.use((req, res, next) => {
  if (req.session.user) {
    req.user = { ...req.session.user };
  }
  next();
});

// Static
app.use('/', express.static(path.join(__dirname, '../../frontend/public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCasesRoutes);
app.use('/api/admin', adminMetricsRoutes);
app.use('/api/admin', adminSnapshotRoutes);
app.use('/api', apiRoutes);
app.use('/api', profileRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`🔥 JusticeConnect running at http://localhost:${port}`)
);
