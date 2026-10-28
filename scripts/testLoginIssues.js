import assert from 'assert';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcryptjs';

async function runLoginRepro() {
  console.log('🧪 Running Phase 2 Login Reproduction Tests...\n');
  await connectDB();

  // 1. Create a legacy user with plain-text password to test legacy migration
  await User.deleteOne({ email: 'legacy@playsphere.test' });
  const rawLegacy = await User.collection.insertOne({
    name: 'Legacy Athlete',
    username: 'legacy_user',
    email: 'legacy@playsphere.test',
    password: 'PlainPassword123', // unhashed legacy password in DB
    role: 'PLAYER',
    isActive: true,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Created legacy user with plain text password in DB:', rawLegacy.insertedId);

  // Test Case A: Login with `identifier` field (standard UML requirement)
  console.log('\n--- Test A: Login with identifier field ---');
  const resA = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'arjun@ahd.com', password: 'Password123!' });
  console.log('Status:', resA.status, 'Response:', resA.body.message || resA.body);

  // Test Case B: Login with @username
  console.log('\n--- Test B: Login with @username ---');
  const resB = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '@arjun_host', password: 'Password123!' });
  console.log('Status:', resB.status, 'Response:', resB.body.message || resB.body);

  // Test Case C: Login with legacy plain-text password & verify migration
  console.log('\n--- Test C: Login with legacy plain text password ---');
  const resC = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'legacy_user', password: 'PlainPassword123' });
  console.log('Status:', resC.status, 'Response:', resC.body.message || resC.body);

  // Test Case D: Wrong password returns 401 "Invalid credentials"
  console.log('\n--- Test D: Wrong password ---');
  const resD = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'arjun@ahd.com', password: 'WrongPassword999!' });
  console.log('Status:', resD.status, 'Response:', resD.body.message || resD.body);

  // Test Case E: Missing fields returns 400
  console.log('\n--- Test E: Missing password ---');
  const resE = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'arjun@ahd.com' });
  console.log('Status:', resE.status, 'Response:', resE.body.message || resE.body);

  await User.deleteOne({ email: 'legacy@playsphere.test' });
  await disconnectDB();
}

runLoginRepro().catch((err) => {
  console.error(err);
  process.exit(1);
});
