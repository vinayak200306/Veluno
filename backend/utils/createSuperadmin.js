const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// Create superadmin
const createSuperadmin = async () => {
    try {
        await connectDB();

        // Check if superadmin already exists
        const existingSuperadmin = await Admin.findOne({ role: 'superadmin' });

        if (existingSuperadmin) {
            console.log('⚠️  Superadmin already exists!');
            console.log('Email:', existingSuperadmin.email);
            process.exit(0);
        }

        // Create superadmin
        const superadmin = await Admin.create({
            name: 'Super Admin',
            email: 'admin@veluno.com',
            password: 'Admin@123456', // Change this password after first login!
            role: 'superadmin'
        });

        console.log('✅ Superadmin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', superadmin.email);
        console.log('🔑 Password: Admin@123456');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT: Change this password immediately after first login!');

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// Run the script
createSuperadmin();
