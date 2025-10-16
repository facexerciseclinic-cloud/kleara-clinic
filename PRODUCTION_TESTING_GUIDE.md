# 🧪 Production Testing Guide - Mock Data Fixes

**Date:** October 16, 2025  
**Deployment Status:** ✅ LIVE  
**Testing Priority:** HIGH

---

## 🌐 Production URLs

```
✅ Client:  https://client-six-tau-64.vercel.app
✅ Server:  https://kleara-clinic-api.onrender.com
✅ Database: MongoDB Atlas (connected)
```

---

## 📋 Testing Checklist

### ✅ 1. Treatments Page (การรักษา)

**URL:** `https://client-six-tau-64.vercel.app` → Login → Treatments Menu

**What to Test:**

#### 1.1 Initial Load
- [ ] Page loads without errors
- [ ] Loading state appears briefly
- [ ] Console shows: `GET /api/treatments` request
- [ ] Data loads from real API (not mock data)

#### 1.2 Empty State (If No Data)
- [ ] Shows "ไม่พบข้อมูลการรักษา" message
- [ ] Shows helpful empty state illustration
- [ ] No console errors

#### 1.3 Data Display (If Data Exists)
- [ ] Table shows real treatment records
- [ ] Patient names display correctly
- [ ] HN numbers are real from database
- [ ] Dates and times are actual data
- [ ] Status chips show correct colors
- [ ] Cost displays in Thai Baht format

#### 1.4 Search Functionality
- [ ] Search by patient name works
- [ ] Search by HN works
- [ ] Search by service works
- [ ] Results filter in real-time

#### 1.5 Verify Real Data
Open Chrome DevTools (F12):
```javascript
// In Console tab, check:
1. Network tab → Filter: "treatments"
2. Look for: GET https://kleara-clinic-api.onrender.com/api/treatments
3. Click on request → Preview tab
4. Verify: response.data.success === true
5. Check: response.data.data.treatments array has real data
```

**Expected Result:** 
- ✅ NO `sampleTreatments` in code
- ✅ All data from `/api/treatments`
- ✅ Changes persist after refresh

**How to Verify It's Real:**
1. Note down a treatment record details
2. Refresh page (F5)
3. Same data should appear (not randomized)

---

### ✅ 2. Staff Page (จัดการเจ้าหน้าที่)

**URL:** `https://client-six-tau-64.vercel.app` → Staff Menu

**What to Test:**

#### 2.1 Initial Load
- [ ] Page loads without errors
- [ ] Loading state appears
- [ ] Console shows: `GET /api/staff` request
- [ ] Staff cards/table loads with real data

#### 2.2 Empty State (If No Staff)
- [ ] Shows "ไม่พบข้อมูลพนักงาน" message
- [ ] Shows "เพิ่มพนักงาน" button
- [ ] Contextual message based on filters

#### 2.3 Data Display
- [ ] Employee names are real
- [ ] Employee IDs match database
- [ ] Roles display correctly (doctor, nurse, etc.)
- [ ] Email and phone are real data
- [ ] Status badges show correct states

#### 2.4 Statistics Cards
- [ ] "พนักงานทั้งหมด" shows real count
- [ ] "ปฏิบัติงาน" shows active staff count
- [ ] "ออนไลน์" shows realistic numbers
- [ ] "แพทย์" shows doctor count

#### 2.5 Filter Functionality
- [ ] Role filter works (all, doctor, nurse, etc.)
- [ ] Status filter works (active, inactive)
- [ ] Search by name works
- [ ] Empty state appears when no results

**Verify Real Data:**
```javascript
// DevTools Console:
1. Network tab → "staff"
2. GET https://kleara-clinic-api.onrender.com/api/staff
3. Check response structure
4. Verify no "sampleStaff" references
```

**Expected Result:**
- ✅ NO `sampleStaff` array in code
- ✅ All data from `/api/staff`
- ✅ Stats calculate from real data

---

### ✅ 3. Reports Page (รายงานและสถิติ)

**URL:** `https://client-six-tau-64.vercel.app` → Reports Menu

**What to Test:**

#### 3.1 Initial Load
- [ ] Page loads without errors
- [ ] Loading state appears
- [ ] Multiple API calls in Network tab:
  - `GET /api/reports/dashboard`
  - `GET /api/analytics/revenue`
  - `GET /api/analytics/customer-retention`
  - `GET /api/inventory/alerts`

#### 3.2 Summary Cards
- [ ] "รายได้รวม" shows real total
- [ ] "การรักษาทั้งหมด" shows real count
- [ ] "รายได้เฉลี่ย" calculates correctly
- [ ] "อัตราการเติบโต" shows percentage

#### 3.3 Sales Chart
- [ ] Monthly data displays (if available)
- [ ] Chart shows actual revenue trends
- [ ] NOT hardcoded months (ม.ค., ก.พ., etc.)
- [ ] Data matches database records

#### 3.4 Top Treatments Table
- [ ] Shows real popular treatments
- [ ] Count and revenue are actual
- [ ] Growth rate calculates correctly
- [ ] NOT hardcoded "Botox หน้าผาก" etc.

#### 3.5 Customer Segments
- [ ] Real customer data displays
- [ ] Percentages calculate from actual data
- [ ] Revenue per segment is real

#### 3.6 Inventory Alerts
- [ ] Real low stock items display
- [ ] Stock levels are actual
- [ ] Status badges (critical/low/ok) are accurate

