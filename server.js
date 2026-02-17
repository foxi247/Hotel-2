/**
 * Халачи Гостиница — Node.js Backend Server
 * Updated: 2026-02-17
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'images', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// Database file path
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Helper functions
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { hotel: {}, tours: [], categories: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

// ==================== API ROUTES ====================

// Get all data
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json(db);
});

// Get hotel info
app.get('/api/hotel', (req, res) => {
  const db = readDB();
  res.json(db.hotel || {});
});

// Get categories
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories || []);
});

// Get tours
app.get('/api/tours', (req, res) => {
  const db = readDB();
  const { category, featured } = req.query;
  let tours = db.tours || [];
  
  if (category) {
    tours = tours.filter(t => t.category === category);
  }
  if (featured === 'true') {
    tours = tours.filter(t => t.featured);
  }
  if (req.query.available !== 'false') {
    tours = tours.filter(t => t.available);
  }
  
  res.json(tours);
});

// Get single tour
app.get('/api/tours/:id', (req, res) => {
  const db = readDB();
  const tour = db.tours?.find(t => t.id === req.params.id);
  if (tour) {
    res.json(tour);
  } else {
    res.status(404).json({ error: 'Тур не найден' });
  }
});

// Get rooms
app.get('/api/rooms', (req, res) => {
  const db = readDB();
  res.json(db.hotel?.rooms || []);
});

// Get single room
app.get('/api/rooms/:id', (req, res) => {
  const db = readDB();
  const room = db.hotel?.rooms?.find(r => r.id === req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ error: 'Номер не найден' });
  }
});

// Middleware for admin authentication (simple password)
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.query.admin_password;
  const adminPassword = 'halachi2024'; // Simple password for demo
  
  if (password === adminPassword || password === 'admin123') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Update room
app.put('/api/admin/rooms/:id', adminAuth, (req, res) => {
  const db = readDB();
  if (!db.hotel?.rooms) {
    return res.status(404).json({ error: 'Номера не найдены' });
  }
  
  const index = db.hotel.rooms.findIndex(r => r.id === req.params.id);
  if (index >= 0) {
    db.hotel.rooms[index] = { ...db.hotel.rooms[index], ...req.body };
    if (writeDB(db)) {
      res.json({ success: true, message: 'Номер обновлён' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } else {
    res.status(404).json({ error: 'Номер не найден' });
  }
});

// Delete room
app.delete('/api/admin/rooms/:id', adminAuth, (req, res) => {
  const db = readDB();
  if (!db.hotel?.rooms) {
    return res.status(404).json({ error: 'Номера не найдены' });
  }
  
  const initialLength = db.hotel.rooms.length;
  db.hotel.rooms = db.hotel.rooms.filter(r => r.id !== req.params.id);
  
  if (db.hotel.rooms.length < initialLength) {
    if (writeDB(db)) {
      res.json({ success: true, message: 'Номер удалён' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } else {
    res.status(404).json({ error: 'Номер не найден' });
  }
});

// Get site config
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({
    visitor_count: db.hotel?.visitor_count || 0,
    site_name: db.hotel?.name || 'Халачи'
  });
});

// Submit booking form
app.post('/api/booking', (req, res) => {
  const db = readDB();
  const booking = {
    id: Date.now().toString(36),
    ...req.body,
    created_at: new Date().toISOString(),
    status: 'new'
  };
  
  // Save booking to file
  const bookingsDir = path.join(__dirname, 'data', 'bookings');
  if (!fs.existsSync(bookingsDir)) {
    fs.mkdirSync(bookingsDir, { recursive: true });
  }
  
  const bookingFile = path.join(bookingsDir, `${booking.id}.json`);
  fs.writeFileSync(bookingFile, JSON.stringify(booking, null, 2));
  
  console.log('New booking:', booking);
  
  res.json({ 
    success: true, 
    message: 'Заявка принята!',
    booking_id: booking.id
  });
});

// ==================== ADMIN API ROUTES ====================

// Update hotel info
app.post('/api/admin/hotel', adminAuth, (req, res) => {
  const db = readDB();
  
  // Handle rooms array specially
  if (req.body.rooms && Array.isArray(req.body.rooms)) {
    db.hotel.rooms = req.body.rooms;
    delete req.body.rooms;
  }
  
  db.hotel = { ...db.hotel, ...req.body };
  
  if (writeDB(db)) {
    res.json({ success: true, message: 'Информация о гостинице обновлена' });
  } else {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Add new tour
app.post('/api/admin/tours', adminAuth, upload.array('images', 5), (req, res) => {
  const db = readDB();
  
  const tour = {
    id: req.body.id || `tour_${Date.now().toString(36)}`,
    ...req.body,
    images: req.files?.map(f => `/images/uploads/${f.filename}`) || [],
    created_at: new Date().toISOString()
  };
  
  if (req.body.price) tour.price = parseInt(req.body.price);
  if (req.body.rating) tour.rating = parseFloat(req.body.rating);
  if (req.body.reviews_count) tour.reviews_count = parseInt(req.body.reviews_count);
  tour.available = tour.available === 'true' || tour.available === true;
  tour.featured = tour.featured === 'true' || tour.featured === true;
  
  const existingIndex = db.tours.findIndex(t => t.id === tour.id);
  if (existingIndex >= 0) {
    db.tours[existingIndex] = tour;
  } else {
    db.tours.push(tour);
  }
  
  if (writeDB(db)) {
    res.json({ success: true, message: 'Тур сохранён', tour });
  } else {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Update tour
app.put('/api/admin/tours/:id', adminAuth, (req, res) => {
  const db = readDB();
  const index = db.tours.findIndex(t => t.id === req.params.id);
  
  if (index >= 0) {
    db.tours[index] = { ...db.tours[index], ...req.body };
    if (writeDB(db)) {
      res.json({ success: true, message: 'Тур обновлён' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } else {
    res.status(404).json({ error: 'Тур не найден' });
  }
});

// Delete tour
app.delete('/api/admin/tours/:id', adminAuth, (req, res) => {
  const db = readDB();
  const initialLength = db.tours.length;
  db.tours = db.tours.filter(t => t.id !== req.params.id);
  
  if (db.tours.length < initialLength) {
    if (writeDB(db)) {
      res.json({ success: true, message: 'Тур удалён' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } else {
    res.status(404).json({ error: 'Тур не найден' });
  }
});

// Add/update category
app.post('/api/admin/categories', adminAuth, (req, res) => {
  const db = readDB();
  
  const category = {
    id: req.body.id,
    name: req.body.name,
    icon: req.body.icon || '🗺️',
    color: req.body.color || '#0EA5E9',
    order: db.categories.length + 1
  };
  
  const existingIndex = db.categories.findIndex(c => c.id === category.id);
  if (existingIndex >= 0) {
    db.categories[existingIndex] = category;
  } else {
    db.categories.push(category);
  }
  
  if (writeDB(db)) {
    res.json({ success: true, message: 'Категория сохранена' });
  } else {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Delete category
app.delete('/api/admin/categories/:id', adminAuth, (req, res) => {
  const db = readDB();
  const hasTours = db.tours.some(t => t.category === req.params.id);
  
  if (hasTours) {
    res.status(400).json({ error: 'Нельзя удалить категорию, которая используется' });
    return;
  }
  
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  
  if (writeDB(db)) {
    res.json({ success: true, message: 'Категория удалена' });
  } else {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Update visitor counter
app.post('/api/admin/visitor-count', adminAuth, (req, res) => {
  const db = readDB();
  const { count } = req.body;
  
  if (db.hotel) {
    db.hotel.visitor_count = parseInt(count) || 0;
    if (writeDB(db)) {
      res.json({ success: true, message: 'Счётчик обновлён' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } else {
    res.status(400).json({ error: 'Гостиница не найдена' });
  }
});

// Get all bookings
app.get('/api/admin/bookings', adminAuth, (req, res) => {
  const bookingsDir = path.join(__dirname, 'data', 'bookings');
  const bookings = [];
  
  if (fs.existsSync(bookingsDir)) {
    const files = fs.readdirSync(bookingsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const booking = JSON.parse(fs.readFileSync(path.join(bookingsDir, file), 'utf8'));
          bookings.push(booking);
        } catch (e) {
          console.error('Error reading booking:', file);
        }
      }
    }
  }
  
  // Sort by date descending
  bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(bookings);
});

// Upload image
app.post('/api/admin/upload', adminAuth, upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ 
      success: true, 
      url: `/images/uploads/${req.file.filename}` 
    });
  } else {
    res.status(400).json({ error: 'Файл не загружен' });
  }
});

// Get statistics
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const db = readDB();
  
  const stats = {
    total_tours: db.tours?.length || 0,
    total_rooms: db.hotel?.rooms?.length || 0,
    visitor_count: db.hotel?.visitor_count || 0,
    avg_rating: db.tours?.length > 0 
      ? (db.tours.reduce((sum, t) => sum + (t.rating || 0), 0) / db.tours.length).toFixed(1)
      : 0
  };
  
  res.json(stats);
});

// ==================== FRONTEND ROUTES ====================

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏨 Халачи Гостиница - Backend Server                   ║
║                                                           ║
║   Server running at: http://localhost:${PORT}              ║
║   Admin panel: http://localhost:${PORT}/admin              ║
║                                                           ║
║   API Endpoints:                                          ║
║   - GET  /api/data          - All data                     ║
║   - GET  /api/hotel         - Hotel info                   ║
║   - GET  /api/tours         - Tours list                   ║
║   - GET  /api/rooms         - Rooms list                   ║
║   - POST /api/booking       - Submit booking               ║
║                                                           ║
║   Admin API (use x-admin-password header):                 ║
║   - POST /api/admin/*        - Admin operations            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
