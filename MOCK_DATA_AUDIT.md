# 🔍 Mock Data Audit Report - Kleara Clinic System

**Generated:** January 2025  
**Status:** Critical Issues Found  
**Priority:** Fix before continuing with new features

---

## 📊 Executive Summary

After comprehensive code review, I've identified **4 major pages** that are using hardcoded/mock data instead of real API connections. These pages appear functional in the UI but do NOT persist data to the database.

### Critical Findings:
- ✅ **Working with Real API:** 8 pages
- ❌ **Using Mock Data:** 4 pages
- ⚠️ **Partial Implementation:** 1 page

---

## ❌ PAGES USING MOCK DATA (Need Immediate Fix)

### 1. 🩺 **Treatments_Simple.tsx** - CRITICAL
**File:** `client/src/pages/Treatments_Simple.tsx`

**Issue:** 
- Uses hardcoded `sampleTreatments` array (lines 48-85)
- No API calls to backend
- Data stored only in component state `useState<Treatment[]>(sampleTreatments)`

**Backend Status:**
- ✅ Backend routes EXIST at `/api/treatments`
- ✅ Full CRUD operations available
- ✅ Model: `server/models/Treatment.js`
- ✅ Routes: `server/routes/treatments.js` (373 lines with full implementation)

**Required Actions:**
1. Remove `sampleTreatments` constant
2. Add `useEffect` to fetch from `/api/treatments`
3. Implement CREATE, UPDATE, DELETE operations
4. Connect to existing backend endpoints

**Estimated Time:** 2-3 hours

---

### 2. 🔔 **Notifications.tsx** - HIGH PRIORITY
**File:** `client/src/pages/Notifications.tsx`

**Issue:**
- Uses hardcoded notifications array (lines 48-96)
- 5 sample notifications in component state
- No real-time notification system
- No API integration

**Backend Status:**
- ⚠️ **NO route registered** for notifications
- ✅ Service exists: `server/services/notifications.js`
- ❌ Need to create: `server/routes/notifications.js`
- ❌ Need to create: `server/models/Notification.js`

**Required Actions:**
1. Create Notification model
2. Create notifications route with CRUD endpoints
3. Register route in `app.js`
4. Update frontend to fetch from API
5. Implement real-time updates (Socket.io or polling)

**Estimated Time:** 4-5 hours

---

### 3. 💰 **POS.tsx** - HIGH PRIORITY
**File:** `client/src/pages/POS.tsx`

**Issue:**
- Uses `sampleServices` array (lines 144-212)
- Services, discounts, payment methods all hardcoded
- Sales history stored in local state only
- No integration with billing API

**Backend Status:**
- ✅ Backend routes PARTIALLY EXIST
- ✅ Services Model: `server/models/Service.js` (180 lines)
- ✅ Products API: `/api/inventory/products`
- ✅ Billing API: `/api/billing` (332+ lines)
- ❌ NO dedicated Services CRUD route

**Required Actions:**
1. Create `/api/services` route for treatments/services
2. Fetch services from `/api/services` instead of sampleServices
3. Fetch products from `/api/inventory/products` (already exists)
4. Connect "Process Payment" to `/api/billing` (POST)
5. Link with loyalty points system (already implemented)
6. Save sales to database

**Estimated Time:** 5-6 hours

---

### 4. 📊 **Reports.tsx** - HIGH PRIORITY  
**File:** `client/src/pages/Reports.tsx`

**Issue:**
- All report data is hardcoded (lines 100-139)
- `salesData`, `topTreatments`, `customerSegments`, `inventoryAlerts` all mock
- No API calls to backend
- Charts and graphs show fake data

**Backend Status:**
- ✅ Backend routes EXIST at `/api/reports`
- ✅ Analytics routes at `/api/analytics`
- ✅ Multiple endpoints available:
  - `/api/reports/dashboard`
  - `/api/analytics/revenue`
  - `/api/analytics/customer-retention`
  - `/api/analytics/inventory`
  - `/api/analytics/staff-performance`

**Required Actions:**
1. Remove all hardcoded data arrays
2. Fetch data from `/api/reports/dashboard`
3. Use `/api/analytics/*` endpoints for detailed reports
4. Implement loading states
5. Add export functionality using `/api/analytics/export`

