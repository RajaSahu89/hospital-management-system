const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const BILL_VIEW = `
  SELECT b.*, pu.name AS patient_name
  FROM billing b
  JOIN patients p ON p.id = b.patient_id JOIN users pu ON pu.id = p.user_id
`;

function currentPatientId(userId) {
  const p = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
  return p ? p.id : null;
}

router.get('/', (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'admin' || role === 'receptionist' || role === 'doctor') {
    rows = db.prepare(`${BILL_VIEW} ORDER BY b.issued_date DESC`).all();
  } else {
    rows = db.prepare(`${BILL_VIEW} WHERE b.patient_id = ? ORDER BY b.issued_date DESC`).all(currentPatientId(id));
  }
  res.json({ bills: rows });
});

router.post('/', authorize('admin', 'receptionist'), (req, res) => {
  const { patient_id, appointment_id, description, amount } = req.body;
  if (!patient_id || !description || amount === undefined) {
    return res.status(400).json({ error: 'patient_id, description and amount are required.' });
  }
  const billId = uuidv4();
  db.prepare(
    `INSERT INTO billing (id, patient_id, appointment_id, description, amount, status)
     VALUES (?, ?, ?, ?, ?, 'unpaid')`
  ).run(billId, patient_id, appointment_id || null, description, amount);

  const bill = db.prepare(`${BILL_VIEW} WHERE b.id = ?`).get(billId);
  res.status(201).json({ bill });
});

router.put('/:id/pay', (req, res) => {
  const bill = db.prepare('SELECT * FROM billing WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found.' });

  const isOwnerPatient = req.user.role === 'patient' && currentPatientId(req.user.id) === bill.patient_id;
  const isStaff = ['admin', 'receptionist'].includes(req.user.role);
  if (!isOwnerPatient && !isStaff) {
    return res.status(403).json({ error: 'You do not have permission to pay this bill.' });
  }

  const { payment_method } = req.body;
  db.prepare(
    `UPDATE billing SET status = 'paid', payment_method = ?, paid_date = datetime('now') WHERE id = ?`
  ).run(payment_method || 'card', req.params.id);

  const updated = db.prepare(`${BILL_VIEW} WHERE b.id = ?`).get(req.params.id);
  res.json({ bill: updated });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  const bill = db.prepare('SELECT * FROM billing WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found.' });
  db.prepare('DELETE FROM billing WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
