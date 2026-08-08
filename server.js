const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ DATABASE SETUP ============
const db = new Database(path.join(__dirname, 'akelcargo.db'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tracking_number TEXT UNIQUE NOT NULL,
    description TEXT,
    weight REAL,
    sender_name TEXT,
    sender_phone TEXT,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    receiver_address TEXT,
    status TEXT DEFAULT 'received_china',
    current_location TEXT DEFAULT 'China (Yiwu)',
    price REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS package_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Default settings
const defaultSettings = {
  'company_name': 'Akel Cargo',
  'price_per_kg': '30',
  'delivery_days': '15-20',
  'telegram': '@akelcargo',
  'phone': '+992715555000',
  'address_china': 'KHMIR 15625450102 浙江省金华市义乌市 商城大道与柳青路交叉口东北220米洪华小区102栋2单元一楼',
  'address_tajikistan': 'Тоҷикистон',
  'whatsapp': '+992715555000'
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) {
  insertSetting.run(key, value);
}

// Create default admin
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (full_name, phone, login, password, role) VALUES (?, ?, ?, ?, ?)`)
    .run('Admin', '+992715555000', 'admin', hashedPassword, 'admin');
}

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'akelcargo-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
}

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
  try {
    const { full_name, phone, email, login, password } = req.body;
    
    if (!full_name || !phone || !login || !password) {
      return res.status(400).json({ error: 'Ҳамаи майдонҳои ҳатмӣ пур кунед' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(login);
    if (existing) {
      return res.status(400).json({ error: 'Ин логин аллакай вуҷуд дорад' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (full_name, phone, email, login, password) VALUES (?, ?, ?, ?, ?)'
    ).run(full_name, phone, email || null, login, hashedPassword);

    req.session.userId = result.lastInsertRowid;
    req.session.role = 'user';
    req.session.login = login;

    res.json({ success: true, message: 'Регистратсия муваффақ шуд!', role: 'user' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { login, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
    if (!user) {
      return res.status(400).json({ error: 'Логин ё парол нодуруст аст' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Ҳисоби шумо баста шудааст' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Логин ё парол нодуруст аст' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.login = user.login;

    res.json({ 
      success: true, 
      message: 'Воридшавӣ муваффақ шуд!',
      role: user.role,
      name: user.full_name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.userId) {
    const user = db.prepare('SELECT id, full_name, phone, email, login, role FROM users WHERE id = ?')
      .get(req.session.userId);
    res.json({ authenticated: true, user });
  } else {
    res.json({ authenticated: false });
  }
});

// ============ USER ROUTES ============
app.get('/api/user/packages', requireAuth, (req, res) => {
  const packages = db.prepare(`
    SELECT p.*, 
    (SELECT COUNT(*) FROM package_updates WHERE package_id = p.id) as updates_count
    FROM packages p WHERE p.user_id = ? ORDER BY p.created_at DESC
  `).all(req.session.userId);
  res.json(packages);
});

app.get('/api/user/messages', requireAuth, (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.json(messages);
});

app.post('/api/user/messages', requireAuth, (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = db.prepare('SELECT full_name, phone, email FROM users WHERE id = ?')
      .get(req.session.userId);
    
    db.prepare('INSERT INTO messages (user_id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.session.userId, user.full_name, user.email, user.phone, subject || '', message);

    res.json({ success: true, message: 'Паём фиристода шуд!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TRACKING ============
app.get('/api/tracking/:number', (req, res) => {
  const pkg = db.prepare(`
    SELECT p.*, u.full_name as user_name 
    FROM packages p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.tracking_number = ?
  `).get(req.params.number);

  if (!pkg) {
    return res.status(404).json({ error: 'Бор ёфт нашуд' });
  }

  const updates = db.prepare('SELECT * FROM package_updates WHERE package_id = ? ORDER BY created_at DESC')
    .all(pkg.id);

  res.json({ package: pkg, updates });
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user').count;
  const totalPackages = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
  const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get().count;
  
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM packages GROUP BY status
  `).all();

  const recentPackages = db.prepare(`
    SELECT p.*, u.full_name as user_name 
    FROM packages p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC LIMIT 10
  `).all();

  const recentMessages = db.prepare(`
    SELECT m.*, u.full_name as user_name 
    FROM messages m 
    LEFT JOIN users u ON m.user_id = u.id 
    ORDER BY m.created_at DESC LIMIT 5
  `).all();

  res.json({
    totalUsers,
    totalPackages,
    totalMessages,
    unreadMessages,
    statusCounts,
    recentPackages,
    recentMessages
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
    (SELECT COUNT(*) FROM packages WHERE user_id = u.id) as package_count
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    const { full_name, phone, email, role, status } = req.body;
    db.prepare('UPDATE users SET full_name=?, phone=?, email=?, role=?, status=? WHERE id=?')
      .run(full_name, phone, email, role, status, req.params.id);
    res.json({ success: true, message: 'Корбар нав карда шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(req.params.id, 'admin');
    res.json({ success: true, message: 'Корбар нест карда шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/packages', requireAdmin, (req, res) => {
  const packages = db.prepare(`
    SELECT p.*, u.full_name as user_name, u.phone as user_phone
    FROM packages p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(packages);
});

app.post('/api/admin/packages', requireAdmin, (req, res) => {
  try {
    const { user_id, tracking_number, description, weight, sender_name, sender_phone,
            receiver_name, receiver_phone, receiver_address, status, price, notes, estimated_delivery } = req.body;

    const tracking = tracking_number || 'AC' + Date.now().toString(36).toUpperCase();
    const estDelivery = estimated_delivery || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO packages (user_id, tracking_number, description, weight, sender_name, sender_phone,
        receiver_name, receiver_phone, receiver_address, status, price, notes, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, tracking, description, weight, sender_name, sender_phone,
           receiver_name, receiver_phone, receiver_address, status || 'received_china', price || 0, notes, estDelivery);

    db.prepare('INSERT INTO package_updates (package_id, status, location, description) VALUES (?, ?, ?, ?)')
      .run(result.lastInsertRowid, status || 'received_china', 'China (Yiwu)', 'Бор қабул карда шуд');

    res.json({ success: true, message: 'Бор илова шуд', tracking_number: tracking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/packages/:id', requireAdmin, (req, res) => {
  try {
    const { status, current_location, price, notes, description, weight, 
            receiver_name, receiver_phone, receiver_address, estimated_delivery } = req.body;

    db.prepare(`
      UPDATE packages SET status=?, current_location=?, price=?, notes=?, description=?, weight=?,
        receiver_name=?, receiver_phone=?, receiver_address=?, estimated_delivery=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(status, current_location, price, notes, description, weight,
           receiver_name, receiver_phone, receiver_address, estimated_delivery, req.params.id);

    res.json({ success: true, message: 'Бор нав карда шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/packages/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM package_updates WHERE package_id = ?').run(req.params.id);
    db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Бор нест карда шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/packages/bulk', requireAdmin, (req, res) => {
  try {
    const { user_id, tracking_numbers, description, weight, status, price, 
            receiver_name, receiver_phone, receiver_address, notes, estimated_delivery } = req.body;

    if (!user_id || !tracking_numbers || !Array.isArray(tracking_numbers) || tracking_numbers.length === 0) {
      return res.status(400).json({ error: 'Муштарӣ ва рақами трекинг ҳатмист' });
    }

    if (!receiver_name || !receiver_phone) {
      return res.status(400).json({ error: 'Ном ва телефони гиранда ҳатмист' });
    }

    const estDelivery = estimated_delivery || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const packageStatus = status || 'received_china';
    const results = [];
    const errors = [];

    const insertPkg = db.prepare(`
      INSERT INTO packages (user_id, tracking_number, description, weight, receiver_name, receiver_phone, 
        receiver_address, status, price, notes, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUpdate = db.prepare(`
      INSERT INTO package_updates (package_id, status, location, description) VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const tracking of tracking_numbers) {
        const trimmedTracking = tracking.trim();
        if (!trimmedTracking) continue;

        const existing = db.prepare('SELECT id FROM packages WHERE tracking_number = ?').get(trimmedTracking);
        if (existing) {
          errors.push({ tracking: trimmedTracking, error: 'Аллакай вуҷуд дорад' });
          continue;
        }

        try {
          const result = insertPkg.run(
            user_id, trimmedTracking, description || null, weight || null,
            receiver_name, receiver_phone, receiver_address || null,
            packageStatus, price || 0, notes || null, estDelivery
          );

          insertUpdate.run(result.lastInsertRowid, packageStatus, 'China (Yiwu)', 'Бор қабул карда шуд');
          results.push({ tracking: trimmedTracking, id: result.lastInsertRowid });
        } catch (err) {
          errors.push({ tracking: trimmedTracking, error: err.message });
        }
      }
    });

    transaction();

    res.json({ 
      success: true, 
      message: `${results.length} бор илова шуд`,
      added: results,
      errors: errors,
      total: results.length,
      failed: errors.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/packages/:id/updates', requireAdmin, (req, res) => {
  try {
    const { status, location, description } = req.body;
    
    db.prepare('INSERT INTO package_updates (package_id, status, location, description) VALUES (?, ?, ?, ?)')
      .run(req.params.id, status, location, description);

    db.prepare('UPDATE packages SET status=?, current_location=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(status, location, req.params.id);

    res.json({ success: true, message: 'Навсозӣ илова шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/packages/:id/updates', requireAdmin, (req, res) => {
  const updates = db.prepare('SELECT * FROM package_updates WHERE package_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json(updates);
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.full_name as user_name, u.phone as user_phone
    FROM messages m 
    LEFT JOIN users u ON m.user_id = u.id 
    ORDER BY m.created_at DESC
  `).all();
  res.json(messages);
});

app.put('/api/admin/messages/:id/read', requireAdmin, (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/messages/:id/reply', requireAdmin, (req, res) => {
  try {
    const { reply } = req.body;
    db.prepare('UPDATE messages SET reply = ?, is_read = 1 WHERE id = ?').run(reply, req.params.id);
    res.json({ success: true, message: 'Ҷавоб фиристода шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);
  res.json(settingsObj);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(req.body)) {
      upsert.run(key, value);
    }
    res.json({ success: true, message: 'Танзимот нав карда шуд' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);
  res.json(settingsObj);
});

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    db.prepare('INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, phone, subject, message);
    res.json({ success: true, message: 'Паём фиристода шуд!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HTML ROUTES ============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html')));
app.get('/tracking', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'tracking.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'contact.html')));

// ============ START SERVER ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Akel Cargo server running on http://0.0.0.0:${PORT}`);
  console.log(`📦 Admin login: admin / admin123`);
});