#### 3.7 Refresh Button
- [ ] Click "รีเฟรช" button
- [ ] Data reloads from API
- [ ] Updated data displays

**Verify Real Data:**
```javascript
// DevTools Console:
1. Network tab → Multiple requests:
   - reports/dashboard
   - analytics/revenue
   - analytics/customer-retention
   - inventory/alerts

2. Check each response
3. Verify data comes from database
4. NO hardcoded arrays like:
   - salesData = [{...}]
   - topTreatments = [{...}]
   - customerSegments = [{...}]
```

**Expected Result:**
- ✅ NO mock data arrays
- ✅ All charts show real data
- ✅ Multiple API endpoints used
- ✅ Data refreshes on demand

---

## 🔍 How to Verify Data is REAL vs MOCK

### Method 1: Chrome DevTools Network Tab
```
1. Open page
2. Press F12 → Network tab
3. Reload page (Ctrl+R)
4. Look for API calls to kleara-clinic-api.onrender.com
5. Click on request → Response tab
6. Verify data structure matches backend
```

### Method 2: Console Logging
```javascript
// In browser console, type:
console.log(window.performance.getEntriesByType('resource')
  .filter(r => r.name.includes('api'))
  .map(r => r.name))

// Should show API calls to Render.com
```

### Method 3: Database Check
```
1. Login to MongoDB Atlas
2. Browse Collections → treatments/staff/etc
3. Compare data shown in UI with database records
4. They should match exactly
```

### Method 4: Data Persistence
```
1. Note a specific data point (e.g., treatment cost)
2. Refresh page 3 times
3. If same data appears → REAL
4. If randomized → MOCK (should NOT happen)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "ไม่สามารถโหลดข้อมูลได้"
**Possible Causes:**
- Server is sleeping (Render free tier)
- Network timeout
- API endpoint error

**Solutions:**
1. Wait 30 seconds for server to wake up
2. Click refresh button
3. Check server status: `https://kleara-clinic-api.onrender.com/api/health`

---

### Issue 2: Page Shows Empty State
**Possible Causes:**
- No data in database yet
- Filter conditions too strict
- API returns empty array

**Solutions:**
1. Check if database has data for that collection
2. Clear all filters
3. Create test data if needed

---

### Issue 3: Old Mock Data Still Appears
**Possible Causes:**
- Browser cache
- Deployment not complete

**Solutions:**
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try incognito mode
4. Wait 2-3 minutes for Vercel to finish deploying

---

## ✅ Success Criteria

For each page to be considered "FIXED":

1. **NO mock data in source code** ✅
   - No `sampleTreatments`
   - No `sampleStaff`
   - No `salesData` arrays

2. **API calls visible in Network tab** ✅
   - GET requests to Render API
   - Response data matches UI

3. **Loading states work** ✅
   - Shows while fetching
   - Disappears after load

4. **Empty states work** ✅
   - Shows when no data
   - Contextual messages

5. **Data persists** ✅
   - Same data after refresh
   - Changes saved to database

6. **Error handling works** ✅
   - Shows error notification
   - Doesn't crash page

---

## 📊 Test Results Template

```markdown
## Test Results - [Date/Time]

### Treatments Page
- [ ] Initial load: PASS / FAIL
- [ ] Real API data: PASS / FAIL
- [ ] Search works: PASS / FAIL
- [ ] Empty state: PASS / FAIL
- [ ] Loading state: PASS / FAIL
- Notes: _____________

### Staff Page
- [ ] Initial load: PASS / FAIL
- [ ] Real API data: PASS / FAIL
- [ ] Filters work: PASS / FAIL
- [ ] Stats correct: PASS / FAIL
- [ ] Empty state: PASS / FAIL
- Notes: _____________

### Reports Page
- [ ] Initial load: PASS / FAIL
- [ ] Multiple APIs: PASS / FAIL
- [ ] Charts show real data: PASS / FAIL
- [ ] Refresh works: PASS / FAIL
- [ ] All tabs work: PASS / FAIL
- Notes: _____________

### Overall Status
- Fixed pages working: __/3
- Issues found: __
- Critical bugs: __
- Ready for production: YES / NO
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Update DEPLOYMENT_SUCCESS.md
2. Mark todos as complete
3. Continue with POS page fixes
4. Plan Notifications system

### If Issues Found ❌
1. Document specific errors
2. Check error logs in Render
3. Debug locally first
4. Push fixes to GitHub
5. Re-test after deploy

---

## 📞 Quick Reference

### Production URLs
```bash
# Client
https://client-six-tau-64.vercel.app

# Server Health Check
https://kleara-clinic-api.onrender.com/api/health

# API Base URL
https://kleara-clinic-api.onrender.com/api
```

### Key API Endpoints
```bash
# Treatments
GET https://kleara-clinic-api.onrender.com/api/treatments

# Staff
GET https://kleara-clinic-api.onrender.com/api/staff

# Reports & Analytics
GET https://kleara-clinic-api.onrender.com/api/reports/dashboard
GET https://kleara-clinic-api.onrender.com/api/analytics/revenue
GET https://kleara-clinic-api.onrender.com/api/analytics/customer-retention
GET https://kleara-clinic-api.onrender.com/api/inventory/alerts
```

### GitHub Repository
```bash
https://github.com/facexerciseclinic-cloud/kleara-clinic
```

---

**Testing By:** _____________  
**Date:** _____________  
**Status:** 🟢 READY FOR TESTING
