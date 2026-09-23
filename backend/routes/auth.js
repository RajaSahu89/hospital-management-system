const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}
router.post('/register', (req, res) => {
  const { name, email, password, phone, date_of_birth, gender, blood_group, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const userId = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertPatient = db.prepare(
    `INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  db.exec('BEGIN');
  try {
    insertUser.run(userId, name, email, hashed, 'patient', phone || null);
    insertPatient.run(uuidv4(), userId, date_of_birth || null, gender || null, blood_group || null, address || null);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken(user);
  res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: sanitizeUser(user) });
});

module.exports = router;
