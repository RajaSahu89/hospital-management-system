const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ---------------------------------------------------------------------------
// Built-in rule-based assistant. Works with zero configuration and zero cost.
// It answers common hospital FAQs and does very basic symptom triage —
// it always tells the user it is not a substitute for a real doctor.
// ---------------------------------------------------------------------------
const FAQ_RULES = [
  {
    match: /book|schedule|appointment/i,
    reply:
      'To book an appointment: go to "Appointments" from your dashboard, choose a doctor and an available date/time, add a short reason for the visit, and submit. Reception will confirm it shortly.',
  },
  {
    match: /cancel/i,
    reply:
      'You can cancel an appointment from the Appointments page as long as it has not been completed yet. If it is within a few hours of the slot, please also call the front desk.',
  },
  {
    match: /bill|payment|invoice|pay/i,
    reply:
      'You can view and pay outstanding bills from the "Billing" section of your dashboard. We accept card, UPI and cash at the counter.',
  },
  {
    match: /prescription|medicine|medication/i,
    reply:
      'Your prescriptions are listed under "Prescriptions" on your dashboard, with dosage and instructions from your doctor. Contact your doctor before changing any dosage.',
  },
  {
    match: /record|report|history/i,
    reply:
      'Your medical history, diagnoses and past visit notes are available under "Medical Records". Only you and your treating doctors can see them.',
  },
  {
    match: /hour|timing|open|close/i,
    reply: 'The hospital is open 24/7 for emergencies. Outpatient consultations generally run 10:00 AM – 5:00 PM, Monday to Saturday.',
  },
  {
    match: /emergency/i,
    reply:
      'If this is a medical emergency, please call your local emergency number or go to the nearest emergency room immediately — do not wait for a chat response.',
  },
];

const SYMPTOM_RULES = [
  { match: /chest pain|breathless|shortness of breath/i, dept: 'Cardiology', urgency: 'urgent' },
  { match: /fracture|broken bone|joint pain|sprain/i, dept: 'Orthopedics', urgency: 'routine' },
  { match: /child|kid|infant|baby/i, dept: 'Pediatrics', urgency: 'routine' },
  { match: /fever|cold|flu|cough|sore throat/i, dept: 'General Medicine', urgency: 'routine' },
  { match: /skin|rash|itch/i, dept: 'Dermatology', urgency: 'routine' },
  { match: /headache|migraine|dizziness/i, dept: 'Neurology', urgency: 'routine' },
];

function ruleBasedReply(message) {
  const faq = FAQ_RULES.find((r) => r.match.test(message));
  if (faq) return faq.reply;

  const symptom = SYMPTOM_RULES.find((r) => r.match.test(message));
  if (symptom) {
    const urgencyNote =
      symptom.urgency === 'urgent'
        ? ' This can be serious — please consider visiting the emergency department if symptoms are severe or worsening.'
        : '';
    return `Based on what you described, this sounds like something for our ${symptom.dept} department.${urgencyNote} I can help you book an appointment there — just say "book appointment" or use the Appointments page. (This is general guidance only, not a diagnosis.)`;
  }

  return (
    "I can help with booking appointments, billing, prescriptions, medical records, and basic guidance on which department to see for your symptoms. " +
    'Could you tell me a bit more about what you need, or describe your main symptom?'
  );
}

// ---------------------------------------------------------------------------
// Optional upgrade: if ANTHROPIC_API_KEY is set in the environment, route
// messages through Claude for richer, more natural conversations instead of
// the rule-based engine above. Falls back to rules on any error.
// ---------------------------------------------------------------------------
async function claudeReply(message, history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt =
    'You are a helpful assistant embedded in a hospital management system. ' +
    'Help users with booking appointments, billing questions, understanding prescriptions, ' +
    'and general triage guidance on which department to visit. Keep answers short (2-4 sentences). ' +
    'Always make clear you are not a doctor and cannot diagnose. For anything urgent, tell the user to seek emergency care.';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [...(history || []), { role: 'user', content: message }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock ? textBlock.text : null;
}

router.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }

  let reply = null;
  try {
    reply = await claudeReply(message, history);
  } catch (err) {
    reply = null; // fall through to rule-based
  }
  if (!reply) reply = ruleBasedReply(message);

  db.prepare('INSERT INTO assistant_logs (id, user_id, message, response) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, message, reply);

  res.json({ reply });
});

router.get('/history', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM assistant_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT 50')
    .all(req.user.id);
  res.json({ history: rows });
});

module.exports = router;
