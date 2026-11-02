const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const methodOverride = require('method-override');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const produkRouter = require('./routes/produk');
const kategoriRouter = require('./routes/kategori');
const mahasiswaRouter = require('./routes/mahasiswa');
const mbgRouter = require('./routes/mbg');
const KIPKRouter = require('./routes/KIPK');
const apiProdukRouter = require('./routes/API/produk');
const apiKategoriRouter = require('./routes/API/kategori');

const loginRouter = require('./routes/auth/login');
const registerRouter = require('./routes/auth/register');
const otpRouter = require('./routes/auth/otp');
const apiWhatsappRouter = require('./routes/API/whatsapp');
const { sendWhatsAppMiddleware } = require('./config/middleware/sendWhatsApp');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'project01-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));
app.use(flash());
app.use(sendWhatsAppMiddleware);

// Health check endpoint for external monitoring / watchdog
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/produk', produkRouter);
app.use('/kategori', kategoriRouter);
app.use('/biodata', mahasiswaRouter);
app.use('/mbg', mbgRouter);
app.use('/KIPK', KIPKRouter);
app.use('/auth/login', loginRouter);
app.use('/auth/register', registerRouter);
app.use('/auth/otp', otpRouter);
app.use('/api/produk', apiProdukRouter);
app.use('/api/kategori', apiKategoriRouter);
app.use('/api/whatsapp', apiWhatsappRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;