CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee REAL DEFAULT 0,
  department TEXT,
  available_days TEXT,
  available_time TEXT,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth TEXT,
  gender TEXT,
  blood_group TEXT,
  address TEXT,
  emergency_contact TEXT,
  allergies TEXT,
  chronic_conditions TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id),
  appointment_id TEXT REFERENCES appointments(id),
  diagnosis TEXT,
  symptoms TEXT,
  treatment TEXT,
  vitals TEXT,
  notes TEXT,
  record_date TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  appointment_id TEXT REFERENCES appointments(id),
  medicines TEXT NOT NULL,
  instructions TEXT,
  issued_date TEXT DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT,
  issued_date TEXT DEFAULT (datetime('now')),
  paid_date TEXT
);

CREATE TABLE IF NOT EXISTS assistant_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_id);
