import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/khelnow';

async function createAdmin() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Admin@123', 10);

  await db.collection('users').updateOne(
    { email: 'admin@playsphere.com' },
    {
      $set: {
        name: 'PlaySphere Admin',
        fullName: 'PlaySphere Admin',
        username: 'admin',
        email: 'admin@playsphere.com',
        password: hash,
        role: 'ADMIN',
        adminLevel: 'SUPERADMIN',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log('✅ PlaySphere Superadmin successfully registered:');
  console.log('   Email:    admin@playsphere.com');
  console.log('   Username: admin');
  console.log('   Password: Admin@123');
  console.log('   Role:     ADMIN (SUPERADMIN)');

  await mongoose.disconnect();
}

createAdmin().catch(console.error);
