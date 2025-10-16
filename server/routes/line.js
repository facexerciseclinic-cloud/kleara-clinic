const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');

// LINE Configuration
const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  notifyToken: process.env.LINE_NOTIFY_TOKEN || ''
};

// @route   POST /api/line/notify
// @desc    Send LINE Notify message
// @access  Private
router.post('/notify', auth, async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!LINE_CONFIG.notifyToken) {
      return res.status(400).json({
        success: false,
        message: 'LINE Notify token not configured'
      });
    }

    const response = await axios.post(
      'https://notify-api.line.me/api/notify',
      new URLSearchParams({ message }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${LINE_CONFIG.notifyToken}`
        }
      }
    );

    res.json({
      success: true,
      message: 'LINE notification sent successfully',
      data: response.data
    });

  } catch (error) {
    console.error('LINE Notify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send LINE notification',
      error: error.message
    });
  }
});

// @route   POST /api/line/push
// @desc    Send LINE push message to specific user
// @access  Private
router.post('/push', auth, async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!LINE_CONFIG.channelAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'LINE channel access token not configured'
      });
    }

    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`
        }
      }
    );

    res.json({
      success: true,
      message: 'LINE message sent successfully',
      data: response.data
    });

  } catch (error) {
    console.error('LINE Push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send LINE message',
      error: error.message
    });
  }
});

// @route   POST /api/line/appointment-reminder
// @desc    Send appointment reminder via LINE
// @access  Private
router.post('/appointment-reminder', auth, async (req, res) => {
  try {
    const { lineUserId, patientName, appointmentDate, appointmentTime, service } = req.body;

    if (!lineUserId) {
      return res.status(400).json({
        success: false,
        message: 'LINE User ID is required'
      });
    }

    const message = `
🏥 แจ้งเตือนนัดหมาย - Kleara Clinic

สวัสดีคุณ ${patientName} 
คุณมีนัดหมายกับคลินิกของเรา

📅 วันที่: ${appointmentDate}
⏰ เวลา: ${appointmentTime}
💆 บริการ: ${service}

📍 Kleara Clinic
กรุณามาก่อนเวลานัด 10 นาที

❓ หากต้องการเลื่อนนัด กรุณาติดต่อ: 02-xxx-xxxx
`.trim();

    // Send via LINE Messaging API
    if (LINE_CONFIG.channelAccessToken) {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: lineUserId,
          messages: [
            {
              type: 'text',
              text: message
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Appointment reminder sent successfully'
    });

  } catch (error) {
    console.error('Appointment reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send appointment reminder',
      error: error.message
    });
  }
});

// @route   POST /api/line/webhook
// @desc    LINE webhook endpoint for receiving messages
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;

    // Verify webhook signature
    // TODO: Implement signature verification

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text;

        // Handle different commands
        if (messageText.toLowerCase().includes('นัดหมาย')) {
          // Send booking info
          await sendLineMessage(userId, 'กรุณาโทรติดต่อ 02-xxx-xxxx หรือจองผ่านเว็บไซต์ของเรา');
        } else if (messageText.toLowerCase().includes('ราคา')) {
          // Send price list
          await sendLineMessage(userId, 'ราคาบริการของเราเริ่มต้นที่ 2,000 บาท ขึ้นอยู่กับบริการที่เลือก');
        } else {
          // Default response
          await sendLineMessage(userId, 'สวัสดีค่ะ ยินดีต้อนรับสู่ Kleara Clinic 🏥');
        }
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Helper function to send LINE message
async function sendLineMessage(userId, message) {
  if (!LINE_CONFIG.channelAccessToken) {
    return;
  }

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`
        }
      }
    );
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

// @route   GET /api/line/profile/:userId
// @desc    Get LINE user profile
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    if (!LINE_CONFIG.channelAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'LINE channel access token not configured'
      });
    }

    const response = await axios.get(
      `https://api.line.me/v2/bot/profile/${req.params.userId}`,
      {
        headers: {
          'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get LINE profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get LINE profile'
    });
  }
});

module.exports = router;
