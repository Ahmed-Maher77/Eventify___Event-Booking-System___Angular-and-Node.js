import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns/promises';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Usage:
//   SEED_ADMIN_PASSWORD='your-secure-password' node src/scripts/seedAdmin.js
//   node src/scripts/seedAdmin.js <adminEmail> <adminPassword> <adminName>
// Do not commit real passwords. Never log credentials.
const seedAdmin = async () => {
    try {
        const adminEmail =
            process.argv[2] || process.env.SEED_ADMIN_EMAIL || 'admin@eventify.local';
        const adminPassword =
            process.argv[3] || process.env.SEED_ADMIN_PASSWORD;
        const adminName = process.argv[4] || process.env.SEED_ADMIN_NAME || 'Eventify Admin';

        if (!adminPassword || String(adminPassword).length < 8) {
            console.error(
                'Missing or weak admin password. Pass as argv[3] or set SEED_ADMIN_PASSWORD (min 8 characters).',
            );
            process.exit(1);
        }

        console.log(`Seeding admin: ${adminEmail} (${adminName})`);

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
        console.log(`  Role: ${admin.role}`);
        console.log('\n⚠  Store credentials only in your secrets manager or local .env (never in git).');

        await mongoose.connection.close();
    } catch (error) {
        if (error?.message?.includes('querySrv ECONNREFUSED')) {
            console.error('✗ Error seeding admin account: MongoDB SRV lookup failed. Check DNS/network and try again.');
        }
        console.error('✗ Error seeding admin account:', error.message);
        process.exit(1);
    }
};

seedAdmin();
