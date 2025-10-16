# 🎯 Quick Reference - Deployment Info

## 📅 Deployment Date: October 10, 2025

---

## 🌐 Your Production URLs

### Frontend (Client)
```
https://client-rggkn4oh9-tainnajas-projects.vercel.app
```
- Dashboard: https://vercel.com/tainnajas-projects/client
- Settings: https://vercel.com/tainnajas-projects/client/settings/environment-variables

### Backend (Server)
```
https://server-jc7a8k8u3-tainnajas-projects.vercel.app
```
- Dashboard: https://vercel.com/tainnajas-projects/server
- Settings: https://vercel.com/tainnajas-projects/server/settings/environment-variables

---

## ⚙️ Environment Variables Configuration

### 🔧 SERVER Environment Variables
Add these at: https://vercel.com/tainnajas-projects/server/settings/environment-variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/kleara_clinic` | ✓ Production ✓ Preview ✓ Development |
| `JWT_SECRET` | `kleara-clinic-secret-key-2025-production` | ✓ Production ✓ Preview ✓ Development |
| `NODE_ENV` | `production` | ✓ Production ✓ Preview ✓ Development |
| `FRONTEND_URL` | `https://client-rggkn4oh9-tainnajas-projects.vercel.app` | ✓ Production ✓ Preview ✓ Development |
| `PORT` | `5002` | ✓ Production ✓ Preview ✓ Development |

⚠️ **MONGODB_URI** - จะได้หลังจากสร้าง MongoDB Atlas เสร็จ

---

### 🔧 CLIENT Environment Variables
Add these at: https://vercel.com/tainnajas-projects/client/settings/environment-variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `REACT_APP_API_URL` | `https://server-jc7a8k8u3-tainnajas-projects.vercel.app/api` | ✓ Production ✓ Preview ✓ Development |
| `REACT_APP_ENV` | `production` | ✓ Production ✓ Preview ✓ Development |

---

## 🗄️ MongoDB Atlas Setup

### Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Gmail (FREE)

### Step 2: Create Cluster
1. Choose **FREE M0 Cluster**
2. Provider: **AWS**
3. Region: **Singapore (ap-southeast-1)**
4. Cluster Name: `kleara-clinic`
5. Click **Create**

### Step 3: Create Database User
1. Go to **Database Access** → **Add New Database User**
2. Username: `kleara_admin`
3. Password: `Kleara2025!` (or your own strong password)
4. Role: **Atlas Admin**
5. Click **Add User**

### Step 4: Network Access
1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere**
3. IP Address: `0.0.0.0/0`
4. Click **Confirm**

### Step 5: Get Connection String
1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Add database name at the end

**Example Connection String:**
```
mongodb+srv://kleara_admin:Kleara2025!@kleara-clinic.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
```

📝 **Save this connection string!** You'll need it for MONGODB_URI

---

## 🔄 After Setting Environment Variables

### Redeploy Both Projects
```powershell
# Redeploy Server
cd "C:\Clinic System\server"
vercel --prod

# Redeploy Client
cd "C:\Clinic System\client"
vercel --prod
```

---

## 🎯 Initialize Database

### Create Local .env File
Create `C:\Clinic System\server\.env`:
```env
MONGODB_URI=mongodb+srv://kleara_admin:Kleara2025!@kleara-clinic.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
JWT_SECRET=kleara-clinic-secret-key-2025-production
NODE_ENV=development
```

### Run Init Script
```powershell
cd "C:\Clinic System\server"
node init-db.js
```

**Expected Output:**
```
✅ Connected to MongoDB Atlas
✅ Database initialized successfully!
✅ Admin user created (username: admin, password: admin123)
✅ Sample services and products inserted
```

---

## 🧪 Testing Your Deployment

### 1. Test Frontend
Open: https://client-rggkn4oh9-tainnajas-projects.vercel.app

### 2. Login
- Username: `admin`
- Password: `admin123`

### 3. Test Features
- [ ] Dashboard loads
- [ ] Patients page works
- [ ] Appointments page works
- [ ] Treatments page works
- [ ] Inventory page works
- [ ] Staff page works
- [ ] Reports page works

---

## 🆘 Troubleshooting

### ❌ Cannot connect to database
**Solution:**
1. Check MONGODB_URI is correct in Vercel server settings
2. Verify MongoDB Network Access has `0.0.0.0/0`
3. Test connection string with MongoDB Compass
4. Redeploy server after adding MONGODB_URI

### ❌ CORS Error
**Solution:**
1. Check FRONTEND_URL in server environment variables
2. Must match client URL exactly (including https://)
3. Redeploy server

### ❌ 401 Unauthorized
**Solution:**
1. Run `node init-db.js` to create admin user
2. Check JWT_SECRET is same in all environments
3. Clear browser cookies and try again

### ❌ Page Not Found / 404
**Solution:**
1. Check client vercel.json has rewrites configuration
2. Redeploy client

---

## 📊 Deployment Status Checklist

- [x] ✅ Server deployed to Vercel
- [x] ✅ Client deployed to Vercel
- [ ] ⏳ Environment variables configured (SERVER)
- [ ] ⏳ Environment variables configured (CLIENT)
- [ ] ⏳ MongoDB Atlas created
- [ ] ⏳ MONGODB_URI added to server
- [ ] ⏳ Both projects redeployed
- [ ] ⏳ Database initialized
- [ ] ⏳ System tested

---

## 💾 Backup Information

### Save These Credentials Securely:

**Vercel Account:**
- Email: [your-email]
- Projects: server, client

**MongoDB Atlas:**
- Email: [your-email]
- Username: kleara_admin
- Password: Kleara2025!
- Database: kleara_clinic

**Application:**
- Admin Username: admin
- Admin Password: admin123

⚠️ **Important:** Change admin password after first login!

---

## 📞 Next Steps

1. ✅ Complete MongoDB Atlas setup
2. ✅ Add all environment variables to Vercel
3. ✅ Redeploy both projects
4. ✅ Initialize database
5. ✅ Test the system
6. ✅ Change admin password
7. ✅ Add real clinic data

---

**Last Updated:** October 10, 2025  
**Status:** ⏳ In Progress - Awaiting MongoDB setup
