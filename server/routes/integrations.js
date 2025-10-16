const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const { sendSms, sendLine, sendEmail } = require('../services/notifications');

// optional audit helper
async function writeAudit(entry) {
  try {
    const Audit = require('../models/AuditLog');
    if (Audit) await Audit.create(entry);
  } catch (e) {
    // ignore if audit model doesn't exist
  }
}

// POST /api/integrations/sms/send
// body: { phoneNumber, message }
router.post('/sms/send', auth, checkPermission('patients', 'write'), async (req, res) => {
  const { phoneNumber, message } = req.body || {};
  if (!phoneNumber || !message) return res.status(400).json({ success: false, message: 'phoneNumber and message required' });
  try {
    const result = await sendSms({ phoneNumber, message });
    await writeAudit({ module: 'integrations', action: 'sms_send', data: { phoneNumber, message, result }, user: req.user && { id: req.user._id, username: req.user.username } });
    res.json({ success: true, result });
  } catch (err) {
    console.error('sms send failed', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// POST /api/integrations/line/send
// body: { lineId, message }
router.post('/line/send', auth, checkPermission('patients', 'write'), async (req, res) => {
  const { lineId, message } = req.body || {};
  if (!lineId || !message) return res.status(400).json({ success: false, message: 'lineId and message required' });
  try {
    const result = await sendLine({ lineId, message });
    await writeAudit({ module: 'integrations', action: 'line_send', data: { lineId, message, result }, user: req.user && { id: req.user._id, username: req.user.username } });
    res.json({ success: true, result });
  } catch (err) {
    console.error('line send failed', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// POST /api/integrations/email/send
// body: { to, subject, message }
router.post('/email/send', auth, checkPermission('patients', 'write'), async (req, res) => {
  const { to, subject, message } = req.body || {};
  if (!to || !subject || !message) return res.status(400).json({ success: false, message: 'to, subject and message required' });
  try {
    const result = await sendEmail({ to, subject, message });
    await writeAudit({ module: 'integrations', action: 'email_send', data: { to, subject, result }, user: req.user && { id: req.user._id, username: req.user.username } });
    res.json({ success: true, result });
  } catch (err) {
    console.error('email send failed', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// POST /api/integrations/reminder
// body: { patientId, phoneNumber, message }
// simple immediate reminder sender (scheduling should be handled by a worker)
router.post('/reminder', auth, checkPermission('appointments', 'write'), async (req, res) => {
  const { patientId, phoneNumber, message } = req.body || {};
  if (!patientId || !phoneNumber || !message) return res.status(400).json({ success: false, message: 'patientId, phoneNumber and message required' });
  try {
    const result = await sendSms({ phoneNumber, message });
    await writeAudit({ module: 'integrations', action: 'reminder_send', data: { patientId, phoneNumber, message, result }, user: req.user && { id: req.user._id, username: req.user.username } });
    res.json({ success: true, result });
  } catch (err) {
    console.error('reminder send failed', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Payment processing (mock)
router.post('/payment/process', auth, checkPermission('billing', 'write'), async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body || {};
    if (!amount || !paymentMethod) return res.status(400).json({ success: false, message: 'Amount and payment method required' });
    const mockPayment = { transactionId: `TXN${Date.now()}`, status: 'success', amount, paymentMethod, processedAt: new Date() };
    await writeAudit({ module: 'integrations', action: 'payment_process', data: mockPayment, user: req.user && { id: req.user._id } });
    res.json({ success: true, data: mockPayment });
  } catch (err) {
    console.error('payment process error', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Accounting export (keeps previous behavior)
router.get('/accounting/export', auth, checkPermission('billing', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    const Bill = require('../models/Bill');
    const bills = await Bill.find({ billDate: { $gte: new Date(startDate), $lte: new Date(endDate) }, status: 'confirmed' })
      .populate('patient', 'hn profile.firstName profile.lastName')
      .sort({ billDate: 1 });
    const exportData = bills.map(bill => ({ date: bill.billDate.toISOString().split('T')[0], billNumber: bill.billNumber, customerName: bill.customerInfo?.name || `${bill.patient.profile.firstName} ${bill.patient.profile.lastName}`, customerTaxId: bill.customerInfo?.taxId || '', subtotal: bill.pricing.subtotal, discount: bill.pricing.totalDiscount, tax: bill.pricing.taxAmount, total: bill.pricing.grandTotal, paymentStatus: bill.paymentStatus }));
    if (format === 'json') return res.json({ success: true, data: exportData });
    // CSV not implemented yet
    res.json({ success: true, message: 'CSV export not implemented', data: exportData });
  } catch (err) {
    console.error('accounting export error', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Appointments reminder (uses sendSms/sendLine/sendEmail)
router.post('/appointments/reminder', auth, checkPermission('appointments', 'write'), async (req, res) => {
  try {
    const { appointmentId, reminderType = 'sms', customMessage } = req.body || {};
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId).populate('patient', 'profile');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const patient = appointment.patient;
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const timeSlot = appointment.timeSlot && appointment.timeSlot.start;
    const defaultMessage = customMessage || `สวัสดีค่ะ คุณ${patient.profile.firstName} มีนัดหมายที่คลินิกเคลียร่า วันที่ ${appointmentDateTime.toLocaleDateString('th-TH')} เวลา ${timeSlot || ''} น. กรุณามาตรงเวลาค่ะ`;
    let result = null;
    if (reminderType === 'sms' && patient.profile.contact && patient.profile.contact.phone) {
      result = await sendSms({ phoneNumber: patient.profile.contact.phone, message: defaultMessage });
    } else if (reminderType === 'line' && patient.profile.contact && patient.profile.contact.lineId) {
      result = await sendLine({ lineId: patient.profile.contact.lineId, message: defaultMessage });
    } else if (reminderType === 'email' && patient.profile.contact && patient.profile.contact.email) {
      result = await sendEmail({ to: patient.profile.contact.email, subject: 'การนัดหมายที่คลินิกเคลียร่า', message: defaultMessage });
    } else {
      return res.json({ success: false, message: 'No valid contact method found for selected reminder type' });
    }
    appointment.reminders = appointment.reminders || [];
    appointment.reminders.push({ type: reminderType, sentAt: new Date(), status: result && result.success ? 'sent' : 'failed', meta: result });
    await appointment.save();
    await writeAudit({ module: 'integrations', action: 'appointment_reminder', data: { appointmentId, reminderType, result }, user: req.user && { id: req.user._id } });
    res.json({ success: true, result });
  } catch (err) {
    console.error('send reminder error', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// LINE webhook endpoint
router.post('/line/webhook', async (req, res) => {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type === 'message' && event.message && event.message.type === 'text') {
        const userId = event.source && event.source.userId;
        const messageText = event.message.text;
        // placeholder: could enqueue job to handle LINE messages
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('LINE webhook error', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

module.exports = router;