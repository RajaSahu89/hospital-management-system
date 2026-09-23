const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const DOCTOR_VIEW = `
  SELECT d.*, u.name, u.email, u.phone
  FROM doctors d JOIN users u ON u.id = d.user_id
`;

// Public: anyone (including the landing page, pre-login) can browse doctors
router.get('/', (req, res) => {
  const rows = db.prepare(`${DOCTOR_VIEW} ORDER BY u.name`).all();
  res.json({ doctors: rows });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`${DOCTOR_VIEW} WHERE d.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Doctor not found.' });
  res.json({ doctor: row });
});

router.use(authenticate);

router.get('/profile/me', authorize('doctor'), (req, res) => {
  const row = db.prepare(`${DOCTOR_VIEW} WHERE d.user_id = ?`).get(req.user.id);
  if (!row) return res.status(404).json({ error: 'Doctor profile not found.' });
  res.json({ doctor: row });
});

// Admin creates a new doctor account (user + doctor profile together)
router.post('/', authorize('admin'), (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualification, experience_years,
    consultation_fee, department, available_days, available_time, bio,
  } = req.body;

  if (!name || !email || !password || !specialization) {
    return res.status(400).json({ error: 'Name, email, password and specialization are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const userId = uuidv4();
  const doctorId = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);

  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, name, email, hashed, 'doctor', phone || null);
    db.prepare(
      `INSERT INTO doctors (id, user_id, specialization, qualification, experience_years, consultation_fee, department, available_days, available_time, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      doctorId, userId, specialization, qualification || null, experience_years || 0,
      consultation_fee || 0, department || specialization, available_days || null, available_time || null, bio || null
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const doctor = db.prepare(`${DOCTOR_VIEW} WHERE d.id = ?`).get(doctorId);
  res.status(201).json({ doctor });
});

router.put('/:id', authorize('admin', 'doctor'), (req, res) => {
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });

  if (req.user.role === 'doctor' && doctor.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own profile.' });
  }

  const fields = ['specialization', 'qualification', 'experience_years', 'consultation_fee', 'department', 'available_days', 'available_time', 'bio'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE doctors SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const updated = db.prepare(`${DOCTOR_VIEW} WHERE d.id = ?`).get(req.params.id);
  res.json({ doctor: updated });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(doctor.user_id); // cascades to doctors row
  res.json({ success: true });
});

module.exports = router;
