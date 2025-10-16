// MongoDB Initialization Script for Kleara Clinic
// Run this script with: node init-db.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;

    // Create collections
    console.log('Creating collections...');
    const collections = ['users', 'patients', 'appointments', 'treatments', 'bills', 'products', 'services', 'packages', 'packagepurchases'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
      } catch (error) {
        // Collection might already exist, that's okay
      }
    }
    console.log('✅ Collections ready\n');

    // Create indexes
    console.log('Creating indexes...');
    
    // Users indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Patients indexes
    await db.collection('patients').createIndex({ patientNumber: 1 }, { unique: true });
    await db.collection('patients').createIndex({ phoneNumber: 1 });
    await db.collection('patients').createIndex({ email: 1 });
    
    // Appointments indexes
    await db.collection('appointments').createIndex({ appointmentNumber: 1 }, { unique: true });
    await db.collection('appointments').createIndex({ patient: 1 });
    await db.collection('appointments').createIndex({ appointmentDate: 1 });
    
    // Products indexes
    await db.collection('products').createIndex({ productCode: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 1 });
    
    // Services indexes
    await db.collection('services').createIndex({ serviceCode: 1 }, { unique: true });
    await db.collection('services').createIndex({ name: 1 });
    
    console.log('✅ Indexes created\n');

    // Insert default admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@klearaclinic.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await db.collection('users').insertOne(adminUser);
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123\n');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️  Admin user already exists\n');
      } else {
        throw error;
      }
    }

    // Insert sample services
    console.log('Creating sample services...');
    const services = [
      {
        serviceCode: 'SRV001',
        name: 'Botox Treatment',
        category: 'Injectable',
        price: 3500,
        duration: 30,
        description: 'Botox injection for wrinkle reduction',
        isActive: true,
        createdAt: new Date()
      },
      {
        serviceCode: 'SRV002',
        name: 'Dermal Filler',
        category: 'Injectable',
        price: 8500,
        duration: 45,
        description: 'Hyaluronic acid filler',
        isActive: true,
        createdAt: new Date()
      },
      {
        serviceCode: 'SRV003',
        name: 'Laser Hair Removal',
        category: 'Laser',
        price: 2500,
        duration: 60,
        description: 'Permanent hair removal',
        isActive: true,
        createdAt: new Date()
      },
      {
        serviceCode: 'SRV004',
        name: 'Facial Treatment',
        category: 'Facial',
        price: 1500,
        duration: 90,
        description: 'Deep cleansing facial',
        isActive: true,
        createdAt: new Date()
      }
    ];

    try {
      await db.collection('services').insertMany(services);
      console.log('✅ Sample services created\n');
    } catch (error) {
      console.log('⚠️  Services might already exist\n');
    }

    // Insert sample products
    console.log('Creating sample products...');
    const products = [
      {
        productCode: 'PROD001',
        name: 'Vitamin C Serum',
        category: 'Skincare',
        price: 850,
        cost: 400,
        currentStock: 50,
        minStock: 10,
        unit: 'bottle',
        description: 'Brightening serum',
        isActive: true,
        createdAt: new Date()
      },
      {
        productCode: 'PROD002',
        name: 'Hyaluronic Acid Moisturizer',
        category: 'Skincare',
        price: 1200,
        cost: 600,
        currentStock: 30,
        minStock: 10,
        unit: 'jar',
        description: 'Hydrating moisturizer',
        isActive: true,
        createdAt: new Date()
      },
      {
        productCode: 'PROD003',
        name: 'Sunscreen SPF 50',
        category: 'Skincare',
        price: 650,
        cost: 300,
        currentStock: 100,
        minStock: 20,
        unit: 'tube',
        description: 'Broad spectrum protection',
        isActive: true,
        createdAt: new Date()
      }
    ];

    try {
      await db.collection('products').insertMany(products);
      console.log('✅ Sample products created\n');
    } catch (error) {
      console.log('⚠️  Products might already exist\n');
    }

    console.log('========================================');
    console.log('✅ DATABASE INITIALIZED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
