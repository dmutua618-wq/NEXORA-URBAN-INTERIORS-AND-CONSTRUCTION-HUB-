const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4173;
const dataFile = path.join(__dirname, 'admin', 'data', 'accounts.json');

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE !== 'false',
  service: process.env.EMAIL_SERVICE || ((process.env.EMAIL_HOST || '').includes('gmail') ? 'gmail' : undefined),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

async function ensureDataFile(){
  try{
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.access(dataFile);
  }catch(e){
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
}

async function loadUsers(){
  await ensureDataFile();
  const content = await fs.readFile(dataFile, 'utf8');
  try{
    return JSON.parse(content || '[]');
  }catch(e){
    return [];
  }
}

async function saveUsers(users){
  await fs.writeFile(dataFile, JSON.stringify(users, null, 2), 'utf8');
}

function genSalt(){
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt){
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

const isProduction = process.env.NODE_ENV === 'production';
const requestedJwtSecret = process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim();
const hasPlaceholderSecret = !requestedJwtSecret || /change_me|demo|placeholder/i.test(requestedJwtSecret);
const JWT_SECRET = hasPlaceholderSecret
  ? (isProduction ? null : crypto.randomBytes(32).toString('hex'))
  : requestedJwtSecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ALLOW_RESET_FALLBACK = process.env.ALLOW_RESET_FALLBACK === 'true' && !isProduction;

if(!JWT_SECRET){
  console.error('JWT_SECRET must be set to a non-placeholder value in production.');
  process.exit(1);
}

if(hasPlaceholderSecret && !isProduction){
  console.warn('JWT_SECRET was missing or placeholder; using a generated development secret. Set JWT_SECRET for stable auth.');
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const uploadDir = path.join(__dirname, 'uploads', 'gallery');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try{
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    }catch(err){ cb(err); }
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if(!file.mimetype.startsWith('image/')){
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  }
});

function authMiddleware(req, res, next){
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : null;
  if(!token){
    return res.status(401).json({ message: 'Missing authorization token.' });
  }

  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  }catch(e){
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function adminTokenFromUser(user){
  return jwt.sign({ sub: user.email, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


app.get('/api/registration-status', async (req, res) => {
  const users = await loadUsers();
  res.json({ open: users.length < 2 });
});

// Basic JWT verification endpoint (optional for UI)
app.get('/api/me', authMiddleware, async (req, res) => {
  res.json({ user: { name: req.auth.name, email: req.auth.email } });
});


app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if(!name || !email || !password){
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const users = await loadUsers();
  const normalized = String(email).trim().toLowerCase();
  const parts = normalized.split('@');
  if(parts.length !== 2 || parts[1] !== 'gmail.com'){
    return res.status(400).json({ message: 'Registration requires a Gmail address (example@gmail.com).' });
  }
  const existingUser = users.find(user => user.email === normalized);
  if (existingUser) {
    if (existingUser.confirmed) {
      return res.status(409).json({ message: 'An account already exists with that email.' });
    }

    // Reuse the pending account by refreshing password and confirmation information.
    existingUser.name = String(name).trim();
    const salt = genSalt();
    existingUser.passwordHash = hashPassword(password, salt);
    existingUser.salt = salt;
    existingUser.confirmed = false;
    existingUser.confirmationCode = String(Math.floor(100000 + Math.random() * 900000));
    existingUser.confirmationExpires = Date.now() + (15 * 60 * 1000);
    existingUser.updatedAt = new Date().toISOString();
    await saveUsers(users);

    try {
      const transporter = nodemailer.createTransport(emailConfig);
      const from = process.env.EMAIL_FROM || emailConfig.auth.user;
      await transporter.sendMail({
        from,
        to: existingUser.email,
        subject: 'Nexora Admin Confirmation Code',
        text: `Your Nexora admin confirmation code is: ${existingUser.confirmationCode}`,
        html: `<p>Your Nexora admin confirmation code is:</p><p><strong>${existingUser.confirmationCode}</strong></p><p>This code expires in 15 minutes.</p>`
      });
      return res.json({ status: 'pending' });
    } catch (err) {
      console.warn('Failed to send confirmation email:', err.message);
      return res.status(500).json({ message: 'Failed to send confirmation email.' });
    }
  }

  if(users.length >= 2){
    return res.status(403).json({ message: 'Access denied. Administrator registration is limited to two admin accounts.' });
  }
  const salt = genSalt();
  const passwordHash = hashPassword(password, salt);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + (15 * 60 * 1000);

  const user = {
    name: String(name).trim(),
    email: normalized,
    passwordHash,
    salt,
    confirmed: false,
    confirmationCode: code,
    confirmationExpires: expires,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await saveUsers(users);

  // send confirmation email
  try{
    const transporter = nodemailer.createTransport(emailConfig);
    const from = process.env.EMAIL_FROM || emailConfig.auth.user;
    await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Nexora Admin Confirmation Code',
      text: `Your Nexora admin confirmation code is: ${code}`,
      html: `<p>Your Nexora admin confirmation code is:</p><p><strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
    });
    return res.json({ status: 'pending' });
  }catch(err){
    console.warn('Failed to send confirmation email:', err.message);
    // in case of failure, still return pending so admin can confirm via other means
    return res.status(500).json({ message: 'Failed to send confirmation email.' });
  }
});


app.post('/api/confirm', async (req, res) => {
  const { email, code } = req.body || {};
  if(!email || !code) return res.status(400).json({ message: 'Email and code are required.' });
  const users = await loadUsers();
  const normalized = String(email).trim().toLowerCase();
  const user = users.find(u => u.email === normalized);
  if(!user) return res.status(404).json({ message: 'Account not found.' });
  if(!user.confirmationCode || !user.confirmationExpires) return res.status(400).json({ message: 'No confirmation pending for this account.' });
  if(String(user.confirmationCode) !== String(code)) return res.status(400).json({ message: 'Invalid confirmation code.' });
  if(Date.now() > Number(user.confirmationExpires)) return res.status(400).json({ message: 'Confirmation code expired.' });

  user.confirmed = true;
  delete user.confirmationCode;
  delete user.confirmationExpires;
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  const token = adminTokenFromUser(user);
  res.json({ token, user: { name: user.name, email: user.email } });
});



// ===== Admin CRUD (JSON file persistence) =====

async function ensureJsonFile(filePath){
  try{
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.access(filePath);
  }catch(e){
    await fs.writeFile(filePath, '[]', 'utf8');
  }
}

async function getJsonData(filePath){
  try{
    await ensureJsonFile(filePath);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content || '[]');
  }catch(e){
    console.warn(`Failed to read JSON data from ${filePath}:`, e.message);
    return [];
  }
}

function setJsonData(filePath, data){
  return fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function jsonId(){
  return crypto.randomBytes(12).toString('hex');
}

function adminListRoute(resource, filePath){
  app.get(`/api/admin/${resource}`, authMiddleware, async (req, res) => {
    const list = await getJsonData(filePath);
    res.json({ items: list });
  });
}

function adminCreateRoute(resource, filePath){
  app.post(`/api/admin/${resource}`, authMiddleware, async (req, res) => {
    const body = req.body || {};
    const items = await getJsonData(filePath);
    const now = new Date().toISOString();
    const item = { id: jsonId(), createdAt: now, updatedAt: now, ...body };
    items.push(item);
    await setJsonData(filePath, items);
    res.json({ item });
  });
}

function adminUpdateRoute(resource, filePath){
  app.put(`/api/admin/${resource}/:id`, authMiddleware, async (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};

    const items = await getJsonData(filePath);

    const idx = items.findIndex(x => x.id === id);
    if(idx === -1) return res.status(404).json({ message: 'Not found.' });
    items[idx] = { ...items[idx], ...updates, id: items[idx].id, updatedAt: new Date().toISOString() };
    await setJsonData(filePath, items);
    res.json({ item: items[idx] });
  });
}

function adminDeleteRoute(resource, filePath){
  app.delete(`/api/admin/${resource}/:id`, authMiddleware, async (req, res) => {
    const { id } = req.params;
    const items = await getJsonData(filePath);
    const next = items.filter(x => x.id !== id);
    if(next.length === items.length) return res.status(404).json({ message: 'Not found.' });
    await setJsonData(filePath, next);
    res.json({ ok: true });
  });
}

function adminObjectRoute(resource, filePath){
  app.get(`/api/admin/${resource}`, authMiddleware, async (req, res) => {
    const data = await getJsonData(filePath);
    res.json({ item: data || {} });
  });

  app.put(`/api/admin/${resource}`, authMiddleware, async (req, res) => {
    const payload = req.body || {};
    await setJsonData(filePath, payload);
    res.json({ item: payload });
  });
}

const projectsFile = path.join(__dirname, 'admin', 'data', 'projects.json');
const servicesFile = path.join(__dirname, 'admin', 'data', 'services.json');
const galleryFile = path.join(__dirname, 'admin', 'data', 'gallery.json');
const usersFile = path.join(__dirname, 'admin', 'data', 'users.json');
const profileFile = path.join(__dirname, 'admin', 'data', 'profile.json');
const settingsFile = path.join(__dirname, 'admin', 'data', 'settings.json');
const quotationsFile = path.join(__dirname, 'admin', 'data', 'quotations.json');
const blogFile = path.join(__dirname, 'admin', 'data', 'blog.json');
const testimonialsFile = path.join(__dirname, 'admin', 'data', 'testimonials.json');
const requirementsFile = path.join(__dirname, 'admin', 'data', 'requirements.json');

adminListRoute('projects', projectsFile);
adminCreateRoute('projects', projectsFile);
adminUpdateRoute('projects', projectsFile);
adminDeleteRoute('projects', projectsFile);

adminListRoute('services', servicesFile);
adminCreateRoute('services', servicesFile);
adminUpdateRoute('services', servicesFile);
adminDeleteRoute('services', servicesFile);

adminListRoute('gallery', galleryFile);
adminCreateRoute('gallery', galleryFile);
adminUpdateRoute('gallery', galleryFile);
adminDeleteRoute('gallery', galleryFile);

adminListRoute('users', usersFile);
adminCreateRoute('users', usersFile);
adminUpdateRoute('users', usersFile);
adminDeleteRoute('users', usersFile);

adminListRoute('quotations', quotationsFile);
adminCreateRoute('quotations', quotationsFile);
adminUpdateRoute('quotations', quotationsFile);
adminDeleteRoute('quotations', quotationsFile);

adminListRoute('blog', blogFile);
adminCreateRoute('blog', blogFile);
adminUpdateRoute('blog', blogFile);
adminDeleteRoute('blog', blogFile);

adminListRoute('testimonials', testimonialsFile);
adminCreateRoute('testimonials', testimonialsFile);
adminUpdateRoute('testimonials', testimonialsFile);
adminDeleteRoute('testimonials', testimonialsFile);

adminListRoute('requirements', requirementsFile);
adminCreateRoute('requirements', requirementsFile);
adminUpdateRoute('requirements', requirementsFile);
adminDeleteRoute('requirements', requirementsFile);

adminObjectRoute('profile', profileFile);
adminObjectRoute('settings', settingsFile);

app.get('/api/services', async (req, res) => {
  const items = await getJsonData(servicesFile);
  res.json({ items });
});

app.get('/api/gallery', async (req, res) => {
  const items = await getJsonData(galleryFile);
  res.json({ items });
});

app.post('/api/admin/gallery/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const publicUrl = `/uploads/gallery/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: publicUrl });
});

app.post('/api/admin/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const publicUrl = `/uploads/gallery/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: publicUrl });
});

app.post('/api/admin/gallery/bulk-delete', authMiddleware, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if(!ids.length) return res.status(400).json({ message: 'No ids provided.' });
  const items = await getJsonData(galleryFile);
  const next = items.filter(x => !ids.includes(x.id));
  if(next.length === items.length) return res.status(404).json({ message: 'No items deleted.' });
  await setJsonData(galleryFile, next);
  res.json({ ok: true, deleted: items.length - next.length });
});

app.post('/api/login', async (req, res) => { 
  const { email, password } = req.body || {};
  if(!email || !password){
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const users = await loadUsers();
  const normalized = String(email).trim().toLowerCase();
  const user = users.find(u => u.email === normalized);
  if(!user){
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const hash = hashPassword(password, user.salt);
  if(hash !== user.passwordHash){
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = adminTokenFromUser(user);
  res.json({ token, user: { name: user.name, email: user.email } });
});


// ===== Password reset endpoints =====
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if(!email) return res.status(400).json({ message: 'Email is required.' });

  const users = await loadUsers();
  const normalized = String(email).trim().toLowerCase();
  const user = users.find(u => u.email === normalized);
  if(!user) return res.status(404).json({ message: 'No account found for that email.' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
  user.resetCode = code;
  user.resetExpires = expires;
  await saveUsers(users);

  // Try to send email, but allow developer fallback in non-production
  if(!emailConfig.auth.user || !emailConfig.auth.pass){
    if(ALLOW_RESET_FALLBACK){
      return res.json({ ok: true, fallback: true, code });
    }
    return res.status(500).json({ message: 'Email not configured. Contact the system administrator to reset your password.' });
  }

  try{
    const transporter = nodemailer.createTransport(emailConfig);
    const from = process.env.EMAIL_FROM || emailConfig.auth.user;
    await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Nexora Password Reset Code',
      text: `Your password reset code is: ${code}`,
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
    });
    return res.json({ ok: true });
  }catch(err){
    console.warn('Failed to send reset email:', err.message);
    if(ALLOW_RESET_FALLBACK) return res.json({ ok: true, fallback: true, code });
    return res.status(500).json({ message: 'Failed to send reset email. Contact the system administrator.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if(!email || !code || !newPassword) return res.status(400).json({ message: 'Email, code, and newPassword are required.' });

  const users = await loadUsers();
  const normalized = String(email).trim().toLowerCase();
  const user = users.find(u => u.email === normalized);
  if(!user) return res.status(404).json({ message: 'No account found for that email.' });

  if(!user.resetCode || !user.resetExpires) return res.status(400).json({ message: 'No reset request found for this account.' });
  if(String(user.resetCode) !== String(code)) return res.status(400).json({ message: 'Invalid reset code.' });
  if(Date.now() > Number(user.resetExpires)) return res.status(400).json({ message: 'Reset code has expired.' });

  const salt = genSalt();
  const passwordHash = hashPassword(newPassword, salt);
  user.salt = salt;
  user.passwordHash = passwordHash;
  delete user.resetCode;
  delete user.resetExpires;
  user.updatedAt = new Date().toISOString();

  await saveUsers(users);
  const token = adminTokenFromUser(user);
  res.json({ token, user: { name: user.name, email: user.email } });
});


// Diagnostic endpoint: verify SMTP credentials and connectivity
app.post('/api/test-smtp', async (req, res) => {
  try{
    if(!emailConfig.auth.user || !emailConfig.auth.pass){
      return res.status(400).json({ ok: false, message: 'EMAIL_USER or EMAIL_PASS not set in environment.' });
    }
    const transporter = nodemailer.createTransport(emailConfig);
    await transporter.verify();
    return res.json({ ok: true, message: 'SMTP verified' });
  }catch(err){
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ============================================================
// ADMIN API ENDPOINTS
// ============================================================

// Get current user profile
app.get('/api/admin/profile', authMiddleware, async (req, res) => {
  try{
    const userId = req.user?.id;
    const users = await loadUsers();
    const user = users.find(u => u.id === userId);
    if(!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      item: {
        id: user.id,
        name: user.name || 'Administrator',
        email: user.email,
        phone: user.phone || '',
        position: user.position || 'Super Admin',
        role: user.role || 'Super Admin',
        photoUrl: user.photoUrl || '/assets/nexora-logo.jpeg',
        lastLogin: user.lastLogin || new Date().toISOString(),
        location: 'Nairobi, Kenya',
        timezone: 'EAT',
        activity: adminData.activity || []
      }
    });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
app.put('/api/admin/profile', authMiddleware, async (req, res) => {
  try{
    const userId = req.user?.id;
    const users = await loadUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if(userIdx < 0) return res.status(404).json({ message: 'User not found.' });
    users[userIdx] = {
      ...users[userIdx],
      name: req.body.name || users[userIdx].name,
      phone: req.body.phone || users[userIdx].phone,
      position: req.body.position || users[userIdx].position,
      photoUrl: req.body.photoUrl || users[userIdx].photoUrl
    };
    await saveUsers(users);
    res.json({ message: 'Profile updated.' });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

// Dashboard summary
app.get('/api/admin/dashboard-summary', authMiddleware, async (req, res) => {
  const projectsFile = path.join(__dirname, 'admin', 'data', 'projects.json');
  const servicesFile = path.join(__dirname, 'admin', 'data', 'services.json');
  const quotationsFile = path.join(__dirname, 'admin', 'data', 'quotations.json');
  const galleryFile = path.join(__dirname, 'admin', 'data', 'gallery.json');
  
  try{
    let projects = 0, services = 0, quotations = 0, gallery = 0;
    try{ projects = (JSON.parse(await fs.readFile(projectsFile, 'utf8')) || []).length; }catch(e){}
    try{ services = (JSON.parse(await fs.readFile(servicesFile, 'utf8')) || []).length; }catch(e){}
    try{ quotations = (JSON.parse(await fs.readFile(quotationsFile, 'utf8')) || []).filter(q => q.status === 'Pending').length; }catch(e){}
    try{ gallery = (JSON.parse(await fs.readFile(galleryFile, 'utf8')) || []).length; }catch(e){}
    
    res.json({
      projects,
      services,
      gallery,
      quotations
    });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

// Admin endpoints for CRUD data management (simplified in-memory fallback)
const adminData = {
  projects: [],
  services: [],
  gallery: [],
  users: [],
  blog: [],
  quotations: [],
  testimonials: [],
  requirements: [],
  messages: [],
  settings: {},
  activity: []
};

// Load data from files on startup
async function loadAdminData(){
  const dataDir = path.join(__dirname, 'admin', 'data');
  const files = ['projects.json', 'services.json', 'gallery.json', 'users.json', 'blog.json', 'quotations.json', 'testimonials.json', 'requirements.json', 'messages.json', 'settings.json'];
  for(const file of files){
    try{
      const data = await fs.readFile(path.join(dataDir, file), 'utf8');
      const key = file.replace('.json', '');
      adminData[key] = JSON.parse(data || '[]');
    }catch(e){ }
  }
}
loadAdminData();

// Generic CRUD endpoint wrapper
function createCrudEndpoints(model) {
  const basePath = `/api/admin/${model}`;
  
  app.get(basePath, authMiddleware, (req, res) => {
    res.json({ items: adminData[model] || [] });
  });
  
  app.post(basePath, authMiddleware, (req, res) => {
    const item = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() };
    adminData[model] = adminData[model] || [];
    adminData[model].push(item);
    res.json({ item, message: `${model} created.` });
  });
  
  app.get(`${basePath}/:id`, authMiddleware, (req, res) => {
    const item = (adminData[model] || []).find(i => i.id === req.params.id);
    if(!item) return res.status(404).json({ message: 'Not found.' });
    res.json({ item });
  });
  
  app.put(`${basePath}/:id`, authMiddleware, (req, res) => {
    const idx = (adminData[model] || []).findIndex(i => i.id === req.params.id);
    if(idx < 0) return res.status(404).json({ message: 'Not found.' });
    adminData[model][idx] = { ...adminData[model][idx], ...req.body };
    res.json({ item: adminData[model][idx], message: `${model} updated.` });
  });
  
  app.delete(`${basePath}/:id`, authMiddleware, (req, res) => {
    adminData[model] = (adminData[model] || []).filter(i => i.id !== req.params.id);
    res.json({ message: `${model} deleted.` });
  });
}

// Create CRUD endpoints for all admin models
['projects', 'services', 'gallery', 'users', 'blog', 'quotations', 'testimonials', 'requirements', 'messages'].forEach(model => {
  createCrudEndpoints(model);
});

// Settings endpoint
app.get('/api/admin/settings', authMiddleware, (req, res) => {
  res.json({ item: adminData.settings || {} });
});

app.put('/api/admin/settings', authMiddleware, (req, res) => {
  adminData.settings = req.body;
  res.json({ message: 'Settings updated.' });
});

// Activity log endpoint
app.get('/api/admin/activity', authMiddleware, (req, res) => {
  const activities = adminData.activity || [];
  res.json({ items: activities });
});

async function loadJsonFile(fileName) {
  const filePath = path.join(__dirname, 'admin', 'data', fileName);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    return [];
  }
}

function buildTrendSeries(days, records) {
  const series = [];
  const today = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    const count = records.filter(item => {
      const itemDate = new Date(item.createdAt || item.requestedAt || item.receivedAt || item.updatedAt || item.date || '');
      if (!Number.isFinite(itemDate.getTime())) return false;
      return `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}-${itemDate.getDate()}` === key;
    }).length;

    series.push({
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: count
    });
  }

  return series;
}

// Analytics endpoint
app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  const days = Number(req.query.days) || 7;

  try {
    const [projects, services, gallery, blog, testimonials, quotations, requirements, messages, users] = await Promise.all([
      loadJsonFile('projects.json'),
      loadJsonFile('services.json'),
      loadJsonFile('gallery.json'),
      loadJsonFile('blog.json'),
      loadJsonFile('testimonials.json'),
      loadJsonFile('quotations.json'),
      loadJsonFile('requirements.json'),
      loadJsonFile('messages.json'),
      loadJsonFile('users.json')
    ]);

    const contentCount = projects.length + services.length + gallery.length + blog.length + testimonials.length;
    const openFollowUps = quotations.filter(item => item.status === 'Pending' || item.status === 'Open').length
      + requirements.filter(item => item.status === 'Open' || item.status === 'In Review').length
      + messages.filter(item => item.status === 'Unread').length;
    const inquiries = quotations.length + requirements.length + messages.length;
    const visitors = Math.max(contentCount + inquiries, 1);
    const conversion = visitors > 0 ? Number(((inquiries / visitors) * 100).toFixed(1)) : 0;

    const inquiryEvents = [
      ...quotations.map(item => ({ ...item, createdAt: item.createdAt || item.requestedAt || item.receivedAt || item.updatedAt || item.date })),
      ...requirements.map(item => ({ ...item, createdAt: item.requestedAt || item.createdAt || item.updatedAt || item.date })),
      ...messages.map(item => ({ ...item, createdAt: item.receivedAt || item.createdAt || item.updatedAt || item.date }))
    ];

    const sections = [
      { name: 'Projects', count: projects.length },
      { name: 'Services', count: services.length },
      { name: 'Gallery', count: gallery.length },
      { name: 'Blog', count: blog.length },
      { name: 'Testimonials', count: testimonials.length }
    ];
    const topSection = sections.slice().sort((a, b) => b.count - a.count)[0] || { name: 'Content', count: 0 };

    res.json({
      visitors,
      leads: inquiries,
      conversion,
      trends: buildTrendSeries(days, inquiryEvents),
      breakdown: [
        { title: 'Public Content', value: `${contentCount}`, description: 'Projects, services, gallery, blog and testimonials currently available.' },
        { title: 'Open Follow-ups', value: `${openFollowUps}`, description: 'Pending quotations, open requirements and unread messages.' },
        { title: 'Top Section', value: topSection.name, description: `${topSection.count} items currently published.` }
      ],
      summary: {
        users: users.length,
        contentCount,
        inquiries,
        openFollowUps
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Unable to build analytics.' });
  }
});

app.listen(PORT, () => {
  console.log(`Nexora server running on http://localhost:${PORT}`);
});
