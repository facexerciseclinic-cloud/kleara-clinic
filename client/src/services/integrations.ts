// services/integrations.ts
// Helper functions for LINE, Payment, and SMS integrations

import { api } from './api';

// ========================================
// LINE API Integration
// ========================================

export interface LineNotifyParams {
  message: string;
}

export interface LinePushMessageParams {
  userId: string;
  message: string;
}

export interface LineAppointmentReminderParams {
  lineUserId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}

/**
 * Send LINE Notify message
 */
export const sendLineNotification = async (message: string) => {
  const response = await api.post('/line/notify', { message });
  return response.data;
};

/**
 * Send LINE push message to specific user
 */
export const sendLinePushMessage = async (userId: string, message: string) => {
  const response = await api.post('/line/push', { userId, message });
  return response.data;
};

/**
 * Send appointment reminder via LINE
 */
export const sendLineAppointmentReminder = async (params: LineAppointmentReminderParams) => {
  const response = await api.post('/line/appointment-reminder', params);
  return response.data;
};

/**
 * Get LINE user profile
 */
export const getLineProfile = async (userId: string) => {
  const response = await api.get(`/api/line/profile/${userId}`);
  return response.data;
};

// ========================================
// Payment Gateway Integration
// ========================================

export interface PromptPayParams {
  amount: number;
  billId: string;
}

export interface CreditCardPaymentParams {
  amount: number;
  token: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface InstallmentPaymentParams {
  amount: number;
  sourceId: string;
  installmentTerms: 3 | 4 | 6 | 10;
  description?: string;
}

export interface Payment2C2PParams {
  amount: number;
  orderId: string;
  description?: string;
}

/**
 * Generate PromptPay QR Code
 */
export const generatePromptPayQR = async (amount: number, billId: string) => {
  const response = await api.post('/payment/promptpay', { amount, billId });
  return response.data;
};

/**
 * Process credit card payment via Omise
 */
export const processCreditCardPayment = async (params: CreditCardPaymentParams) => {
  const response = await api.post('/payment/omise/charge', params);
  return response.data;
};

/**
 * Process installment payment
 */
export const processInstallmentPayment = async (params: InstallmentPaymentParams) => {
  const response = await api.post('/payment/omise/installment', params);
  return response.data;
};

/**
 * Process payment via 2C2P
 */
export const process2C2PPayment = async (params: Payment2C2PParams) => {
  const response = await api.post('/payment/2c2p/charge', params);
  return response.data;
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (transactionId: string) => {
  const response = await api.get(`/api/payment/status/${transactionId}`);
  return response.data;
};

// ========================================
// SMS Integration
// ========================================

export interface SendOTPParams {
  phoneNumber: string;
}

export interface VerifyOTPParams {
  phoneNumber: string;
  otp: string;
}

export interface SMSReminderParams {
  phoneNumber: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}

export interface SMSNotificationParams {
  phoneNumber: string;
  message: string;
}

export interface BulkSMSParams {
  phoneNumbers: string[];
  message: string;
}

/**
 * Send OTP via SMS
 */
export const sendOTP = async (phoneNumber: string) => {
  const response = await api.post('/sms/send-otp', { phoneNumber });
  return response.data;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phoneNumber: string, otp: string) => {
  const response = await api.post('/sms/verify-otp', { phoneNumber, otp });
  return response.data;
};

/**
 * Send appointment reminder via SMS
 */
export const sendSMSAppointmentReminder = async (params: SMSReminderParams) => {
  const response = await api.post('/sms/send-reminder', params);
  return response.data;
};

/**
 * Send custom SMS notification
 */
export const sendSMSNotification = async (phoneNumber: string, message: string) => {
  const response = await api.post('/sms/send-notification', { phoneNumber, message });
  return response.data;
};

/**
 * Send bulk SMS to multiple recipients
 */
export const sendBulkSMS = async (phoneNumbers: string[], message: string) => {
  const response = await api.post('/sms/bulk-send', { phoneNumbers, message });
  return response.data;
};

// ========================================
// Convenience Functions
// ========================================

/**
 * Send appointment reminder via multiple channels
 */
export const sendMultiChannelReminder = async (params: {
  patientName: string;
  phoneNumber: string;
  lineUserId?: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}) => {
  const results = {
    sms: { success: false, error: null as any },
    line: { success: false, error: null as any }
  };

  // Send SMS
  try {
    await sendSMSAppointmentReminder({
      phoneNumber: params.phoneNumber,
      patientName: params.patientName,
      appointmentDate: params.appointmentDate,
      appointmentTime: params.appointmentTime,
      service: params.service
    });
    results.sms.success = true;
  } catch (error) {
    results.sms.error = error;
  }

  // Send LINE (if lineUserId provided)
  if (params.lineUserId) {
    try {
      await sendLineAppointmentReminder({
        lineUserId: params.lineUserId,
        patientName: params.patientName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        service: params.service
      });
      results.line.success = true;
    } catch (error) {
      results.line.error = error;
    }
  }

  return results;
};

/**
 * Process payment with fallback options
 */
export const processPaymentWithFallback = async (
  amount: number,
  primaryMethod: 'promptpay' | 'credit-card' | '2c2p',
  params?: any
) => {
  try {
    switch (primaryMethod) {
      case 'promptpay':
        return await generatePromptPayQR(amount, params?.billId || `BILL-${Date.now()}`);
      
      case 'credit-card':
        return await processCreditCardPayment({
          amount,
          token: params.token,
          description: params.description
        });
      
      case '2c2p':
        return await process2C2PPayment({
          amount,
          orderId: params?.orderId || `ORDER-${Date.now()}`,
          description: params?.description
        });
      
      default:
        throw new Error('Unknown payment method');
    }
  } catch (error) {
    console.error('Primary payment method failed:', error);
    // Fallback to PromptPay
    return await generatePromptPayQR(amount, `BILL-${Date.now()}`);
  }
};

export default {
  // LINE
  sendLineNotification,
  sendLinePushMessage,
  sendLineAppointmentReminder,
  getLineProfile,
  
  // Payment
  generatePromptPayQR,
  processCreditCardPayment,
  processInstallmentPayment,
  process2C2PPayment,
  checkPaymentStatus,
  
  // SMS
  sendOTP,
  verifyOTP,
  sendSMSAppointmentReminder,
  sendSMSNotification,
  sendBulkSMS,
  
  // Convenience
  sendMultiChannelReminder,
  processPaymentWithFallback
};
