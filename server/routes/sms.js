const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

// SMS Gateway Configuration
const SMS_CONFIG = {
  // ThaiSMS
  thaiSmsApiKey: process.env.THAISMS_API_KEY || '',
  thaiSmsSecretKey: process.env.THAISMS_SECRET_KEY || '',
  
  // Alternative: SMSLinkThai
  smsLinkUsername: process.env.SMSLINK_USERNAME || '',
  smsLinkPassword: process.env.SMSLINK_PASSWORD || '',
  
  // Twilio (International)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
};

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// @route   POST /api/sms/send-otp
// @desc    Send OTP via SMS
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Compose SMS message
    const message = `รหัส OTP ของคุณคือ: ${otp}\nใช้งานได้ภายใน 5 นาที\n- Kleara Clinic`;

    // Send SMS
    const sendResult = await sendSMS(phoneNumber, message);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phoneNumber,
        expiresIn: 300 // seconds
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// @route   POST /api/sms/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Get stored OTP
    const storedData = otpStore.get(phoneNumber);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Clear OTP after successful verification
    otpStore.delete(phoneNumber);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// @route   POST /api/sms/send-reminder
// @desc    Send appointment reminder via SMS
// @access  Private
router.post('/send-reminder', auth, async (req, res) => {
  try {
    const { phoneNumber, patientName, appointmentDate, appointmentTime, service } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Compose reminder message
    const message = `สวัสดีคุณ ${patientName}\n\nคุณมีนัดหมายกับ Kleara Clinic\n📅 ${appointmentDate} เวลา ${appointmentTime}\n💆 บริการ: ${service}\n\nกรุณามาก่อนเวลา 10 นาที\nสอบถามเพิ่มเติม: 02-xxx-xxxx`;

    // Send SMS
    const sendResult = await sendSMS(phoneNumber, message);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reminder'
      });
    }

    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

// @route   POST /api/sms/send-notification
// @desc    Send custom notification via SMS
// @access  Private
router.post('/send-notification', auth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Send SMS
    const sendResult = await sendSMS(phoneNumber, message);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Helper function: Send SMS
async function sendSMS(phoneNumber, message) {
  try {
    // Method 1: ThaiSMS
    if (SMS_CONFIG.thaiSmsApiKey) {
      const response = await axios.post(
        'https://api.thsms.com/sms/send',
        {
          sender: 'KLEARA',
          msisdn: [phoneNumber],
          message: message
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SMS_CONFIG.thaiSmsApiKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    }

    // Method 2: SMSLinkThai
    if (SMS_CONFIG.smsLinkUsername && SMS_CONFIG.smsLinkPassword) {
      const response = await axios.post(
        'https://www.smslink.co.th/api/v1/send',
        {
          username: SMS_CONFIG.smsLinkUsername,
          password: SMS_CONFIG.smsLinkPassword,
          msisdn: phoneNumber,
          message: message,
          sender: 'KLEARA'
        }
      );

      return {
        success: true,
        data: response.data
      };
    }

    // Method 3: Twilio (International)
    if (SMS_CONFIG.twilioAccountSid && SMS_CONFIG.twilioAuthToken) {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${SMS_CONFIG.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          To: phoneNumber,
          From: SMS_CONFIG.twilioPhoneNumber,
          Body: message
        }),
        {
          auth: {
            username: SMS_CONFIG.twilioAccountSid,
            password: SMS_CONFIG.twilioAuthToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    }

    // No SMS provider configured - log only (for development)
    console.log('SMS (Dev Mode):', { phoneNumber, message });
    return {
      success: true,
      data: { mode: 'development', phoneNumber, message }
    };

  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// @route   POST /api/sms/bulk-send
// @desc    Send SMS to multiple recipients
// @access  Private
router.post('/bulk-send', auth, async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone numbers array is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Send to all numbers
    const results = await Promise.all(
      phoneNumbers.map(phoneNumber => sendSMS(phoneNumber, message))
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      message: 'Bulk SMS sent',
      data: {
        total: results.length,
        success: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk SMS',
      error: error.message
    });
  }
});

module.exports = router;
