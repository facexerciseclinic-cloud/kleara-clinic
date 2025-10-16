# 🚀 คู่มือการติดตั้งและใช้งาน API ขั้นสูง

## 📋 สารบัญ

1. [LINE API Integration](#line-api-integration)
2. [Payment Gateway](#payment-gateway)
3. [SMS Integration](#sms-integration)
4. [Appointment System](#appointment-system)
5. [การทดสอบระบบ](#การทดสอบระบบ)

---

## 1. LINE API Integration

### 📱 วิธีสมัครและตั้งค่า LINE Official Account

#### ขั้นตอนที่ 1: สร้าง LINE Official Account
1. ไปที่ https://developers.line.biz/console/
2. คลิก "Create" → "Create a new provider"
3. ตั้งชื่อ Provider (เช่น "Kleara Clinic")
4. คลิก "Create" → "Create a Messaging API channel"
5. กรอกข้อมูล:
   - Channel name: "Kleara Clinic Bot"
   - Channel description: "ระบบแจ้งเตือนและนัดหมาย"
   - Category: Medical/Healthcare
   - Email address: อีเมลของคุณ

#### ขั้นตอนที่ 2: รับ Channel Access Token
1. เข้าไปที่ Channel ที่สร้าง
2. ไปที่แท็บ "Messaging API"
3. เลื่อนลงหา "Channel access token" → คลิก "Issue"
4. คัดลอก token นำไปใส่ในไฟล์ `.env`:
   ```
   LINE_CHANNEL_ACCESS_TOKEN=YOUR_TOKEN_HERE
   ```

#### ขั้นตอนที่ 3: รับ Channel Secret
1. ไปที่แท็บ "Basic settings"
2. หา "Channel secret" → คลิก "Show"
3. คัดลอกและใส่ในไฟล์ `.env`:
   ```
   LINE_CHANNEL_SECRET=YOUR_SECRET_HERE
   ```

#### ขั้นตอนที่ 4: ตั้งค่า Webhook
1. ไปที่แท็บ "Messaging API"
2. หา "Webhook settings"
3. ใส่ URL: `https://your-domain.com/api/line/webhook`
4. เปิดใช้งาน "Use webhook"
5. ปิด "Auto-reply messages" (ถ้าต้องการ)

#### ขั้นตอนที่ 5: LINE Notify (สำหรับแจ้งเตือน)
1. ไปที่ https://notify-bot.line.me/my/
2. คลิก "Generate token"
3. ตั้งชื่อ: "Kleara Clinic Notifications"
4. เลือกกลุ่มที่จะส่งข้อความ
5. คัดลอก token ใส่ในไฟล์ `.env`:
   ```
   LINE_NOTIFY_TOKEN=YOUR_NOTIFY_TOKEN
   ```

### 🔧 การใช้งาน LINE API

#### ส่ง LINE Notify
```javascript
// Frontend: client/src/services/api.ts
export const sendLineNotification = async (message: string) => {
  const response = await api.post('/api/line/notify', { message });
  return response.data;
};

// ตัวอย่างการใช้งาน
await sendLineNotification('มีนัดหมายใหม่: คุณสมชาย วันนี้ เวลา 14:00');
```

#### ส่ง LINE Push Message
```javascript
export const sendLinePushMessage = async (userId: string, message: string) => {
  const response = await api.post('/api/line/push', { userId, message });
  return response.data;
};
```

#### ส่ง Appointment Reminder
```javascript
export const sendAppointmentReminder = async (data: {
  lineUserId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}) => {
  const response = await api.post('/api/line/appointment-reminder', data);
  return response.data;
};
```

---

## 2. Payment Gateway

### 💳 Omise (แนะนำสำหรับไทย)

#### วิธีสมัคร Omise
1. ไปที่ https://dashboard.omise.co/signup
2. สมัครบัญชี (ฟรี - ไม่มีค่าธรรมเนียมรายเดือน)
3. ยืนยันอีเมล
4. Login เข้า Dashboard

#### รับ API Keys
1. ไปที่ https://dashboard.omise.co/test/api-keys
2. คัดลอก Public Key และ Secret Key
3. ใส่ในไฟล์ `.env`:
   ```
   OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxxxxx
   OMISE_SECRET_KEY=skey_test_xxxxxxxxxxxxx
   ```

#### ติดตั้ง Omise SDK
```bash
npm install omise
```

#### การใช้งาน - ชำระเงินด้วยบัตรเครดิต
```javascript
// Frontend
import OmiseCard from 'omise-react';

// สร้างฟอร์มบัตรเครดิต
<OmiseCard
  publicKey="pkey_test_xxxxx"
  amount={50000} // 500.00 THB (satang)
  onCreateTokenSuccess={(token) => {
    // ส่ง token ไปยัง backend
    processPayment(token);
  }}
/>

// Backend endpoint
const processPayment = async (token) => {
  const response = await api.post('/api/payment/omise/charge', {
    amount: 500,
    token: token,
    description: 'ค่าบริการคลินิก'
  });
  return response.data;
};
```

#### การใช้งาน - ผ่อนชำระ
```javascript
const processInstallment = async (sourceId: string, amount: number, terms: number) => {
  const response = await api.post('/api/payment/omise/installment', {
    amount,
    sourceId,
    installmentTerms: terms, // 3, 4, 6, 10 เดือน
    description: 'ผ่อนชำระค่าบริการคลินิก'
  });
  return response.data;
};
```

### 🏦 PromptPay QR Code

#### ตั้งค่า PromptPay ID
ใน `.env`:
```
PROMPTPAY_ID=0123456789
```
- ใช้เลขประจำตัวผู้เสียภาษี 13 หลัก หรือ
- ใช้เบอร์โทรศัพท์ 10 หลัก (ไม่ต้องใส่ 0 ข้างหน้า)

#### การใช้งาน - สร้าง QR Code
```javascript
const generatePromptPayQR = async (amount: number, billId: string) => {
  const response = await api.post('/api/payment/promptpay', {
    amount,
    billId
  });
  
  // response.data.qrCodeUrl คือ URL ของ QR Code
  return response.data;
};

// แสดง QR Code ในหน้า POS
<img src={qrCodeUrl} alt="PromptPay QR Code" />
```

### 💰 2C2P (Alternative)

#### วิธีสมัคร
1. ติดต่อ https://www.2c2p.com/th/contact-us
2. ส่งเอกสารประกอบ (ใบทะเบียนบริษัท, ภพ.20)
3. รอ approval (2-3 วันทำการ)
4. รับ Merchant ID และ Secret Key

#### การใช้งาน
```javascript
const process2C2PPayment = async (amount: number, orderId: string) => {
  const response = await api.post('/api/payment/2c2p/charge', {
    amount,
    orderId,
    description: 'ค่าบริการคลินิก'
  });
  
  // Redirect ไปยัง payment URL
  window.location.href = response.data.paymentUrl;
};
```

### 📊 ตรวจสอบสถานะการชำระเงิน
```javascript
const checkPaymentStatus = async (transactionId: string) => {
  const response = await api.get(`/api/payment/status/${transactionId}`);
  return response.data;
};
```

---

## 3. SMS Integration

### 📲 ThaiSMS (แนะนำสำหรับไทย)

#### วิธีสมัคร
1. ไปที่ https://www.thsms.com/
2. คลิก "สมัครสมาชิก"
3. เติมเครดิต (ราคาประมาณ 0.25-0.35 บาท/SMS)
4. ไปที่ API Settings → คัดลอก API Key

#### การตั้งค่า
ใน `.env`:
```
THAISMS_API_KEY=your_api_key_here
THAISMS_SECRET_KEY=your_secret_key_here
```

### 📱 การใช้งาน SMS

#### ส่ง OTP
```javascript
// ส่ง OTP
const sendOTP = async (phoneNumber: string) => {
  const response = await api.post('/api/sms/send-otp', {
    phoneNumber // Format: 0812345678
  });
  return response.data;
};

// ยืนยัน OTP
const verifyOTP = async (phoneNumber: string, otp: string) => {
  const response = await api.post('/api/sms/verify-otp', {
    phoneNumber,
    otp
  });
  return response.data;
};
```

#### ส่งข้อความแจ้งเตือนนัดหมาย
```javascript
const sendAppointmentSMS = async (data: {
  phoneNumber: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}) => {
  const response = await api.post('/api/sms/send-reminder', data);
  return response.data;
};
```

#### ส่งข้อความหลายคนพร้อมกัน (Bulk SMS)
```javascript
const sendBulkSMS = async (phoneNumbers: string[], message: string) => {
  const response = await api.post('/api/sms/bulk-send', {
    phoneNumbers,
    message
  });
  return response.data;
};

// ตัวอย่าง: แจ้งข่าวสารโปรโมชั่น
await sendBulkSMS(
  ['0812345678', '0823456789', '0834567890'],
  'โปรโมชั่นพิเศษ! รับส่วนลด 20% สำหรับลูกค้าประจำ สอบถามเพิ่มเติม: 02-xxx-xxxx'
);
```

---

## 4. Appointment System

### 📅 ระบบนัดหมายขั้นสูง

ระบบนัดหมายรองรับ:
- **Calendar-based Scheduling** - ตารางนัดหมายแบบปฏิทิน
- **Online Booking** - จองนัดหมายออนไลน์ (ไม่ต้อง login)
- **Automatic Reminders** - แจ้งเตือนอัตโนมัติผ่าน SMS + LINE
- **Recurring Appointments** - นัดหมายซ้ำ (รายวัน/รายสัปดาห์/รายเดือน)
- **Doctor Availability** - ตรวจสอบความว่างของแพทย์
- **Multi-channel Notifications** - แจ้งเตือนหลายช่องทาง

### 🔧 การใช้งาน Appointment API

#### ดึงรายการนัดหมาย
```javascript
// ดูนัดหมายรายวัน
const response = await api.get('/api/appointments', {
  params: {
    view: 'day',
    date: '2025-10-10'
  },
  headers: { Authorization: `Bearer ${token}` }
});

// ดูนัดหมายรายสัปดาห์
const response = await api.get('/api/appointments', {
  params: {
    view: 'week',
    startDate: '2025-10-06',
    endDate: '2025-10-12'
  },
  headers: { Authorization: `Bearer ${token}` }
});

// กรองตามแพทย์
const response = await api.get('/api/appointments', {
  params: {
    doctor: 'DOCTOR_ID',
    status: 'confirmed'
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

#### ตรวจสอบช่วงเวลาว่าง
```javascript
// ตรวจสอบว่ามีช่วงเวลานี้ว่างหรือไม่
const checkAvailability = async (date: string, timeSlot: string, doctorId?: string) => {
  const response = await api.get('/api/appointments/availability/check', {
    params: {
      date,
      timeSlot, // เช่น "09:00-10:00"
      doctor: doctorId
    },
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data.data.available; // true/false
};
```

#### ดูช่วงเวลาว่างทั้งหมด (สำหรับ Online Booking)
```javascript
const getAvailableSlots = async (date: string, duration: number = 60) => {
  const response = await api.get('/api/appointments/availability/slots', {
    params: {
      date,
      duration, // นาที
      doctorId: 'OPTIONAL_DOCTOR_ID'
    }
  });
  
  // response.data.data.slots = [
  //   { startTime: "09:00", endTime: "10:00", available: true },
  //   { startTime: "10:00", endTime: "11:00", available: false },
  //   ...
  // ]
  
  return response.data.data.slots.filter(slot => slot.available);
};
```

#### สร้างนัดหมายใหม่
```javascript
const createAppointment = async (data: {
  patient: string;
  appointmentDate: string;
  timeSlot: { start: string; end: string };
  services: Array<{ serviceName: string; estimatedDuration: number; price: number }>;
  assignedStaff?: { doctor?: string };
  notes?: string;
}) => {
  const response = await api.post('/api/appointments', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data.data;
};

// ตัวอย่าง
await createAppointment({
  patient: 'PATIENT_ID',
  appointmentDate: '2025-10-15',
  timeSlot: { start: '10:00', end: '11:00' },
  services: [{
    serviceName: 'Botox Injection',
    estimatedDuration: 60,
    price: 8000
  }],
  assignedStaff: { doctor: 'DOCTOR_ID' },
  notes: 'ลูกค้า VIP'
});
```

#### Online Booking (ไม่ต้อง login)
```javascript
const bookOnline = async (data: {
  patientInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    dateOfBirth: string;
    gender: string;
  };
  appointmentDate: string;
  timeSlot: string; // "10:00-11:00"
  services: Array<{ serviceName: string; estimatedDuration: number; price: number }>;
  notes?: string;
}) => {
  const response = await api.post('/api/appointments/online-booking', data);
  
  // response.data.data = {
  //   appointmentNumber: "APT20251010001",
  //   appointmentDate: "2025-10-15",
  //   timeSlot: { start: "10:00", end: "11:00" },
  //   patient: { ... }
  // }
  
  return response.data.data;
};
```

#### ส่งการแจ้งเตือนนัดหมาย
```javascript
const sendReminder = async (appointmentId: string, channels: string[] = ['sms', 'line']) => {
  const response = await api.post(
    `/api/appointments/${appointmentId}/send-reminder`,
    { channels },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // response.data.data = {
  //   sms: { sent: true, error: null },
  //   line: { sent: true, error: null }
  // }
  
  return response.data.data;
};
```

#### สร้างนัดหมายซ้ำ (Recurring Appointments)
```javascript
const createRecurringAppointments = async (data: {
  patient: string;
  startDate: string;
  endDate: string;
  timeSlot: string; // "10:00-11:00"
  frequency: 'daily' | 'weekly' | 'monthly';
  services: Array<any>;
  assignedStaff?: any;
  notes?: string;
}) => {
  const response = await api.post('/api/appointments/recurring', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data.data; // Array of created appointments
};

// ตัวอย่าง: สร้างนัดหมายทุกสัปดาห์เป็นเวลา 1 เดือน
await createRecurringAppointments({
  patient: 'PATIENT_ID',
  startDate: '2025-10-15',
  endDate: '2025-11-15',
  timeSlot: '14:00-15:00',
  frequency: 'weekly',
  services: [{
    serviceName: 'Botox Injection',
    estimatedDuration: 60,
    price: 8000
  }]
});
```

#### อัพเดตสถานะนัดหมาย
```javascript
const updateAppointmentStatus = async (
  appointmentId: string,
  status: 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
) => {
  const response = await api.patch(
    `/api/appointments/${appointmentId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return response.data.data;
};
```

#### ดูปฏิทินรายเดือน
```javascript
const getMonthlyCalendar = async (year: number, month: number) => {
  const response = await api.get(`/api/appointments/calendar/${year}/${month}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // response.data.data = {
  //   "2025-10-15": [
  //     { id: "...", time: "10:00", patient: {...}, status: "confirmed" },
  //     { id: "...", time: "14:00", patient: {...}, status: "pending" }
  //   ],
  //   "2025-10-16": [ ... ]
  // }
  
  return response.data.data;
};
```

### 🎯 สถานะนัดหมาย

| สถานะ | คำอธิบาย |
|-------|----------|
| `pending` | รอยืนยัน (ลูกค้าจองแต่ยังไม่ได้ยืนยัน) |
| `confirmed` | ยืนยันแล้ว (พนักงานยืนยันนัดหมาย) |
| `checked-in` | เช็คอินแล้ว (ลูกค้ามาถึงคลินิก) |
| `in-progress` | กำลังรักษา (กำลังให้บริการ) |
| `completed` | เสร็จสิ้น (รักษาเสร็จแล้ว) |
| `cancelled` | ยกเลิก (ยกเลิกนัดหมาย) |
| `no-show` | ไม่มา (ลูกค้าไม่มาตามนัด) |

### 📱 Frontend Components

ระบบมี 2 หน้าสำคัญ:

1. **`/appointments`** - หน้าจัดการนัดหมาย (สำหรับพนักงาน)
   - ดูนัดหมายแบบ Day/Week/Month/List
   - สร้าง/แก้ไข/ยกเลิกนัดหมาย
   - ส่งการแจ้งเตือน
   - อัพเดตสถานะ

2. **`/online-booking`** - หน้าจองนัดหมายออนไลน์ (สำหรับลูกค้า)
   - ไม่ต้อง login
   - เลือกบริการ
   - เลือกวันเวลา
   - กรอกข้อมูลส่วนตัว
   - รับ SMS ยืนยัน

---

## 5. การทดสอบระบบ
  return response.data;
};

// ตัวอย่าง: แจ้งข่าวสารโปรโมชั่น
await sendBulkSMS(
  ['0812345678', '0823456789', '0834567890'],
  'โปรโมชั่นพิเศษ! รับส่วนลด 20% สำหรับลูกค้าประจำ สอบถามเพิ่มเติม: 02-xxx-xxxx'
);
```

### 🌍 Twilio (สำหรับ SMS สากล)

#### วิธีสมัคร
1. ไปที่ https://www.twilio.com/try-twilio
2. สมัครบัญชีฟรี (ได้เครดิตทดลอง $15)
3. ยืนยันเบอร์โทรศัพท์
4. ไปที่ Console → คัดลอก Account SID และ Auth Token
5. ซื้อเบอร์โทรศัพท์ Twilio (ประมาณ $1/เดือน)

#### การตั้งค่า
ใน `.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12345678900
```

---

## 4. การทดสอบระบบ

### 🧪 ทดสอบ LINE API

#### ใช้ LINE Developer Console
```bash
# ทดสอบส่งข้อความ
curl -X POST https://api.line.me/v2/bot/message/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "to": "USER_ID",
    "messages": [{"type": "text", "text": "Test message"}]
  }'
```

#### ทดสอบผ่าน Backend API
```bash
# Test LINE Notify
curl -X POST http://localhost:5000/api/line/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Test notification"}'
```

### 💳 ทดสอบ Payment Gateway

#### Test Mode (Omise)
ใช้บัตรทดสอบ:
- Card Number: `4242424242424242`
- Expiry: อนาคต (เช่น `12/25`)
- CVV: `123`
- Name: ชื่ออะไรก็ได้

```bash
# ทดสอบผ่าน API
curl -X POST http://localhost:5000/api/payment/promptpay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 100, "billId": "BILL-001"}'
```

### 📱 ทดสอบ SMS

#### Development Mode
ในโหมด development (ไม่มี API Key), ระบบจะแสดง log แทน:
```javascript
console.log('SMS (Dev Mode):', { phoneNumber, message });
```

#### Production Test
```bash
# ทดสอบส่ง OTP
curl -X POST http://localhost:5000/api/sms/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "0812345678"}'

# ทดสอบยืนยัน OTP
curl -X POST http://localhost:5000/api/sms/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "0812345678", "otp": "123456"}'
```

---

## 📚 เอกสารอ้างอิง

### LINE API
- Official Docs: https://developers.line.biz/en/docs/messaging-api/
- LINE Notify: https://notify-bot.line.me/doc/en/

### Payment Gateway
- Omise Docs: https://docs.omise.co/
- 2C2P Docs: https://developer.2c2p.com/
- PromptPay Specification: https://www.bot.or.th/

### SMS Gateway
- ThaiSMS API: https://www.thsms.com/api-document
- Twilio Docs: https://www.twilio.com/docs/sms

---

## 💡 Tips & Best Practices

### Security
1. **ไม่แชร์ API Keys** - ใช้ environment variables เสมอ
2. **Verify Webhook Signatures** - ตรวจสอบ signature ของ webhook
3. **Use HTTPS** - ใช้ SSL/TLS ในการสื่อสารทั้งหมด
4. **Rate Limiting** - จำกัดจำนวน request เพื่อป้องกัน abuse

### Cost Optimization
1. **SMS**: ใช้ LINE หรือ Email สำหรับแจ้งเตือนทั่วไป, ใช้ SMS เฉพาะ OTP
2. **Payment**: เลือก gateway ที่มีค่าธรรมเนียมต่ำสุดตามประเภทธุรกิจ
3. **LINE**: ใช้ LINE Notify (ฟรี) สำหรับแจ้งเตือนทั่วไป

### Error Handling
```javascript
try {
  await sendLineNotification(message);
} catch (error) {
  // Fallback to SMS
  await sendSMS(phoneNumber, message);
}
```

---

## 🆘 Troubleshooting

### LINE API
- **Error: Invalid channel access token** → ตรวจสอบว่า token ถูกต้อง และไม่หมดอายุ
- **Webhook not working** → ตรวจสอบ URL และเปิด HTTPS

### Payment Gateway
- **Payment failed** → ตรวจสอบ API keys และ test card
- **QR Code not working** → ตรวจสอบ PromptPay ID format

### SMS
- **SMS not sent** → ตรวจสอบ credit balance และ phone number format
- **OTP expired** → OTP มีอายุ 5 นาที

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย:
- LINE: @kleara-clinic
- Email: support@kleara-clinic.com
- Tel: 02-xxx-xxxx
