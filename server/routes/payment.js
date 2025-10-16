const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

// Payment Gateway Configuration
const PAYMENT_CONFIG = {
  // Omise (Support Thai payment methods)
  omisePublicKey: process.env.OMISE_PUBLIC_KEY || '',
  omiseSecretKey: process.env.OMISE_SECRET_KEY || '',
  
  // 2C2P
  merchantId: process.env.PAYMENT_2C2P_MERCHANT_ID || '',
  secretKey: process.env.PAYMENT_2C2P_SECRET_KEY || '',
  
  // PromptPay
  promptPayId: process.env.PROMPTPAY_ID || '0123456789' // Tax ID or Phone number
};

// @route   POST /api/payment/promptpay
// @desc    Generate PromptPay QR Code
// @access  Private
router.post('/promptpay', auth, async (req, res) => {
  try {
    const { amount, billId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Generate PromptPay payload
    const promptPayPayload = generatePromptPayPayload(PAYMENT_CONFIG.promptPayId, amount);
    
    // Generate QR code URL (using qrcode API or library)
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(promptPayPayload)}`;

    res.json({
      success: true,
      data: {
        qrCodeUrl,
        payload: promptPayPayload,
        amount,
        promptPayId: PAYMENT_CONFIG.promptPayId
      }
    });

  } catch (error) {
    console.error('PromptPay QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PromptPay QR code',
      error: error.message
    });
  }
});

// @route   POST /api/payment/omise/charge
// @desc    Process credit card payment via Omise
// @access  Private
router.post('/omise/charge', auth, async (req, res) => {
  try {
    const { amount, token, description, metadata } = req.body;

    if (!PAYMENT_CONFIG.omiseSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Omise not configured'
      });
    }

    // Create charge via Omise API
    const response = await axios.post(
      'https://api.omise.co/charges',
      {
        amount: amount * 100, // Convert to satang (cents)
        currency: 'THB',
        card: token,
        description: description || 'Clinic payment',
        metadata: metadata || {}
      },
      {
        auth: {
          username: PAYMENT_CONFIG.omiseSecretKey,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        chargeId: response.data.id,
        amount: response.data.amount / 100,
        status: response.data.status,
        paid: response.data.paid
      }
    });

  } catch (error) {
    console.error('Omise charge error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.response?.data?.message || error.message
    });
  }
});

// @route   POST /api/payment/omise/installment
// @desc    Process installment payment via Omise
// @access  Private
router.post('/omise/installment', auth, async (req, res) => {
  try {
    const { amount, sourceId, installmentTerms, description } = req.body;

    if (!PAYMENT_CONFIG.omiseSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Omise not configured'
      });
    }

    // Create installment charge
    const response = await axios.post(
      'https://api.omise.co/charges',
      {
        amount: amount * 100,
        currency: 'THB',
        source: sourceId,
        installment_terms: installmentTerms, // 3, 4, 6, 10 months
        description: description || 'Clinic installment payment'
      },
      {
        auth: {
          username: PAYMENT_CONFIG.omiseSecretKey,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      message: 'Installment payment created successfully',
      data: {
        chargeId: response.data.id,
        amount: response.data.amount / 100,
        installmentTerms: response.data.installment_terms,
        status: response.data.status
      }
    });

  } catch (error) {
    console.error('Installment charge error:', error);
    res.status(500).json({
      success: false,
      message: 'Installment payment failed',
      error: error.response?.data?.message || error.message
    });
  }
});

// @route   POST /api/payment/2c2p/charge
// @desc    Process payment via 2C2P
// @access  Private
router.post('/2c2p/charge', auth, async (req, res) => {
  try {
    const { amount, orderId, description } = req.body;

    if (!PAYMENT_CONFIG.merchantId || !PAYMENT_CONFIG.secretKey) {
      return res.status(400).json({
        success: false,
        message: '2C2P not configured'
      });
    }

    // Prepare payment payload
    const payload = {
      merchantID: PAYMENT_CONFIG.merchantId,
      invoiceNo: orderId,
      amount: (amount * 100).toString(), // Convert to cents
      currencyCode: '764', // THB
      description: description || 'Clinic payment'
    };

    // Generate hash
    const hashData = `${payload.merchantID}${payload.invoiceNo}${payload.amount}${payload.currencyCode}${PAYMENT_CONFIG.secretKey}`;
    payload.hash = crypto.createHash('sha256').update(hashData).digest('hex');

    // Return payment URL for redirect
    const paymentUrl = `https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/Payment.aspx?${new URLSearchParams(payload).toString()}`;

    res.json({
      success: true,
      message: 'Payment URL generated',
      data: {
        paymentUrl,
        orderId
      }
    });

  } catch (error) {
    console.error('2C2P charge error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment URL generation failed',
      error: error.message
    });
  }
});

// @route   GET /api/payment/status/:transactionId
// @desc    Check payment status
// @access  Private
router.get('/status/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!PAYMENT_CONFIG.omiseSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    // Get charge status from Omise
    const response = await axios.get(
      `https://api.omise.co/charges/${transactionId}`,
      {
        auth: {
          username: PAYMENT_CONFIG.omiseSecretKey,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      data: {
        transactionId: response.data.id,
        status: response.data.status,
        paid: response.data.paid,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        createdAt: response.data.created
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.response?.data?.message || error.message
    });
  }
});

// @route   POST /api/payment/webhook
// @desc    Handle payment webhook callbacks
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature
    // TODO: Implement signature verification based on payment provider

    console.log('Payment webhook received:', event);

    // Handle different event types
    switch (event.type) {
      case 'charge.complete':
        // Update order status to paid
        console.log('Payment completed:', event.data.id);
        break;
      
      case 'charge.failed':
        // Update order status to failed
        console.log('Payment failed:', event.data.id);
        break;
      
      default:
        console.log('Unknown event type:', event.type);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Helper: Generate PromptPay QR payload
function generatePromptPayPayload(promptPayId, amount) {
  // PromptPay EMV QR Code format
  // Simplified version - for production, use proper PromptPay library
  
  const merchantPresent = '010211'; // Static QR
  const merchantId = promptPayId.replace(/-/g, '');
  
  let payload = '00020101021130'; // Version + Merchant Present
  payload += `${29 + merchantId.length.toString().padStart(2, '0')}${merchantId}`;
  payload += '5303764'; // Currency Code (764 = THB)
  
  if (amount) {
    const amountStr = amount.toFixed(2);
    payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  }
  
  payload += '5802TH'; // Country Code
  payload += '6304'; // CRC placeholder
  
  // Calculate CRC16
  const crc = calculateCRC16(payload);
  payload += crc;
  
  return payload;
}

// Helper: Calculate CRC16 for PromptPay
function calculateCRC16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

module.exports = router;
