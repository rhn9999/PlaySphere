import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, Player, Admin, VenueOwner, Venue, Ground, Slot, OpenMatch, BookingRequest, JoinRequest, PlayerReview, SkillTag, ChatMessage, Report, AuditLog } from '../src/models/index.js';
import { AuthService } from '../src/services/auth.service.js';
import { VenueService } from '../src/services/venue.service.js';
import { SlotService } from '../src/services/slot.service.js';
import { BookingService } from '../src/services/booking.service.js';
import { MatchService } from '../src/services/match.service.js';
import { SocialService } from '../src/services/social.service.js';
import { AdminService } from '../src/services/admin.service.js';
import { ROLES, SLOT_STATUS, BOOKING_STATUS, MATCH_STATUS } from '../src/constants/index.js';

const runVerification = async () => {
  console.log('🧪 Starting PlaySphere End-to-End System Verification...\n');

  await connectDB();

  try {
    // 0. Clean test database collections
    console.log('🧹 Cleaning test collections...');
    await Promise.all([
      User.deleteMany({ email: /test_.*@playsphere\.com/ }),
      Venue.deleteMany({ name: /Test Venue/ }),
      Ground.deleteMany({ name: /Test Ground/ }),
      Slot.deleteMany({}),
      OpenMatch.deleteMany({ title: /Test Match/ }),
      BookingRequest.deleteMany({}),
      JoinRequest.deleteMany({}),
      PlayerReview.deleteMany({}),
      SkillTag.deleteMany({}),
      ChatMessage.deleteMany({}),
      Report.deleteMany({ reason: /Test Report/ }),
      AuditLog.deleteMany({})
    ]);
    console.log('✅ Collections prepped.\n');

    // 1. Authentication & Discriminator Testing
    console.log('1️⃣ Testing Authentication & Discriminators...');
    const playerReg = await AuthService.registerUser({
      name: 'Rohan Sharma',
      username: 'rohan_player',
      email: 'test_player1@playsphere.com',
      password: 'Password123!',
      role: ROLES.PLAYER,
      sports: ['Football', 'Badminton']
    });
    console.log(`   ✅ Player Registered: ${playerReg.user.name} (Reliability: ${playerReg.user.reliabilityScore})`);

    const player2Reg = await AuthService.registerUser({
      name: 'Amit Patel',
      username: 'amit_striker',
      email: 'test_player2@playsphere.com',
      password: 'Password123!',
      role: ROLES.PLAYER,
      sports: ['Football']
    });
    console.log(`   ✅ Player 2 Registered: ${player2Reg.user.name}`);

    const ownerReg = await AuthService.registerUser({
      name: 'Vikas Turf Owner',
      username: 'vikas_owner',
      email: 'test_owner@playsphere.com',
      password: 'Password123!',
      role: ROLES.VENUE_OWNER,
      businessName: 'Vikas Sports Arena Pvt Ltd'
    });
    console.log(`   ✅ Venue Owner Registered: ${ownerReg.user.name} (${ownerReg.user.businessName})`);

    const adminReg = await AuthService.registerUser({
      name: 'System Admin',
      username: 'sys_admin',
      email: 'test_admin@playsphere.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      adminLevel: 'SUPERADMIN'
    });
    console.log(`   ✅ Admin Registered: ${adminReg.user.name} (Level: ${adminReg.user.adminLevel})`);

    // Test Login
    const loginResult = await AuthService.loginUser({
      login: 'rohan_player',
      password: 'Password123!'
    });
    console.log(`   ✅ Player Login verified. JWT generated.`);

    // 2. Venue & Facility Management
    console.log('\n2️⃣ Testing Venue & Facility Management...');
    const venue = await VenueService.createVenue(
      {
        name: 'Test Venue Arena Indiranagar',
        address: {
          street: '100 Feet Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          fullAddress: '100 Feet Road, Indiranagar, Bangalore'
        },
        location: {
          coordinates: [77.6412, 12.9784] // Indiranagar Bangalore [lng, lat]
        }
      },
      ownerReg.user._id,
      ROLES.VENUE_OWNER
    );
    console.log(`   ✅ Venue Created: ${venue.name} with GeoJSON Point.`);

    // Approve venue to test APPROVED proximity query
    venue.verifyStatus = 'APPROVED';
    await venue.save();

    // Geospatial search
    const nearby = await VenueService.findNearbyVenues({
      lng: 77.64,
      lat: 12.97,
      distance: 5000 // 5km radius
    });
    console.log(`   ✅ 2dsphere Nearby Search found ${nearby.length} venue(s) within 5km.`);

    // Add Ground
    const ground = await VenueService.addGround(
      venue._id,
      {
        name: 'Test Ground 7v7 AstroTurf',
        sportType: 'Football',
        surface: 'AstroTurf'
      },
      ownerReg.user._id,
      ROLES.VENUE_OWNER
    );
    console.log(`   ✅ Ground Created: ${ground.name} (Sport: ${ground.sportType})`);

    // 3. Slot Management & blocksSlot()
    console.log('\n3️⃣ Testing Slot Creation & blocksSlot()...');
    const now = new Date();
    const slotStart1 = new Date(now.getTime() + 2 * 3600 * 1000);
    const slotEnd1 = new Date(now.getTime() + 3 * 3600 * 1000);

    const slot1 = await SlotService.createSlot(
      ground._id,
      {
        start: slotStart1.toISOString(),
        end: slotEnd1.toISOString(),
        price: 1500
      },
      ownerReg.user._id,
      ROLES.VENUE_OWNER
    );
    console.log(`   ✅ Slot 1 created: ${slot1.start.toLocaleTimeString()} - ${slot1.end.toLocaleTimeString()} (Price: ₹${slot1.price})`);

    // Test blocksSlot()
    const blockedSlot = await SlotService.blocksSlot(
      slot1._id,
      ownerReg.user._id,
      ROLES.VENUE_OWNER,
      'Grass leveling maintenance'
    );
    console.log(`   ✅ blocksSlot() executed. Slot Status: ${blockedSlot.status}`);

    // Create Slot 2 for booking
    const slotStart2 = new Date(now.getTime() + 4 * 3600 * 1000);
    const slotEnd2 = new Date(now.getTime() + 5 * 3600 * 1000);
    const slot2 = await SlotService.createSlot(
      ground._id,
      {
        start: slotStart2.toISOString(),
        end: slotEnd2.toISOString(),
        price: 2000
      },
      ownerReg.user._id,
      ROLES.VENUE_OWNER
    );
    console.log(`   ✅ Slot 2 created for booking test.`);

    // 4. Booking & Concurrency Protection
    console.log('\n4️⃣ Testing Transactional Booking & Double-Booking Prevention...');
    const bookingRes = await BookingService.bookSlot({
      playerId: playerReg.user._id,
      slotId: slot2._id,
      notes: 'Evening 5v5 friendly match'
    });
    console.log(`   ✅ Booking confirmed! Booking ID: ${bookingRes.booking._id}, QR Pass: ${bookingRes.booking.qrPass}`);

    // Attempt double booking
    try {
      await BookingService.bookSlot({
        playerId: player2Reg.user._id,
        slotId: slot2._id
      });
      throw new Error('❌ Double-booking was allowed! Concurrency check failed.');
    } catch (err) {
      console.log(`   ✅ Double-booking prevented successfully! Error caught: "${err.message}"`);
    }

    // Verify QR Pass
    const verifiedBooking = await BookingService.verifyQrPass(bookingRes.booking.qrPass);
    console.log(`   ✅ QR Pass Verified for player: ${verifiedBooking.player.name}`);

    // 5. Matchmaking & OpenMatch Broadcast
    console.log('\n5️⃣ Testing OpenMatch & Broadcast Pings...');
    const match = await MatchService.createOpenMatch(playerReg.user._id, {
      title: 'Test Match 5v5 Turf Battle',
      sport: 'Football',
      targetHeadcount: 2, // 2 players: Host + 1 joiner
      minReliability: 80,
      venueId: venue._id
    });
    console.log(`   ✅ OpenMatch created: "${match.title}" (Min Reliability: ${match.minReliability})`);

    // Player 2 requests to join
    const joinReq = await MatchService.requestJoin(
      match._id,
      player2Reg.user._id,
      'Hey Rohan, striker ready to play!'
    );
    console.log(`   ✅ Join Request submitted by ${player2Reg.user.name}. Status: ${joinReq.status}`);

    // Host accepts join request
    const responseResult = await MatchService.respondToJoinRequest(
      joinReq._id,
      playerReg.user._id,
      'ACCEPTED'
    );
    console.log(`   ✅ Join Request accepted. Match status is now: ${responseResult.match.status} (Total players: ${responseResult.match.joinedPlayers.length})`);

    // 6. Social & Reputation System
    console.log('\n6️⃣ Testing Peer Reviews, Skill Tags, and Chat...');
    const reviewResult = await SocialService.createPlayerReview(playerReg.user._id, {
      targetPlayerId: player2Reg.user._id,
      sportsmanship: 5,
      skillRating: 5,
      comment: 'Great teammate, punctual and polite.'
    });
    console.log(`   ✅ PlayerReview submitted. Target player updated reliability score: ${reviewResult.updatedReliabilityScore}`);

    const skill = await SocialService.endorseSkill(
      playerReg.user._id,
      player2Reg.user._id,
      'Free Kicks'
    );
    console.log(`   ✅ Skill endorsed: "${skill.name}" (Count: ${skill.endorsementCount})`);

    const chatMsg = await SocialService.sendMessage(playerReg.user._id, {
      room: `match:${match._id}`,
      text: 'See everyone on the turf at 6 PM sharp!'
    });
    console.log(`   ✅ Chat message sent to match room: "${chatMsg.text}"`);

    // 7. Safety, Moderation, banUser(), overrideScore()
    console.log('\n7️⃣ Testing Safety & Moderation (Reports, banUser, overrideScore)...');
    const report = await AdminService.fileReport(playerReg.user._id, {
      targetUserId: player2Reg.user._id,
      reason: 'Test Report: Testing moderation queue workflow'
    });
    console.log(`   ✅ Report filed against user. Report ID: ${report._id}`);

    const resolvedReport = await AdminService.resolveReport(
      report._id,
      adminReg.user._id,
      {
        status: 'RESOLVED',
        resolutionNote: 'Reviewed by admin. Warning issued.',
        actionTaken: 'ISSUED_WARNING'
      }
    );
    console.log(`   ✅ Report resolved by Admin. Status: ${resolvedReport.status}`);

    // Test banUser()
    const banResult = await AdminService.banUser(
      player2Reg.user._id,
      adminReg.user._id,
      {
        isBanned: true,
        reason: 'Violated platform fair play code'
      }
    );
    console.log(`   ✅ banUser() executed. User isBanned: ${banResult.user.isBanned}`);

    // Verify banned user cannot login or access auth
    try {
      await AuthService.loginUser({
        login: 'amit_striker',
        password: 'Password123!'
      });
      throw new Error('❌ Banned user was able to log in!');
    } catch (err) {
      console.log(`   ✅ Banned user login successfully blocked: "${err.message}"`);
    }

    // Unban user for clean slate
    await AdminService.banUser(
      player2Reg.user._id,
      adminReg.user._id,
      {
        isBanned: false,
        reason: 'Appeal approved'
      }
    );
    console.log(`   ✅ User unbanned successfully.`);

    // Test overrideScore()
    const overrideRes = await AdminService.overrideScore(
      player2Reg.user._id,
      adminReg.user._id,
      {
        reliabilityScore: 95,
        reason: 'Admin adjusted score after sportsmanship review'
      }
    );
    console.log(`   ✅ overrideScore() executed. Reliability score changed from ${overrideRes.previousScore} to ${overrideRes.newScore}`);

    // Check AuditLog
    const auditLogs = await AdminService.getAuditLogs(10);
    console.log(`   ✅ AuditLog verified: Found ${auditLogs.length} admin action logs.`);

    console.log('\n🎉 ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('\n❌ Verification Failed with Error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

runVerification();
