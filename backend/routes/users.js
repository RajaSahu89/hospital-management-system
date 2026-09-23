const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows });
});
router.post('/', (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const allowedRoles = ['admin', 'receptionist'];
  if (!name || !email || !password || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Name, email, password and a role in [${allowedRoles.join(', ')}] are required.` });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email, hashed, role, phone || null);

  const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ user });
});

router.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
