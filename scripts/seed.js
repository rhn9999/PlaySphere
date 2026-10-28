import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Player,
  Admin,
  VenueOwner,
  Venue,
  Ground,
  Slot,
  OpenMatch,
  JoinRequest,
  BookingRequest,
  PlayerReview,
  VenueReview,
  SkillTag,
  Report,
  AuditLog,
  ChatMessage
} from '../src/models/index.js';
import { ROLES, SLOT_STATUS, MATCH_STATUS, VENUE_STATUS, BOOKING_STATUS, JOIN_REQUEST_STATUS, REPORT_STATUS } from '../src/constants/index.js';
import { AuthService } from '../src/services/auth.service.js';

// Single memorable demo password for all accounts
export const DEMO_PASSWORD = 'Demo@1234';

export const seedDatabase = async () => {
  console.log('🌱 Starting PlaySphere Full Seed Script...\n');
  await connectDB();

  try {
    // 1. Wipe existing data cleanly
    console.log('🧹 Purging old collections...');
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Ground.deleteMany({}),
      Slot.deleteMany({}),
      OpenMatch.deleteMany({}),
      JoinRequest.deleteMany({}),
      BookingRequest.deleteMany({}),
      PlayerReview.deleteMany({}),
      VenueReview.deleteMany({}),
      SkillTag.deleteMany({}),
      Report.deleteMany({}),
      AuditLog.deleteMany({}),
      ChatMessage.deleteMany({})
    ]);

    // 2. Synchronize indexes on models
    console.log('⚡ Synchronizing model indexes (2dsphere, unique, text)...');
    await Promise.allSettled([
      User.syncIndexes(),
      Player.syncIndexes(),
      Venue.syncIndexes(),
      Ground.syncIndexes(),
      Slot.syncIndexes(),
      OpenMatch.syncIndexes(),
      JoinRequest.syncIndexes(),
      BookingRequest.syncIndexes(),
      PlayerReview.syncIndexes(),
      VenueReview.syncIndexes(),
      SkillTag.syncIndexes(),
      Report.syncIndexes(),
      AuditLog.syncIndexes()
    ]);

    // 3. Create 1 Admin
    console.log('👤 Seeding Administrator...');
    const adminReg = await AuthService.registerUser({
      name: 'Super Administrator',
      username: 'admin_playsphere',
      email: 'admin@playsphere.test',
      password: DEMO_PASSWORD,
      role: ROLES.ADMIN,
      adminLevel: 'SUPERADMIN'
    });
    const adminUser = adminReg.user;

    // 4. Create 2 Venue Owners
    console.log('🏢 Seeding 2 Venue Owners...');
    const owner1Reg = await AuthService.registerUser({
      name: 'Ramesh Patel',
      username: 'owner1_venues',
      email: 'owner1@playsphere.test',
      password: DEMO_PASSWORD,
      role: ROLES.VENUE_OWNER,
      businessName: 'Patel Arena Sports Hub'
    });

    const owner2Reg = await AuthService.registerUser({
      name: 'Suresh Shah',
      username: 'owner2_arenas',
      email: 'owner2@playsphere.test',
      password: DEMO_PASSWORD,
      role: ROLES.VENUE_OWNER,
      businessName: 'Shah Premier Turf & Courts'
    });

    const owner1 = owner1Reg.user;
    const owner2 = owner2Reg.user;

    // 5. Create 4 Approved Venues (2 per owner in Ahmedabad)
    console.log('🏟️ Seeding 4 Approved Venues in Ahmedabad...');
    const venuesData = [
      {
        name: 'Ahmedabad Football & Box Cricket Arena',
        owner: owner1._id,
        ownerId: owner1._id,
        address: {
          street: 'Near Navrangpura Bus Stand',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '380009',
          country: 'India',
          fullAddress: 'Navrangpura, Ahmedabad, Gujarat 380009'
        },
        location: {
          type: 'Point',
          coordinates: [72.5645, 23.0385] // Navrangpura center
        },
        status: VENUE_STATUS.ACTIVE,
        verifyStatus: 'APPROVED',
        sport: ['Football', 'Cricket'],
        operatingHours: { open: '06:00', close: '23:30' },
        avgRating: 4.8,
        totalReviews: 24,
        photos: [
          { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80', isPrimary: true }
        ]
      },
      {
        name: 'Sabarmati Riverfront Multi-Sport Ground',
        owner: owner1._id,
        ownerId: owner1._id,
        address: {
          street: 'Riverfront West Promenade',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '380007',
          country: 'India',
          fullAddress: 'Sabarmati Riverfront, Ahmedabad, Gujarat 380007'
        },
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225] // Riverfront central
        },
        status: VENUE_STATUS.ACTIVE,
        verifyStatus: 'APPROVED',
        sport: ['Tennis', 'Football'],
        operatingHours: { open: '06:00', close: '23:00' },
        avgRating: 4.9,
        totalReviews: 38,
        photos: [
          { url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80', isPrimary: true }
        ]
      },
      {
        name: 'SG Highway Premier Cricket Dome',
        owner: owner2._id,
        ownerId: owner2._id,
        address: {
          street: 'Opposite Rajpath Club, SG Highway',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '380054',
          country: 'India',
          fullAddress: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054'
        },
        location: {
          type: 'Point',
          coordinates: [72.5085, 23.0360] // Bodakdev / SG Highway
        },
        status: VENUE_STATUS.ACTIVE,
        verifyStatus: 'APPROVED',
        sport: ['Cricket'],
        operatingHours: { open: '05:30', close: '23:59' },
        avgRating: 4.6,
        totalReviews: 19,
        photos: [
          { url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80', isPrimary: true }
        ]
      },
      {
        name: 'Vastrapur Badminton & Padel Center',
        owner: owner2._id,
        ownerId: owner2._id,
        address: {
          street: 'Near Vastrapur Lake',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '380015',
          country: 'India',
          fullAddress: 'Vastrapur Lake, Ahmedabad, Gujarat 380015'
        },
        location: {
          type: 'Point',
          coordinates: [72.5280, 23.0350] // Vastrapur
        },
        status: VENUE_STATUS.ACTIVE,
        verifyStatus: 'APPROVED',
        sport: ['Badminton', 'Pickleball', 'Basketball'],
        operatingHours: { open: '06:00', close: '23:00' },
        avgRating: 4.7,
        totalReviews: 15,
        photos: [
          { url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', isPrimary: true }
        ]
      }
    ];

    const venues = await Venue.create(venuesData);
    console.log(`   Created ${venues.length} venues.`);

    // 6. Create Grounds for each Venue
    console.log('⛳ Seeding Grounds...');
    const grounds = [];
    for (const v of venues) {
      const sportPrimary = v.sport[0] || 'Football';
      const sportSecondary = v.sport[1] || 'Cricket';

      const g1 = await Ground.create({
        venue: v._id,
        name: `${v.name.split(' ')[0]} - Pitch A (Main)`,
        sportType: sportPrimary,
        surface: 'Turf',
        coverPhoto: v.photos[0]?.url || '',
        isActive: true
      });
      const g2 = await Ground.create({
        venue: v._id,
        name: `${v.name.split(' ')[0]} - Pitch B (Practice)`,
        sportType: sportSecondary,
        surface: 'Hard Court',
        coverPhoto: v.photos[0]?.url || '',
        isActive: true
      });
      grounds.push(g1, g2);
    }
    console.log(`   Created ${grounds.length} grounds across venues.`);

    // 7. Create Slots for the next 7 days for grounds (AVAILABLE, CONFIRMED, BLOCKED)
    console.log('⏰ Generating 7-day slot schedules (Peak / Off-Peak / Booked / Blocked)...');
    const createdSlots = [];
    const now = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);

      // Morning off-peak slot: 07:00 - 08:30 (₹800)
      // Evening peak slot: 18:00 - 19:30 (₹1400)
      // Night peak slot: 20:00 - 21:30 (₹1600)
      for (const ground of grounds.slice(0, 4)) {
        const morningStart = new Date(baseDate.getTime());
        morningStart.setHours(7, 0, 0, 0);
        const morningEnd = new Date(baseDate.getTime());
        morningEnd.setHours(8, 30, 0, 0);

        const eveningStart = new Date(baseDate.getTime());
        eveningStart.setHours(18, 0, 0, 0);
        const eveningEnd = new Date(baseDate.getTime());
        eveningEnd.setHours(19, 30, 0, 0);

        const nightStart = new Date(baseDate.getTime());
        nightStart.setHours(20, 0, 0, 0);
        const nightEnd = new Date(baseDate.getTime());
        nightEnd.setHours(21, 30, 0, 0);

        // Status variations
        let morningStatus = SLOT_STATUS.AVAILABLE;
        let eveningStatus = SLOT_STATUS.AVAILABLE;
        let nightStatus = SLOT_STATUS.AVAILABLE;

        if (dayOffset === 0) {
          eveningStatus = SLOT_STATUS.BOOKED; // Today's evening booked
          nightStatus = SLOT_STATUS.BLOCKED;  // Today's night blocked for maintenance
        } else if (dayOffset === 1) {
          nightStatus = SLOT_STATUS.BOOKED;
        }

        const s1 = await Slot.create({
          ground: ground._id,
          start: morningStart,
          end: morningEnd,
          price: 800, // off-peak
          status: morningStatus
        });

        const s2 = await Slot.create({
          ground: ground._id,
          start: eveningStart,
          end: eveningEnd,
          price: 1400, // peak
          status: eveningStatus
        });

        const s3 = await Slot.create({
          ground: ground._id,
          start: nightStart,
          end: nightEnd,
          price: 1600, // peak night
          status: nightStatus
        });

        createdSlots.push(s1, s2, s3);
      }
    }
    console.log(`   Generated ${createdSlots.length} calendar slots.`);

    // 8. Create 6 Players (including one with reliability < 80)
    console.log('🏃 Seeding 6 Diverse Players in Ahmedabad...');
    const playersData = [
      {
        name: 'Arjun Verma',
        username: 'player1_arjun',
        email: 'player1@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Football', 'Cricket'],
        preferredSports: ['Football', 'Cricket'],
        reliabilityScore: 95,
        gamesPlayed: 28,
        bio: 'Forward striker & box cricket enthusiast in Ahmedabad',
        coords: [72.5714, 23.0225], // Center
        skills: ['Striker', 'Playmaker', 'Penalty Specialist']
      },
      {
        name: 'Rohit Sharma',
        username: 'player2_rohit',
        email: 'player2@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Cricket', 'Tennis'],
        preferredSports: ['Cricket', 'Tennis'],
        reliabilityScore: 92,
        gamesPlayed: 19,
        bio: 'All-rounder cricketer, active on weekend night slots',
        coords: [72.5645, 23.0385], // Navrangpura
        skills: ['Fast Bowling', 'Power Hitter', 'Spin Bowling']
      },
      {
        name: 'Priya Mehta',
        username: 'player3_priya',
        email: 'player3@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Badminton', 'Tennis'],
        preferredSports: ['Badminton', 'Tennis'],
        reliabilityScore: 98,
        gamesPlayed: 42,
        bio: 'Competitive badminton player looking for doubles partners',
        coords: [72.5280, 23.0350], // Vastrapur
        skills: ['Smash Master', 'Agile Footwork', 'Double Strategy']
      },
      {
        name: 'Karan Dave',
        username: 'player4_karan',
        email: 'player4@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Football', 'Basketball'],
        preferredSports: ['Football', 'Basketball'],
        reliabilityScore: 88,
        gamesPlayed: 15,
        bio: 'Solid centre-back defender & team organizer',
        coords: [72.5085, 23.0360], // Bodakdev
        skills: ['Tackling', 'Aeriel Threat', 'Shot Stopper']
      },
      {
        name: 'Sneha Shah',
        username: 'player5_sneha',
        email: 'player5@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Basketball', 'Badminton', 'Pickleball'],
        preferredSports: ['Basketball', 'Pickleball'],
        reliabilityScore: 85,
        gamesPlayed: 11,
        bio: 'Pickleball & basketball player, weekday evening squads',
        coords: [72.5350, 23.0450], // Memnagar
        skills: ['Sharp Shooting', 'Fast Breaks']
      },
      {
        name: 'Vicky Rajput',
        username: 'player6_vicky',
        email: 'player6@playsphere.test',
        password: DEMO_PASSWORD,
        role: ROLES.PLAYER,
        sports: ['Football', 'Cricket'],
        preferredSports: ['Football'],
        reliabilityScore: 68, // UNDER 80 to demonstrate reliability filter
        gamesPlayed: 6,
        bio: 'Casual weekend player, working on attendance record',
        coords: [72.5800, 23.0150], // Maninagar
        skills: ['Casual Dribbler']
      }
    ];

    const createdPlayers = [];
    for (const p of playersData) {
      const reg = await AuthService.registerUser({
        name: p.name,
        username: p.username,
        email: p.email,
        password: p.password,
        role: p.role,
        bio: p.bio,
        sports: p.sports
      });

      // Update location and reliability stats
      await Player.findByIdAndUpdate(reg.user._id, {
        reliabilityScore: p.reliabilityScore,
        gamesPlayed: p.gamesPlayed,
        preferredSports: p.preferredSports,
        currentLocation: { type: 'Point', coordinates: p.coords },
        lastLocationUpdate: new Date(),
        searchRadius: 10000
      });

      // Insert Skill Tags
      for (const skill of p.skills) {
        await SkillTag.create({
          name: skill,
          player: reg.user._id,
          endorsementCount: Math.floor(Math.random() * 8) + 2
        });
      }

      const updated = await Player.findById(reg.user._id);
      createdPlayers.push(updated);
    }
    console.log(`   Registered ${createdPlayers.length} players with skill tags.`);

    // 9. Create 4 Open Matches in different states
    console.log('⚽ Creating 4 Open Matches (SEARCHING, TEAM_FULL, PENDING, CONFIRMED)...');

    // Match 1: SEARCHING (Football, minReliability 70, looking for 4 more)
    const match1 = await OpenMatch.create({
      host: createdPlayers[0]._id, // Arjun
      title: 'Sunday Morning 5v5 Turf Battle',
      sport: 'Football',
      targetHeadcount: 10,
      minReliability: 70,
      status: MATCH_STATUS.SEARCHING,
      startTime: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
      venue: venues[0]._id,
      slot: createdSlots[0]._id,
      locationName: 'Ahmedabad Football Arena (Navrangpura)',
      location: venues[0].location,
      joinedPlayers: [createdPlayers[1]._id] // Rohit joined
    });

    // Match 2: TEAM_FULL (Badminton doubles, target 4, full)
    const match2 = await OpenMatch.create({
      host: createdPlayers[2]._id, // Priya
      title: 'High-Paced Doubles Badminton Clash',
      sport: 'Badminton',
      targetHeadcount: 4,
      minReliability: 85,
      status: MATCH_STATUS.TEAM_FULL,
      startTime: new Date(Date.now() + 48 * 3600 * 1000),
      venue: venues[3]._id,
      slot: createdSlots[1]._id,
      locationName: 'Vastrapur Badminton Center',
      location: venues[3].location,
      joinedPlayers: [createdPlayers[1]._id, createdPlayers[3]._id, createdPlayers[4]._id]
    });

    // Match 3: PENDING (Booking request pending venue owner approval)
    const match3 = await OpenMatch.create({
      host: createdPlayers[0]._id,
      title: 'Competitive 7v7 Box Football Championship',
      sport: 'Football',
      targetHeadcount: 14,
      minReliability: 80,
      status: MATCH_STATUS.PENDING,
      startTime: new Date(Date.now() + 72 * 3600 * 1000),
      venue: venues[1]._id,
      slot: createdSlots[2]._id,
      locationName: 'Sabarmati Riverfront Ground',
      location: venues[1].location,
      joinedPlayers: [createdPlayers[1]._id, createdPlayers[2]._id, createdPlayers[3]._id, createdPlayers[4]._id]
    });

    // Match 4: CONFIRMED (Confirmed reservation with QR pass)
    const match4 = await OpenMatch.create({
      host: createdPlayers[1]._id, // Rohit
      title: 'Friday Night Box Cricket Under Lights',
      sport: 'Cricket',
      targetHeadcount: 8,
      minReliability: 75,
      status: MATCH_STATUS.CONFIRMED,
      startTime: new Date(Date.now() + 12 * 3600 * 1000),
      venue: venues[2]._id,
      slot: createdSlots[4]._id,
      locationName: 'SG Highway Premier Cricket Dome',
      location: venues[2].location,
      joinedPlayers: [createdPlayers[0]._id, createdPlayers[3]._id, createdPlayers[4]._id]
    });

    // 10. Join Requests
    console.log('📨 Seeding Join Requests...');
    await JoinRequest.create({
      match: match1._id,
      player: createdPlayers[3]._id, // Karan requested to join Match 1
      status: JOIN_REQUEST_STATUS.PENDING,
      message: 'Can play as central midfielder, count me in!'
    });

    await JoinRequest.create({
      match: match1._id,
      player: createdPlayers[5]._id, // Vicky (reliability 68 < 70)
      status: JOIN_REQUEST_STATUS.REJECTED,
      message: 'Would love to play!'
    });

    // 11. Booking Requests & QR Pass
    console.log('🎟️ Seeding Booking Requests & QR Entry Passes...');
    const bookingReqPending = await BookingRequest.create({
      player: createdPlayers[0]._id,
      slot: createdSlots[2]._id,
      status: BOOKING_STATUS.PENDING,
      totalAmount: 1600,
      notes: 'Squad ready, awaiting turf manager slot confirmation'
    });

    const bookingReqConfirmed = await BookingRequest.create({
      player: createdPlayers[1]._id,
      slot: createdSlots[4]._id,
      status: BOOKING_STATUS.CONFIRMED,
      totalAmount: 1400,
      qrPass: 'PASS-CONFIRMED-MATCH-4-PLAYSPHERE',
      respondedAt: new Date(),
      notes: 'Confirmed by venue owner Ramesh Patel. Athletes check in via QR code.'
    });

    // 12. Chat Messages on Match 1
    console.log('💬 Seeding Live Squad Chat Messages...');
    await ChatMessage.create({
      sender: createdPlayers[0]._id,
      room: `match_${match1._id}`,
      text: 'Hey squad! Please bring black jerseys. Turf boots only, no metal studs.',
      sentAt: new Date(Date.now() - 3600000)
    });
    await ChatMessage.create({
      sender: createdPlayers[1]._id,
      room: `match_${match1._id}`,
      text: 'Got it Arjun! Will bring an extra size-5 match ball.',
      sentAt: new Date(Date.now() - 1800000)
    });

    // 13. Reviews (PlayerReviews & VenueReviews)
    console.log('⭐ Seeding Player Reviews and Venue Reviews...');
    await PlayerReview.create({
      reviewer: createdPlayers[0]._id,
      targetPlayer: createdPlayers[1]._id,
      sportsmanship: 5,
      skillRating: 5,
      comment: 'Excellent all-rounder cricketer! Very punctual and great team attitude.'
    });
    await PlayerReview.create({
      reviewer: createdPlayers[2]._id,
      targetPlayer: createdPlayers[3]._id,
      sportsmanship: 5,
      skillRating: 4,
      comment: 'Hard-working defender, great communication on court.'
    });

    await VenueReview.create({
      venue: venues[0]._id,
      reviewer: createdPlayers[0]._id,
      user: createdPlayers[0]._id,
      rating: 5,
      comment: 'Top quality 3G turf in Navrangpura, great floodlights and clean changing rooms.'
    });
    await VenueReview.create({
      venue: venues[1]._id,
      reviewer: createdPlayers[2]._id,
      user: createdPlayers[2]._id,
      rating: 5,
      comment: 'Riverfront breeze makes playing here amazing. Court surfaces are well maintained.'
    });

    // 14. Report
    console.log('⚠️ Seeding Moderation Report...');
    await Report.create({
      reporter: createdPlayers[0]._id,
      targetUser: createdPlayers[5]._id, // Vicky reported
      reason: 'No-show for pre-booked turf slot without prior cancellation notice.',
      status: REPORT_STATUS.PENDING
    });

    // 15. Audit Logs
    console.log('📜 Seeding Admin Audit Trail...');
    await AuditLog.create({
      admin: adminUser._id,
      action: 'APPROVE_VENUE',
      target: venues[0].name,
      details: { venueId: venues[0]._id, status: 'APPROVED' },
      timestamp: new Date(Date.now() - 86400000)
    });
    await AuditLog.create({
      admin: adminUser._id,
      action: 'APPROVE_VENUE',
      target: venues[1].name,
      details: { venueId: venues[1]._id, status: 'APPROVED' },
      timestamp: new Date(Date.now() - 43200000)
    });

    console.log('\n===============================================================');
    console.log('🎉 PLAYSPHERE DATABASE SEEDING COMPLETED SUCCESSFULLY! 🚀');
    console.log('===============================================================\n');

    console.log('🔐 DEMO CREDENTIALS TABLE (Password for ALL accounts: Demo@1234)\n');
    console.table([
      { Role: 'ADMIN', Username: 'admin_playsphere', Email: 'admin@playsphere.test', Portal: '/admin', Note: 'Superadmin privileges' },
      { Role: 'VENUE_OWNER', Username: 'owner1_venues', Email: 'owner1@playsphere.test', Portal: '/owner', Note: 'Patel Arena Hub (Navrangpura, Riverfront)' },
      { Role: 'VENUE_OWNER', Username: 'owner2_arenas', Email: 'owner2@playsphere.test', Portal: '/owner', Note: 'Shah Premier Turf (SG Highway, Vastrapur)' },
      { Role: 'PLAYER', Username: 'player1_arjun', Email: 'player1@playsphere.test', Portal: '/app', Note: 'Reliability 95, Host of Match 1 & 3' },
      { Role: 'PLAYER', Username: 'player2_rohit', Email: 'player2@playsphere.test', Portal: '/app', Note: 'Reliability 92, Host of Match 4 (Confirmed)' },
      { Role: 'PLAYER', Username: 'player3_priya', Email: 'player3@playsphere.test', Portal: '/app', Note: 'Reliability 98, Host of Match 2 (Team Full)' },
      { Role: 'PLAYER', Username: 'player4_karan', Email: 'player4@playsphere.test', Portal: '/app', Note: 'Reliability 88, Defender' },
      { Role: 'PLAYER', Username: 'player5_sneha', Email: 'player5@playsphere.test', Portal: '/app', Note: 'Reliability 85, Basketball / Pickleball' },
      { Role: 'PLAYER', Username: 'player6_vicky', Email: 'player6@playsphere.test', Portal: '/app', Note: 'Reliability 68 (<80 minimum check demo)' }
    ]);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Auto-run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seedDatabase().catch(() => process.exit(1));
}