**Estimated Time:** 3-4 hours

---

## ⚠️ PARTIALLY IMPLEMENTED

### 5. 👥 **Staff.tsx** - NEEDS COMPLETION
**File:** `client/src/pages/Staff.tsx`

**Issue:**
- Has `sampleStaff` array (lines 71-onwards)
- TODO comment at line 438: `// TODO: implement real-time status`
- **BUT** also has API integration (line 192: `api.get('/staff')`)
- Mixed implementation - some features use API, others use mock data

**Backend Status:**
- ✅ Backend routes EXIST at `/api/staff`
- ✅ Full CRUD implementation

**Required Actions:**
1. Remove `sampleStaff` completely
2. Ensure all operations use API
3. Implement real-time status feature
4. Test all CRUD operations

**Estimated Time:** 2 hours

---

## ✅ PAGES ALREADY CONNECTED TO REAL API

### Working Correctly:
1. ✅ **Login.tsx** - Uses `/api/auth/login`
2. ✅ **Dashboard.tsx** - Uses `/api/reports/dashboard`
3. ✅ **Patients_Simple.tsx** - Uses `/api/patients` (lines 159+)
4. ✅ **Appointments.tsx** - Uses `/api/appointments` (line 116)
5. ✅ **Inventory.tsx** - Uses `/api/inventory/products` (line 143)
6. ✅ **Sessions.tsx** - Uses `/api/auth/refresh-tokens` (line 38)
7. ✅ **Settings.tsx** - Uses `/api/settings` (line 38)
8. ✅ **OnlineBooking.tsx** - Uses API calls (line 29)
9. ✅ **PatientDashboard.tsx** (Portal) - Uses `/api/portal/*` (lines 112-150)

---

## 🗄️ BACKEND ROUTES INVENTORY

### Fully Implemented Routes:
```
✅ /api/auth            - Authentication (login, register, tokens)
✅ /api/patients        - Patient management (CRUD)
✅ /api/appointments    - Appointment management
✅ /api/treatments      - Treatment records (NEEDS FRONTEND)
✅ /api/billing         - Bills and payments
✅ /api/inventory       - Product/inventory management
✅ /api/staff           - Staff management
✅ /api/reports         - Reports and analytics
✅ /api/analytics       - Advanced analytics (NEEDS FRONTEND)
✅ /api/integrations    - Third-party integrations
✅ /api/line            - LINE messaging
✅ /api/payment         - Payment processing
✅ /api/sms             - SMS notifications
✅ /api/storage         - File storage
✅ /api/packages        - Treatment packages
✅ /api/audit           - Audit logs
✅ /api/loyalty         - Loyalty points (NEW)
✅ /api/settings        - System settings
✅ /api/portal          - Patient portal (NEW)
✅ /api/referral        - Referral program (NEW)
```

### Missing Routes (Need Creation):
```
❌ /api/notifications   - System notifications
❌ /api/services        - Services/treatments catalog for POS
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1 - Quick Wins (1-2 days)
1. **Treatments** - Backend exists, just connect frontend
2. **Staff** - Remove mock data, complete implementation
3. **Reports** - Backend exists, just connect frontend

### Phase 2 - Medium Effort (2-3 days)  
4. **POS** - Create services route, connect billing
5. **Notifications** - Full backend + frontend implementation

### Total Estimated Time: **4-5 days**

---

## 📋 DETAILED ACTION PLAN

### For Treatments (High Priority):

```typescript
// client/src/pages/Treatments_Simple.tsx

// REMOVE THIS:
const sampleTreatments: Treatment[] = [...]

// ADD THIS:
useEffect(() => {
  fetchTreatments();
}, []);

const fetchTreatments = async () => {
  try {
    setLoading(true);
    const response = await api.get('/treatments');
    if (response.data.success) {
      setTreatments(response.data.data.treatments || []);
    }
  } catch (err) {
    console.error('Failed to fetch treatments', err);
    showNotification('ไม่สามารถโหลดข้อมูลการรักษาได้', 'error');
  } finally {
    setLoading(false);
  }
};
```

### For Notifications (Create New):

**Step 1: Create Model**
```javascript
// server/models/Notification.js
const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['appointment', 'payment', 'patient', 'inventory', 'system'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  read: { type: Boolean, default: false },
  actionUrl: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});
