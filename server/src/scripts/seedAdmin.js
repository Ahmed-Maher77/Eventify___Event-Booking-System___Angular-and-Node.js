import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });

// command: 
    // node src/scripts/seedAdmin.js <adminEmail> <adminPassword> <adminName>
    // or: node src/scripts/seedAdmin.js
const seedAdmin = async () => {
    try {
        // Admin account details
        const adminEmail = process.argv[2] || 'admin@eventify.com';
        const adminPassword = process.argv[3] || 'Admin@123';
        const adminName = process.argv[4] || 'Eventify Admin';

        console.log(adminEmail, adminPassword, adminName);

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });

        if (existingAdmin) {
            console.log('✓ Admin account already exists. No changes made.');
            console.log(`  Email: ${existingAdmin.email}`);
            console.log(`  Name: ${existingAdmin.name}`);
            await mongoose.connection.close();
            return;
        }

        // Create admin account
        const admin = new User({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin'
        });

        await admin.save();

        console.log('✓ Admin account created successfully!');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
        console.log(`  Role: ${admin.role}`);
        console.log('\n⚠  Please change the default password in production!');

        await mongoose.connection.close();
    } catch (error) {
        console.error('✗ Error seeding admin account:', error.message);
        process.exit(1);
    }
};

seedAdmin();
