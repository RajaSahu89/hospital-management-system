const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const RECORD_VIEW = `
  SELECT r.*, pu.name AS patient_name, du.name AS doctor_name
  FROM medical_records r
  JOIN patients p ON p.id = r.patient_id JOIN users pu ON pu.id = p.user_id
  LEFT JOIN doctors d ON d.id = r.doctor_id LEFT JOIN users du ON du.id = d.user_id
`;

function currentPatientId(userId) {
  const p = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
  return p ? p.id : null;
}
function currentDoctorId(userId) {
  const d = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId);
  return d ? d.id : null;
}

// Medical records are sensitive: patients see only their own, doctors/admin see all
router.get('/', (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'admin' || role === 'doctor') {
    rows = db.prepare(`${RECORD_VIEW} ORDER BY r.record_date DESC`).all();
  } else if (role === 'patient') {
    rows = db.prepare(`${RECORD_VIEW} WHERE r.patient_id = ? ORDER BY r.record_date DESC`).all(currentPatientId(id));
  } else {
    return res.status(403).json({ error: 'You do not have permission to view medical records.' });
  }
  res.json({ records: rows });
});

router.get('/patient/:patientId', authorize('admin', 'doctor'), (req, res) => {
  const rows = db.prepare(`${RECORD_VIEW} WHERE r.patient_id = ? ORDER BY r.record_date DESC`).all(req.params.patientId);
  res.json({ records: rows });
});

router.post('/', authorize('doctor', 'admin'), (req, res) => {
  const { patient_id, appointment_id, diagnosis, symptoms, treatment, vitals, notes } = req.body;
  if (!patient_id || !diagnosis) {
    return res.status(400).json({ error: 'patient_id and diagnosis are required.' });
  }
  const doctor_id = req.user.role === 'doctor' ? currentDoctorId(req.user.id) : (req.body.doctor_id || null);

  const recordId = uuidv4();
  db.prepare(
    `INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment, vitals, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(recordId, patient_id, doctor_id, appointment_id || null, diagnosis, symptoms || null, treatment || null, vitals || null, notes || null);

  const record = db.prepare(`${RECORD_VIEW} WHERE r.id = ?`).get(recordId);
  res.status(201).json({ record });
});

router.put('/:id', authorize('doctor', 'admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found.' });

  if (req.user.role === 'doctor' && currentDoctorId(req.user.id) !== record.doctor_id) {
    return res.status(403).json({ error: 'You can only edit records you authored.' });
  }

  const fields = ['diagnosis', 'symptoms', 'treatment', 'vitals', 'notes'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE medical_records SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const updated = db.prepare(`${RECORD_VIEW} WHERE r.id = ?`).get(req.params.id);
  res.json({ record: updated });
});

module.exports = router;
