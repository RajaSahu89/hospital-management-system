const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const PATIENT_VIEW = `
  SELECT p.*, u.name, u.email, u.phone
  FROM patients p JOIN users u ON u.id = p.user_id
`;

// Staff can list all patients; a patient can only ever resolve their own record via /me
router.get('/', authorize('admin', 'doctor', 'receptionist'), (req, res) => {
  const rows = db.prepare(`${PATIENT_VIEW} ORDER BY u.name`).all();
  res.json({ patients: rows });
});

router.get('/me', authorize('patient'), (req, res) => {
  const row = db.prepare(`${PATIENT_VIEW} WHERE p.user_id = ?`).get(req.user.id);
  if (!row) return res.status(404).json({ error: 'Patient profile not found.' });
  res.json({ patient: row });
});

router.get('/:id', authorize('admin', 'doctor', 'receptionist'), (req, res) => {
  const row = db.prepare(`${PATIENT_VIEW} WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ patient: row });
});

router.put('/:id', authorize('admin', 'receptionist', 'patient'), (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own profile.' });
  }

  const fields = ['date_of_birth', 'gender', 'blood_group', 'address', 'emergency_contact', 'allergies', 'chronic_conditions'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE patients SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const updated = db.prepare(`${PATIENT_VIEW} WHERE p.id = ?`).get(req.params.id);
  res.json({ patient: updated });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(patient.user_id); // cascades to patients row
  res.json({ success: true });
});

module.exports = router;
