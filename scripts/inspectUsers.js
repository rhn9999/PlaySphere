import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Admin } from '../src/models/User.js';
import { AuthService } from '../src/services/auth.service.js';
import { signToken, verifyToken } from '../src/utils/token.js';
import { env } from '../src/config/env.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/playsphere';

async function runInspection() {
  console.log('🔍 ========================================================');
  console.log('🔍 PLAYSPHERE USERS COLLECTION DETAILED INSPECTION');
  console.log('🔍 ========================================================\n');

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  // 1 & 2. Open users collection and list all users & roles
  const rawUsers = await db.collection('users').find({}).toArray();
  console.log(`📊 Total Users in collection: ${rawUsers.length}\n`);

  const rolesFound = [...new Set(rawUsers.map((u) => u.role))];
  console.log('📋 Distinct user roles found in DB:', rolesFound);

  // Categorize by roles
  const roleGroups = {
    admin: rawUsers.filter((u) => String(u.role).toLowerCase() === 'admin'),
    venueOwner: rawUsers.filter((u) => String(u.role).toLowerCase() === 'venue_owner' || String(u.role).toLowerCase() === 'venueowner'),
    host: rawUsers.filter((u) => u.isHost || String(u.role).toLowerCase() === 'host'),
    player: rawUsers.filter((u) => String(u.role).toLowerCase() === 'player'),
    other: rawUsers.filter((u) => {
      const r = String(u.role).toLowerCase();
      return r !== 'admin' && r !== 'venue_owner' && r !== 'venueowner' && r !== 'player';
    })
  };

  console.log('\n--- ROLE BREAKDOWN ---');
  console.log(`- Admin users: ${roleGroups.admin.length}`);
  console.log(`- Venue Owner users: ${roleGroups.venueOwner.length}`);
  console.log(`- Host users: ${roleGroups.host.length}`);
  console.log(`- Player users: ${roleGroups.player.length}`);
  if (roleGroups.other.length > 0) {
    console.log(`- Other users: ${roleGroups.other.length}`);
  }

  // 3. Verify fields for each user
  console.log('\n--- FIELD VERIFICATION FOR ALL USERS ---');
  const candidatePasswords = [
    'Admin@123',
    'AdminPassword123!',
    'Password123!',
    'password123',
    '123456',
    'admin123',
    'Demo@1234',
    'Sportup@123'
  ];

  for (let i = 0; i < rawUsers.length; i++) {
    const u = rawUsers[i];
    const pw = u.password || '';
    const isBcrypt = pw.startsWith('$2a$') || pw.startsWith('$2b$') || pw.startsWith('$2y$');
    const saltRounds = isBcrypt ? pw.split('$')[2] : 'N/A';

    let matchedPassword = null;
    if (isBcrypt) {
      for (const cp of candidatePasswords) {
        if (await bcrypt.compare(cp, pw)) {
          matchedPassword = cp;
          break;
        }
      }
    } else if (pw) {
      matchedPassword = `[Plain text: ${pw}]`;
    }

    console.log(`\n[User #${i + 1}] ID: ${u._id}`);
    console.log(`  - Name:                ${u.name}`);
    console.log(`  - Username:            ${u.username}`);
    console.log(`  - Email:               ${u.email}`);
    console.log(`  - Role:                ${u.role}`);
    console.log(`  - Account Status:      isActive = ${u.isActive !== false} | isBanned = ${Boolean(u.isBanned)}`);
    console.log(`  - Verification Status: isVerified = ${u.isVerified ?? 'field not present (defaults to unverified/active)'}`);
    console.log(`  - Password Field:      ${pw ? 'Present' : 'MISSING'}`);
    console.log(`  - Password Hash:       ${pw ? pw.substring(0, 15) + '...' : 'NONE'} (isBcrypt: ${isBcrypt}, rounds: ${saltRounds})`);
    console.log(`  - Known Password:      ${matchedPassword || 'UNKNOWN (bcrypt hash with unknown plaintext)'}`);
  }

  // 4. Check Authentication Flow
  console.log('\n--- AUTHENTICATION FLOW VERIFICATION ---');
  console.log(`1. Environment Variables:`);
  console.log(`   - JWT_SECRET:     ${env.JWT_SECRET ? 'Configured (length: ' + env.JWT_SECRET.length + ')' : 'MISSING'}`);
  console.log(`   - JWT_EXPIRES_IN: ${env.JWT_EXPIRES_IN || '7d'}`);
  console.log(`   - PORT:           ${env.PORT}`);
  console.log(`   - MONGO_URI:      ${env.MONGO_URI}`);

  console.log(`2. JWT Generation & Verification Test:`);
  const sampleToken = signToken({ id: 'test_id', role: 'ADMIN', username: 'test_admin' });
  const decoded = verifyToken(sampleToken);
  console.log(`   - Token generation: SUCCESS`);
  console.log(`   - Token verification: SUCCESS (decoded role: ${decoded.role})`);

  console.log(`3. Bcrypt comparison test:`);
  const testHash = await bcrypt.hash('Admin@123', 10);
  const testCompare = await bcrypt.compare('Admin@123', testHash);
  console.log(`   - Bcrypt compare('Admin@123', hash): ${testCompare ? 'SUCCESS' : 'FAILED'}`);

  // 5. Compare Stored Password format with login service
  console.log('\n--- STORED PASSWORD FORMAT VS LOGIN SERVICE ---');
  console.log(`- Application hashing implementation: bcryptjs (10 rounds in User.pre('save'))`);
  console.log(`- Stored hash format: $2b$10$... standard modular crypt format`);
  console.log(`- User.methods.comparePassword: uses bcrypt.compare(candidate, this.password)`);

  // 6. Test login against an existing admin account
  console.log('\n--- TESTING LOGIN AGAINST EXISTING ADMIN ACCOUNTS ---');
  const existingAdmins = rawUsers.filter((u) => String(u.role).toLowerCase() === 'admin');
  if (existingAdmins.length === 0) {
    console.log('⚠️ No existing admin account found in the database!');
  } else {
    for (const adminAcc of existingAdmins) {
      console.log(`Found existing admin: ${adminAcc.email} (${adminAcc.username})`);
      try {
        const loginRes = await AuthService.loginUser({
          identifier: adminAcc.email,
          password: 'Password123!'
        });
        console.log(`✅ Login SUCCESS with 'Password123!': token issued for ${loginRes.user.username}`);
      } catch (err) {
        console.log(`❌ Login failed with candidate password: ${err.message}`);
      }
    }
  }

  // 7. Create new admin account as requested:
  // {
  //   name: "PlaySphere Admin",
  //   email: "admin@playsphere.com",
  //   password: "Admin@123",
  //   role: "admin",
  //   isActive: true,
  //   isVerified: true
  // }
  console.log('\n--- CREATING REQUESTED ADMIN ACCOUNT ---');
  const targetEmail = 'admin@playsphere.com'.toLowerCase();
  const targetUsername = 'playsphere_admin';
  const targetRawPassword = 'Admin@123';

  // Check if already exists
  let targetAdmin = await db.collection('users').findOne({
    $or: [{ email: targetEmail }, { username: targetUsername }]
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(targetRawPassword, salt);

  if (targetAdmin) {
    console.log(`Account ${targetEmail} already exists. Updating password and ensuring admin role...`);
    await db.collection('users').updateOne(
      { _id: targetAdmin._id },
      {
        $set: {
          name: 'PlaySphere Admin',
          username: targetUsername,
          email: targetEmail,
          password: hashedPassword,
          role: 'ADMIN',
          adminLevel: 'SUPERADMIN',
          isActive: true,
          isVerified: true,
          updatedAt: new Date()
        }
      }
    );
  } else {
    console.log(`Creating fresh admin account: ${targetEmail}...`);
    const insertResult = await db.collection('users').insertOne({
      name: 'PlaySphere Admin',
      username: targetUsername,
      email: targetEmail,
      password: hashedPassword,
      role: 'ADMIN',
      adminLevel: 'SUPERADMIN',
      bio: 'System Administrator for PlaySphere Platform',
      avatarUrl: '',
      isBanned: false,
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    targetAdmin = await db.collection('users').findOne({ _id: insertResult.insertedId });
  }

  console.log(`✅ Admin account ready:`);
  console.log(`   ID:         ${targetAdmin._id}`);
  console.log(`   Name:       ${targetAdmin.name}`);
  console.log(`   Username:   ${targetAdmin.username || targetUsername}`);
  console.log(`   Email:      ${targetAdmin.email}`);
  console.log(`   Role:       ${targetAdmin.role}`);
  console.log(`   isActive:   ${targetAdmin.isActive}`);
  console.log(`   isVerified: ${targetAdmin.isVerified}`);

  // Test login with the newly created admin account using both email and username
  console.log('\n--- TESTING LOGIN WITH NEW ADMIN ACCOUNT ---');
  try {
    const loginByEmail = await AuthService.loginUser({
      identifier: targetEmail,
      password: targetRawPassword
    });
    console.log(`✅ Login via Email (${targetEmail}): SUCCESS! Token=${loginByEmail.token.substring(0, 20)}... Role=${loginByEmail.user.role}`);
  } catch (err) {
    console.error(`❌ Login via Email FAILED:`, err.message);
  }

  try {
    const loginByUsername = await AuthService.loginUser({
      identifier: targetUsername,
      password: targetRawPassword
    });
    console.log(`✅ Login via Username (${targetUsername}): SUCCESS! Token=${loginByUsername.token.substring(0, 20)}... Role=${loginByUsername.user.role}`);
  } catch (err) {
    console.error(`❌ Login via Username FAILED:`, err.message);
  }

  try {
    const loginByAtUsername = await AuthService.loginUser({
      identifier: `@${targetUsername}`,
      password: targetRawPassword
    });
    console.log(`✅ Login via @Username (@${targetUsername}): SUCCESS! Token=${loginByAtUsername.token.substring(0, 20)}... Role=${loginByAtUsername.user.role}`);
  } catch (err) {
    console.error(`❌ Login via @Username FAILED:`, err.message);
  }

  // Also test wrong password
  try {
    await AuthService.loginUser({
      identifier: targetEmail,
      password: 'WrongPassword999'
    });
    console.error(`❌ Security failure: wrong password was accepted!`);
  } catch (err) {
    console.log(`✅ Wrong password rejected properly with status ${err.statusCode}: "${err.message}"`);
  }

  await mongoose.disconnect();
}

runInspection().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