```

**Step 2: Create Route**
```javascript
// server/routes/notifications.js
router.get('/', auth, async (req, res) => {
  const notifications = await Notification.find({ 
    userId: req.user.id,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
  res.json({ success: true, data: notifications });
});

router.patch('/:id/read', auth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});
```

**Step 3: Register in app.js**
```javascript
app.use('/api/notifications', require('./routes/notifications'));
```

**Step 4: Update Frontend**
```typescript
// client/src/pages/Notifications.tsx
const [notifications, setNotifications] = useState<Notification[]>([]);

useEffect(() => {
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
  return () => clearInterval(interval);
}, []);

const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  setNotifications(response.data.data);
};
```

---

## 🔧 BACKEND ROUTES THAT NEED FRONTEND CONNECTION

These backend routes exist but are NOT used by frontend:

1. **Analytics Routes** (`/api/analytics/*`)
   - `/api/analytics/revenue` - Revenue analytics
   - `/api/analytics/customer-retention` - Customer retention
   - `/api/analytics/inventory` - Inventory analytics
   - `/api/analytics/staff-performance` - Staff KPIs
   - `/api/analytics/predictive/demand` - AI demand forecasting
   - `/api/analytics/export` - Export reports

2. **Billing Advanced Features** (`/api/billing/*`)
   - `/api/billing/:id/refund` - Refund processing
   - `/api/billing/reports/daily` - Daily billing reports

3. **Inventory Advanced** (`/api/inventory/*`)
   - `/api/inventory/alerts` - Low stock alerts
   - `/api/inventory/reports` - Inventory reports
   - `/api/inventory/lots/:productId/:lotId/status` - Lot management

4. **Line Integration** (`/api/line/*`)
   - `/api/line/notify` - Send LINE notifications
   - `/api/line/push` - Push messages
   - `/api/line/appointment-reminder` - Auto reminders

---

## 🎨 FRONTEND PATTERNS TO FOLLOW

### Example from Working Page (Patients):

```typescript
// Good Example: Patients_Simple.tsx
const [patients, setPatients] = useState<Patient[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchPatients();
}, []);

const fetchPatients = async () => {
  setLoading(true);
  try {
    const response = await api.get('/patients');
    if (response.data.success) {
      const transformedPatients = response.data.data.map((p: any) => ({
        id: p._id,
        hn: p.hn,
        name: `${p.profile.firstName} ${p.profile.lastName}`,
        // ... transform other fields
      }));
      setPatients(transformedPatients);
    }
  } catch (err) {
    setError('Failed to load patients');
    showNotification('ไม่สามารถโหลดข้อมูลได้', 'error');
  } finally {
    setLoading(false);
  }
};
```

**Apply this pattern to:**
- Treatments page
- Notifications page  
- Reports page
- POS page

---

## 🧪 TESTING CHECKLIST

After fixing each page, test:

1. ✅ Data loads from API on page mount
2. ✅ Loading states display correctly
3. ✅ Error handling works (disconnect network and test)
4. ✅ CRUD operations persist to database
5. ✅ Data refreshes after operations
6. ✅ No console errors
7. ✅ MongoDB data visible in database
8. ✅ Production deployment reflects changes

---

## 📈 SUCCESS METRICS

### Before Fix:
- 4 pages with mock data
- 0% data persistence for those pages
- User actions lost on refresh

### After Fix:
- 100% pages connected to real API
- Full data persistence
- Production-ready application
- Ready for new feature development

---

## 🚀 NEXT STEPS

1. **Prioritize:** Start with Treatments (easiest - backend exists)
2. **Test:** Verify each fix in local development
3. **Deploy:** Push to production after each fix
4. **Validate:** Test in production environment
5. **Continue:** Resume Features 4-30 after all fixes complete

---

## 📞 SUPPORT NEEDED

When implementing fixes, remember:
- Use existing `api.ts` service for all API calls
- Follow patterns from working pages (Patients, Appointments, etc.)
- Use `useNotifications()` context for user feedback
- Implement proper loading and error states
- Test with real data before deployment

---

**Status:** Ready for implementation  
**Reviewed by:** AI Assistant  
**Date:** January 2025  
**Approved for:** Immediate action
