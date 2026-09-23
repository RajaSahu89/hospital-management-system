const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function currentPatientId(userId) {
  const p = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
  return p ? p.id : null;
}
function currentDoctorId(userId) {
  const d = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId);
  return d ? d.id : null;
}

router.get('/stats', (req, res) => {
  const { role, id } = req.user;

  if (role === 'admin') {
    const totalPatients = db.prepare('SELECT COUNT(*) c FROM patients').get().c;
    const totalDoctors = db.prepare('SELECT COUNT(*) c FROM doctors').get().c;
    const todayAppts = db.prepare(`SELECT COUNT(*) c FROM appointments WHERE appointment_date = date('now')`).get().c;
    const pendingAppts = db.prepare(`SELECT COUNT(*) c FROM appointments WHERE status = 'pending'`).get().c;
    const revenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) s FROM billing WHERE status = 'paid'`).get().s;
    const outstanding = db.prepare(`SELECT COALESCE(SUM(amount), 0) s FROM billing WHERE status = 'unpaid'`).get().s;
    const apptsByStatus = db.prepare(`SELECT status, COUNT(*) c FROM appointments GROUP BY status`).all();
    return res.json({ totalPatients, totalDoctors, todayAppts, pendingAppts, revenue, outstanding, apptsByStatus });
  }

  if (role === 'doctor') {
    const doctorId = currentDoctorId(id);
    const todayAppts = db.prepare(
      `SELECT COUNT(*) c FROM appointments WHERE doctor_id = ? AND appointment_date = date('now')`
    ).get(doctorId).c;
    const totalPatients = db.prepare(
      `SELECT COUNT(DISTINCT patient_id) c FROM appointments WHERE doctor_id = ?`
    ).get(doctorId).c;
    const pendingAppts = db.prepare(
      `SELECT COUNT(*) c FROM appointments WHERE doctor_id = ? AND status = 'pending'`
    ).get(doctorId).c;
    const prescriptionsWritten = db.prepare(
      `SELECT COUNT(*) c FROM prescriptions WHERE doctor_id = ?`
    ).get(doctorId).c;
    return res.json({ todayAppts, totalPatients, pendingAppts, prescriptionsWritten });
  }

  if (role === 'receptionist') {
    const todayAppts = db.prepare(`SELECT COUNT(*) c FROM appointments WHERE appointment_date = date('now')`).get().c;
    const pendingAppts = db.prepare(`SELECT COUNT(*) c FROM appointments WHERE status = 'pending'`).get().c;
    const unpaidBills = db.prepare(`SELECT COUNT(*) c FROM billing WHERE status = 'unpaid'`).get().c;
    const totalPatients = db.prepare('SELECT COUNT(*) c FROM patients').get().c;
    return res.json({ todayAppts, pendingAppts, unpaidBills, totalPatients });
  }

  // patient
  const patientId = currentPatientId(id);
  const upcomingAppts = db.prepare(
    `SELECT COUNT(*) c FROM appointments WHERE patient_id = ? AND appointment_date >= date('now') AND status != 'cancelled'`
  ).get(patientId).c;
  const activePrescriptions = db.prepare(
    `SELECT COUNT(*) c FROM prescriptions WHERE patient_id = ? AND status = 'active'`
  ).get(patientId).c;
  const unpaidBills = db.prepare(
    `SELECT COUNT(*) c FROM billing WHERE patient_id = ? AND status = 'unpaid'`
  ).get(patientId).c;
  const totalRecords = db.prepare(
    `SELECT COUNT(*) c FROM medical_records WHERE patient_id = ?`
  ).get(patientId).c;
  res.json({ upcomingAppts, activePrescriptions, unpaidBills, totalRecords });
});

module.exports = router;
