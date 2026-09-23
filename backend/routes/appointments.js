const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const APPT_VIEW = `
  SELECT a.*,
    pu.name AS patient_name, pu.phone AS patient_phone,
    du.name AS doctor_name, d.specialization AS doctor_specialization
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id JOIN users pu ON pu.id = p.user_id
  JOIN doctors d ON d.id = a.doctor_id JOIN users du ON du.id = d.user_id
`;

function currentPatientId(userId) {
  const p = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
  return p ? p.id : null;
}
function currentDoctorId(userId) {
  const d = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId);
  return d ? d.id : null;
}

// Role-scoped listing: admin/receptionist see all, doctors see their own, patients see their own
router.get('/', (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'admin' || role === 'receptionist') {
    rows = db.prepare(`${APPT_VIEW} ORDER BY a.appointment_date DESC, a.appointment_time DESC`).all();
  } else if (role === 'doctor') {
    const doctorId = currentDoctorId(id);
    rows = db.prepare(`${APPT_VIEW} WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`).all(doctorId);
  } else {
    const patientId = currentPatientId(id);
    rows = db.prepare(`${APPT_VIEW} WHERE a.patient_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`).all(patientId);
  }
  res.json({ appointments: rows });
});

// Patients book for themselves; admin/receptionist can book on behalf of any patient
router.post('/', (req, res) => {
  const { role, id } = req.user;
  let { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

  if (role === 'patient') {
    patient_id = currentPatientId(id);
  }

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'patient_id, doctor_id, appointment_date and appointment_time are required.' });
  }

  const apptId = uuidv4();
  db.prepare(
    `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`
  ).run(apptId, patient_id, doctor_id, appointment_date, appointment_time, reason || null);

  const appt = db.prepare(`${APPT_VIEW} WHERE a.id = ?`).get(apptId);
  res.status(201).json({ appointment: appt });
});

router.put('/:id/status', authorize('admin', 'doctor', 'receptionist'), (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}.` });
  }
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

  if (req.user.role === 'doctor' && currentDoctorId(req.user.id) !== appt.doctor_id) {
    return res.status(403).json({ error: 'You can only update your own appointments.' });
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare(`${APPT_VIEW} WHERE a.id = ?`).get(req.params.id);
  res.json({ appointment: updated });
});

router.put('/:id', (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

  const isOwnerPatient = req.user.role === 'patient' && currentPatientId(req.user.id) === appt.patient_id;
  const isStaff = ['admin', 'receptionist'].includes(req.user.role);
  if (!isOwnerPatient && !isStaff) {
    return res.status(403).json({ error: 'You do not have permission to modify this appointment.' });
  }

  const fields = ['appointment_date', 'appointment_time', 'reason', 'notes'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE appointments SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const updated = db.prepare(`${APPT_VIEW} WHERE a.id = ?`).get(req.params.id);
  res.json({ appointment: updated });
});

router.delete('/:id', authorize('admin', 'receptionist'), (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
