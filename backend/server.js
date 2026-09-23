require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./db/seed'); // auto-seed demo data on startup

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const billingRoutes = require('./routes/billing');
const recordRoutes = require('./routes/records');
const assistantRoutes = require('./routes/assistant');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'HMS API' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HMS API server running on http://localhost:${PORT}`);
});