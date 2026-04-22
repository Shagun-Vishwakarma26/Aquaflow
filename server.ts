import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const db = new Database('aquaflow.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    address TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    driverId INTEGER,
    isPaid INTEGER DEFAULT 0,
    paymentId TEXT,
    rating INTEGER,
    comment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (driverId) REFERENCES users (id)
  );
`);

// Migration: Add missing columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(bookings)").all() as any[];
const columns = tableInfo.map(info => info.name);

if (!columns.includes('isPaid')) {
  db.exec('ALTER TABLE bookings ADD COLUMN isPaid INTEGER DEFAULT 0');
}
if (!columns.includes('paymentId')) {
  db.exec('ALTER TABLE bookings ADD COLUMN paymentId TEXT');
}
if (!columns.includes('rating')) {
  db.exec('ALTER TABLE bookings ADD COLUMN rating INTEGER');
}
if (!columns.includes('comment')) {
  db.exec('ALTER TABLE bookings ADD COLUMN comment TEXT');
}

const JWT_SECRET = process.env.JWT_SECRET || 'aquaflow_secret_key';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Middleware for auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
      const info = stmt.run(name, email, hashedPassword, role || 'user');
      res.status(201).json({ id: info.lastInsertRowid, name, email, role });
    } catch (err) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Booking Routes
  app.post('/api/bookings', authenticateToken, (req: any, res) => {
    const { address, date, quantity } = req.body;
    const stmt = db.prepare('INSERT INTO bookings (userId, address, date, quantity) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.user.id, address, date, quantity);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.get('/api/bookings', authenticateToken, (req: any, res) => {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = db.prepare(`
        SELECT b.*, u.name as userName, d.name as driverName 
        FROM bookings b 
        JOIN users u ON b.userId = u.id 
        LEFT JOIN users d ON b.driverId = d.id
        ORDER BY b.createdAt DESC
      `).all();
    } else if (req.user.role === 'driver') {
      bookings = db.prepare('SELECT * FROM bookings WHERE driverId = ? ORDER BY createdAt DESC').all(req.user.id);
    } else {
      bookings = db.prepare('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
    }
    res.json(bookings);
  });

  app.get('/api/bookings/:id', authenticateToken, (req: any, res) => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json(booking);
  });

  // Payment simulated route
  app.post('/api/bookings/:id/pay', authenticateToken, (req: any, res) => {
    const { paymentMethod } = req.body; // e.g., 'card', 'upi'
    const paymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
    const stmt = db.prepare('UPDATE bookings SET isPaid = 1, paymentId = ? WHERE id = ?');
    stmt.run(paymentId, req.params.id);
    res.json({ success: true, paymentId });
  });

  // Feedback route
  app.post('/api/bookings/:id/feedback', authenticateToken, (req: any, res) => {
    const { rating, comment } = req.body;
    const stmt = db.prepare('UPDATE bookings SET rating = ?, comment = ? WHERE id = ?');
    stmt.run(rating, comment, req.params.id);
    res.json({ success: true });
  });

  // Tracker simulated API
  app.get('/api/bookings/:id/track', authenticateToken, (req: any, res) => {
    // Generate simulated coordinates based on time
    const booking: any = db.prepare('SELECT status, createdAt FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    
    // Simple mock logic: progress from 0 to 1 over 5 mins
    const startTime = new Date(booking.createdAt).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / (5 * 60 * 1000), 1); // 0 to 1

    // Simulated coordinates (roughly Pune area)
    const startCoord = { lat: 18.5204, lng: 73.8567 };
    const endCoord = { lat: 18.5679, lng: 73.9143 };
    
    const currentPos = {
      lat: startCoord.lat + (endCoord.lat - startCoord.lat) * progress,
      lng: startCoord.lng + (endCoord.lng - startCoord.lng) * progress
    };

    res.json({
      status: booking.status,
      currentPos,
      progress: progress * 100,
      estimatedTime: Math.max(0, 5 - (elapsed / 60000)).toFixed(1) + ' mins'
    });
  });

  // Admin Routes
  app.patch('/api/admin/bookings/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { status, driverId } = req.body;
    const stmt = db.prepare('UPDATE bookings SET status = ?, driverId = ? WHERE id = ?');
    stmt.run(status, driverId, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/drivers', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const drivers = db.prepare("SELECT id, name FROM users WHERE role = 'driver'").all();
    res.json(drivers);
  });

  // Driver Routes
  app.patch('/api/driver/bookings/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
    const { status } = req.body;
    const stmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ? AND driverId = ?');
    stmt.run(status, req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
