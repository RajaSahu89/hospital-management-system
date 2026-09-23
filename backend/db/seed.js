// Seeds the database with a demo admin, doctors, and a patient so the
// app is usable immediately after setup.
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

function upsertUser({ name, email, password, role, phone }) {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) return existing;
  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, hashed, role, phone || null);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function seed() {
  console.log('Seeding database...');

  const admin = upsertUser({
    name: 'Admin User',
    email: 'admin@hms.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9000000001',
  });

  const receptionist = upsertUser({
    name: 'Riya Sen',
    email: 'reception@hms.com',
    password: 'Reception@123',
    role: 'receptionist',
    phone: '9000000002',
  });

  const doctorUsers = [
    { name: 'Dr. Ananya Roy', email: 'ananya.roy@hms.com', spec: 'Cardiology', dept: 'Cardiology' },
    { name: 'Dr. Vikram Nair', email: 'vikram.nair@hms.com', spec: 'Orthopedics', dept: 'Orthopedics' },
    { name: 'Dr. Sara Khan', email: 'sara.khan@hms.com', spec: 'Pediatrics', dept: 'Pediatrics' },
  ];

  doctorUsers.forEach((d) => {
    const user = upsertUser({
      name: d.name,
      email: d.email,
      password: 'Doctor@123',
      role: 'doctor',
      phone: '9000000010',
    });
    const existingDoctor = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(user.id);
    if (!existingDoctor) {
      db.prepare(
        `INSERT INTO doctors (id, user_id, specialization, qualification, experience_years, consultation_fee, department, available_days, available_time, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(), user.id, d.spec, 'MBBS, MD', 8, 500,
        d.dept, 'Mon,Tue,Wed,Thu,Fri', '10:00-17:00',
        `${d.name} is a specialist in ${d.spec} with 8+ years of clinical experience.`
      );
    }
  });

  const patientUser = upsertUser({
    name: 'Rahul Verma',
    email: 'patient@hms.com',
    password: 'Patient@123',
    role: 'patient',
    phone: '9000000099',
  });
  const existingPatient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(patientUser.id);
  if (!existingPatient) {
    db.prepare(
      `INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address, emergency_contact, allergies, chronic_conditions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuidv4(), patientUser.id, '1995-04-12', 'Male', 'O+',
      '221B, Park Street, Kolkata', '9800011122', 'Penicillin', 'None'
    );
  }

  console.log('Seed complete. Demo logins:');
  console.log('  Admin:        admin@hms.com / Admin@123');
  console.log('  Receptionist: reception@hms.com / Reception@123');
  console.log('  Doctor:       ananya.roy@hms.com / Doctor@123');
  console.log('  Patient:      patient@hms.com / Patient@123');
}

seed();
