const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const RX_VIEW = `
  SELECT rx.*,
    pu.name AS patient_name,
    du.name AS doctor_name
  FROM prescriptions rx
  JOIN patients p ON p.id = rx.patient_id JOIN users pu ON pu.id = p.user_id
  JOIN doctors d ON d.id = rx.doctor_id JOIN users du ON du.id = d.user_id
`;

function currentPatientId(userId) {
  const p = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
  return p ? p.id : null;
}
function currentDoctorId(userId) {
  const d = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId);
  return d ? d.id : null;
}

router.get('/', (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'admin' || role === 'receptionist') {
    rows = db.prepare(`${RX_VIEW} ORDER BY rx.issued_date DESC`).all();
  } else if (role === 'doctor') {
    rows = db.prepare(`${RX_VIEW} WHERE rx.doctor_id = ? ORDER BY rx.issued_date DESC`).all(currentDoctorId(id));
  } else {
    rows = db.prepare(`${RX_VIEW} WHERE rx.patient_id = ? ORDER BY rx.issued_date DESC`).all(currentPatientId(id));
  }
  res.json({ prescriptions: rows });
});

// Only doctors write prescriptions. medicines: [{ name, dosage, frequency, duration }]
router.post('/', authorize('doctor'), (req, res) => {
  const { patient_id, appointment_id, medicines, instructions } = req.body;
  const doctor_id = currentDoctorId(req.user.id);

  if (!patient_id || !medicines) {
    return res.status(400).json({ error: 'patient_id and medicines are required.' });
  }

  const rxId = uuidv4();
  db.prepare(
    `INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, medicines, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).run(rxId, patient_id, doctor_id, appointment_id || null, JSON.stringify(medicines), instructions || null);

  const rx = db.prepare(`${RX_VIEW} WHERE rx.id = ?`).get(rxId);
  res.status(201).json({ prescription: rx });
});

router.put('/:id/status', authorize('doctor', 'admin'), (req, res) => {
  const { status } = req.body;
  const allowed = ['active', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}.` });
  }
  const rx = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found.' });

  if (req.user.role === 'doctor' && currentDoctorId(req.user.id) !== rx.doctor_id) {
    return res.status(403).json({ error: 'You can only update your own prescriptions.' });
  }

  db.prepare('UPDATE prescriptions SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare(`${RX_VIEW} WHERE rx.id = ?`).get(req.params.id);
  res.json({ prescription: updated });
});

module.exports = router;
