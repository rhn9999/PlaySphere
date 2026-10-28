import request from 'supertest';
import assert from 'assert';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Player,
  Venue,
  Ground,
  Slot,
  OpenMatch
} from '../src/models/index.js';
import { AuthService } from '../src/services/auth.service.js';
import { ROLES, VENUE_STATUS, SLOT_STATUS, MATCH_STATUS } from '../src/constants/index.js';

const runTests = async () => {
  console.log('🧪 Starting PlaySphere Location Services Automated Test Suite...\n');

  await connectDB();

  try {
    // 0. Clean database & ensure indexes
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Ground.deleteMany({}),
      Slot.deleteMany({}),
      OpenMatch.deleteMany({})
    ]);

    await Promise.allSettled([
      Venue.syncIndexes(),
      Player.syncIndexes(),
      OpenMatch.syncIndexes()
    ]);

    console.log('1️⃣ Setting up test users, venues, and grounds in Ahmedabad...');

    // Register Venue Owner
    const ownerReg = await AuthService.registerUser({
      name: 'Test Owner',
      username: 'test_owner',
      email: 'owner@ahmedabadarenas.com',
      password: 'Password123!',
      role: ROLES.VENUE_OWNER,
      businessName: 'Ahmedabad Arenas Ltd'
    });
    const ownerToken = ownerReg.token;

    // Register Player 1: Host at Ahmedabad Center [72.5714, 23.0225]
    const p1Reg = await AuthService.registerUser({
      name: 'Arjun Host',
      username: 'arjun_host',
      email: 'arjun@ahd.com',
      password: 'Password123!',
      role: ROLES.PLAYER,
      sports: ['Football', 'Cricket']
    });
    const player1Token = p1Reg.token;
    const player1Id = p1Reg.user._id;

    await Player.findByIdAndUpdate(player1Id, {
      currentLocation: { type: 'Point', coordinates: [72.5714, 23.0225] },
      preferredSports: ['Football', 'Cricket'],
      searchRadius: 10000,
      lastLocationUpdate: new Date(),
      reliabilityScore: 90
    });

    // Register Player 2: Nearby in Vastrapur [72.5280, 23.0350] (~4.5km away) with Football
    const p2Reg = await AuthService.registerUser({
      name: 'Deepak Nearby',
      username: 'deepak_nearby',
      email: 'deepak@ahd.com',
      password: 'Password123!',
      role: ROLES.PLAYER,
      sports: ['Football']
    });
    const player2Token = p2Reg.token;
    const player2Id = p2Reg.user._id;

    await Player.findByIdAndUpdate(player2Id, {
      currentLocation: { type: 'Point', coordinates: [72.5280, 23.0350] },
      preferredSports: ['Football'],
      searchRadius: 8000,
      lastLocationUpdate: new Date(),
      reliabilityScore: 85,
      fcmToken: 'fcm_token_deepak_nearby'
    });

    // Register Player 3: Far away in Gandhinagar [72.6840, 23.2156] (~24km away) with Badminton
    const p3Reg = await AuthService.registerUser({
      name: 'Sneha Far',
      username: 'sneha_far',
      email: 'sneha@gandhinagar.com',
      password: 'Password123!',
      role: ROLES.PLAYER,
      sports: ['Badminton']
    });
    const player3Id = p3Reg.user._id;

    await Player.findByIdAndUpdate(player3Id, {
      currentLocation: { type: 'Point', coordinates: [72.6840, 23.2156] },
      preferredSports: ['Badminton'],
      searchRadius: 5000,
      lastLocationUpdate: new Date(),
      reliabilityScore: 95,
      fcmToken: 'fcm_token_sneha_far'
    });

    // Create 3 Venues:
    // Venue A: Sardar Patel Stadium Navrangpura [72.5645, 23.0402] (~2km from center), Football & Cricket, APPROVED
    const venueA = await Venue.create({
      name: 'Sardar Patel Sports Complex Navrangpura',
      address: {
        street: 'Stadium Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380009',
        country: 'India',
        fullAddress: 'Stadium Road, Navrangpura, Ahmedabad, Gujarat'
      },
      location: { type: 'Point', coordinates: [72.5645, 23.0402] },
      verifyStatus: 'APPROVED',
      status: VENUE_STATUS.ACTIVE,
      sport: ['Football', 'Cricket'],
      photos: [{ url: 'https://example.com/photo1.jpg', isPrimary: true }],
      operatingHours: { open: '06:00', close: '23:00' },
      owner: ownerReg.user._id
    });

    // Venue B: Sabarmati Tennis Club [72.5790, 23.0280] (~1.5km from center), Tennis & Basketball, APPROVED
    const venueB = await Venue.create({
      name: 'Sabarmati Riverfront Sports Park',
      address: {
        street: 'Riverfront Promenade',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380006',
        country: 'India',
        fullAddress: 'Riverfront Promenade, Sabarmati, Ahmedabad, Gujarat'
      },
      location: { type: 'Point', coordinates: [72.5790, 23.0280] },
      verifyStatus: 'APPROVED',
      status: VENUE_STATUS.ACTIVE,
      sport: ['Tennis', 'Basketball'],
      photos: [{ url: 'https://example.com/photo2.jpg', isPrimary: true }],
      owner: ownerReg.user._id
    });

    // Venue C: SG Highway Arena Bodakdev [72.5050, 23.0330] (~7km from center), Football, APPROVED
    const venueC = await Venue.create({
      name: 'SG Highway Arena Turf Bodakdev',
      address: {
        street: 'SG Highway',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380054',
        country: 'India',
        fullAddress: 'SG Highway, Bodakdev, Ahmedabad, Gujarat'
      },
      location: { type: 'Point', coordinates: [72.5050, 23.0330] },
      verifyStatus: 'APPROVED',
      status: VENUE_STATUS.ACTIVE,
      sport: ['Football'],
      owner: ownerReg.user._id
    });

    // Venue D: Pending Venue (Not approved)
    const venueD = await Venue.create({
      name: 'Unapproved Underground Turf',
      address: {
        street: 'Secret Lane',
        city: 'Ahmedabad',
        country: 'India',
        fullAddress: 'Secret Lane, Ahmedabad'
      },
      location: { type: 'Point', coordinates: [72.5700, 23.0200] },
      verifyStatus: 'PENDING',
      status: VENUE_STATUS.PENDING_APPROVAL,
      sport: ['Football'],
      owner: ownerReg.user._id
    });

    // Create Ground and Available Slot for Venue A
    const groundA = await Ground.create({
      venue: venueA._id,
      name: 'Navrangpura Field 1',
      sportType: 'Football',
      surface: 'AstroTurf'
    });

    const tomorrow = new Date(Date.now() + 86400000);
    const slotA = await Slot.create({
      ground: groundA._id,
      start: tomorrow,
      end: new Date(tomorrow.getTime() + 3600000),
      price: 1500,
      status: SLOT_STATUS.AVAILABLE
    });

    console.log('   ✅ Test fixtures established successfully.\n');

    // TEST 1: Health Endpoints
    console.log('2️⃣ Testing Health Endpoints (/health and /api/health)...');
    const healthRes = await request(app).get('/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.body.status, 'healthy');

    const apiHealthRes = await request(app).get('/api/health');
    assert.strictEqual(apiHealthRes.status, 200);
    assert.strictEqual(apiHealthRes.body.success, true);
    console.log('   ✅ Health check passed: 200 OK');

    // TEST 2: Nearby Venue Search - Radius Filtering
    console.log('\n3️⃣ Testing Nearby Venue Search (Radius Filtering)...');
    // From Ahmedabad Center [72.5714, 23.0225], 3km radius should return Venue A and Venue B, but NOT Venue C (7km) and NOT Venue D (PENDING)
    const nearbyRes3k = await request(app)
      .post('/api/venues/nearby')
      .send({
        lng: 72.5714,
        lat: 23.0225,
        radius: 3000
      });

    assert.strictEqual(nearbyRes3k.status, 200);
    const venues3k = nearbyRes3k.body.data;
    assert.strictEqual(venues3k.length, 2, `Expected 2 venues within 3km, got ${venues3k.length}`);
    const venueIds3k = venues3k.map((v) => v._id.toString());
    assert(venueIds3k.includes(venueA._id.toString()), 'Expected Venue A inside 3km radius');
    assert(venueIds3k.includes(venueB._id.toString()), 'Expected Venue B inside 3km radius');
    assert(!venueIds3k.includes(venueC._id.toString()), 'Venue C must NOT be in 3km radius');
    assert(!venueIds3k.includes(venueD._id.toString()), 'Venue D must NOT be returned because it is PENDING');
    console.log('   ✅ Radius filter successfully returns only approved venues within 3km');

    // Expand to 10km radius: Venue C should now be included
    const nearbyRes10k = await request(app)
      .post('/api/venues/nearby')
      .send({
        lng: 72.5714,
        lat: 23.0225,
        radius: 10000
      });
    assert.strictEqual(nearbyRes10k.status, 200);
    assert.strictEqual(nearbyRes10k.body.data.length, 3, 'Expected 3 venues within 10km');
    console.log('   ✅ Expanding radius to 10km includes SG Highway venue');

    // TEST 3: Sport Filter Applied Inside Mongo Query
    console.log('\n4️⃣ Testing Sport Filter inside Mongo Query...');
    const tennisRes = await request(app)
      .post('/api/venues/nearby')
      .send({
        lng: 72.5714,
        lat: 23.0225,
        radius: 10000,
        sport: 'Tennis'
      });

    assert.strictEqual(tennisRes.status, 200);
    assert.strictEqual(tennisRes.body.data.length, 1);
    assert.strictEqual(tennisRes.body.data[0].name, 'Sabarmati Riverfront Sports Park');
    console.log('   ✅ Sport filter (Tennis) correctly returned only Sabarmati Riverfront');

    const cricketRes = await request(app)
      .post('/api/venues/nearby')
      .send({
        lng: 72.5714,
        lat: 23.0225,
        radius: 10000,
        sport: 'Cricket'
      });
    assert.strictEqual(cricketRes.status, 200);
    assert.strictEqual(cricketRes.body.data.length, 1);
    assert.strictEqual(cricketRes.body.data[0].name, 'Sardar Patel Sports Complex Navrangpura');
    console.log('   ✅ Sport filter (Cricket) correctly returned only Sardar Patel Complex');

    // TEST 4: Text Search (GET /api/venues/search?q=)
    console.log('\n5️⃣ Testing Text Search (GET /api/venues/search?q=)...');
    const searchRes = await request(app).get('/api/venues/search?q=Bodakdev');
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.body.data.length, 1);
    assert.strictEqual(searchRes.body.data[0].name, 'SG Highway Arena Turf Bodakdev');

    const searchNavrangpura = await request(app).get('/api/venues/search?q=Navrangpura');
    assert.strictEqual(searchNavrangpura.status, 200);
    assert.strictEqual(searchNavrangpura.body.data.length, 1);
    assert.strictEqual(searchNavrangpura.body.data[0].name, 'Sardar Patel Sports Complex Navrangpura');

    const searchNoMatch = await request(app).get('/api/venues/search?q=NonExistentTurfNameXYZ');
    assert.strictEqual(searchNoMatch.status, 200);
    assert.strictEqual(searchNoMatch.body.data.length, 0);
    console.log('   ✅ Text search correctly matched by name and fullAddress');

    // TEST 5: Input Validation & Invalid Coordinates (400)
    console.log('\n6️⃣ Testing Validation: Invalid Coordinates and Capped Radius (400)...');
    const badLng = await request(app)
      .post('/api/venues/nearby')
      .send({ lng: 195, lat: 23.0225, radius: 5000 });
    assert.strictEqual(badLng.status, 400);
    console.log('   ✅ Invalid longitude (195) rejected with 400 Bad Request');

    const badLat = await request(app)
      .post('/api/venues/nearby')
      .send({ lng: 72.5714, lat: -105, radius: 5000 });
    assert.strictEqual(badLat.status, 400);
    console.log('   ✅ Invalid latitude (-105) rejected with 400 Bad Request');

    const excessRadius = await request(app)
      .post('/api/venues/nearby')
      .send({ lng: 72.5714, lat: 23.0225, radius: 60000 }); // > 50km
    assert.strictEqual(excessRadius.status, 400);
    console.log('   ✅ Radius exceeding 50km (60,000m) rejected with 400 Bad Request');

    // TEST 6: Geocode Address Not Found (422)
    console.log('\n7️⃣ Testing Geocoding: Address Not Found returns 422...');
    const ungeocodeableRes = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Impossible Location Arena',
        address: 'zzzz_nowhere_impossible_address_99999999_fake_city'
      });
    assert.strictEqual(ungeocodeableRes.status, 422);
    assert(ungeocodeableRes.body.message.includes('geocoded'));
    console.log('   ✅ Un-geocodable address correctly returned 422 Unprocessable Entity');

    // TEST 7: Venue by ID with Available Slots
    console.log('\n8️⃣ Testing GET /api/venues/:id (with available slots)...');
    const venueDetailRes = await request(app).get(`/api/venues/${venueA._id}`);
    assert.strictEqual(venueDetailRes.status, 200);
    assert(venueDetailRes.body.data.venue, 'Expected venue details');
    assert(Array.isArray(venueDetailRes.body.data.grounds), 'Expected grounds list');
    assert(Array.isArray(venueDetailRes.body.data.availableSlots), 'Expected availableSlots array');
    assert.strictEqual(venueDetailRes.body.data.availableSlots.length, 1);
    console.log('   ✅ Venue details returned with grounds and upcoming available slots');

    // TEST 8: Player Location & FCM Token Updates
    console.log('\n9️⃣ Testing Player Location and FCM Token Endpoints...');
    const updateLocRes = await request(app)
      .post('/api/players/update-location')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({ lng: 72.5800, lat: 23.0300 });

    assert.strictEqual(updateLocRes.status, 200);
    assert.deepStrictEqual(updateLocRes.body.data.currentLocation.coordinates, [72.5800, 23.0300]);
    console.log('   ✅ Player location successfully updated to [72.5800, 23.0300]');

    const fcmRes = await request(app)
      .post('/api/players/fcm-token')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({ fcmToken: 'fcm_token_arjun_test_12345' });

    assert.strictEqual(fcmRes.status, 200);
    assert.strictEqual(fcmRes.body.data.fcmToken, 'fcm_token_arjun_test_12345');
    console.log('   ✅ Player FCM token successfully updated');

    // Reset player 1 location back to center for match creation test
    await Player.findByIdAndUpdate(player1Id, {
      currentLocation: { type: 'Point', coordinates: [72.5714, 23.0225] }
    });

    // TEST 9: Privacy Check (Never expose other players' exact currentLocation)
    console.log('\n🔟 Testing Privacy: Other players exact currentLocation is never returned...');
    const meRes = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${player1Token}`);

    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.name, 'Arjun Host');
    assert(meRes.body.data.currentLocation, 'Player can view their own location');

    // Listing open matches or other players
    const openMatchesRes = await request(app).get('/api/matches');
    assert.strictEqual(openMatchesRes.status, 200);
    openMatchesRes.body.data.forEach((m) => {
      m.joinedPlayers.forEach((p) => {
        assert.strictEqual(p.currentLocation, undefined, 'Other players exact currentLocation must NOT be returned');
      });
    });
    console.log('   ✅ Privacy enforced: other players exact coordinates are never exposed');

    // TEST 10: OpenMatch Creation Copies Venue Location and Notifies Nearby Players
    console.log('\n1️⃣1️⃣ Testing OpenMatch Creation: copies venue location & notifies nearby players of the right sport...');
    const createMatchRes = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({
        title: 'Friday Night Football Clash',
        sport: 'Football',
        targetHeadcount: 10,
        minReliability: 80,
        slotId: slotA._id.toString()
      });

    assert.strictEqual(createMatchRes.status, 201);
    const createdMatch = createMatchRes.body.data;
    assert.strictEqual(createdMatch.sport, 'Football');
    assert.strictEqual(createdMatch.status, MATCH_STATUS.SEARCHING);
    assert.deepStrictEqual(
      createdMatch.location.coordinates,
      venueA.location.coordinates,
      'Match location coordinates must match the venue location'
    );
    console.log(`   ✅ OpenMatch created with status SEARCHING and copied venue coordinates: [${createdMatch.location.coordinates}]`);

    // TEST 11: Re-Broadcast Ping Rate Limiting (5 minutes) & Host Authorization
    console.log('\n1️⃣2️⃣ Testing Re-Broadcast Ping Rate Limiting (once per 5 minutes) and Host Only...');
    const pingRes1 = await request(app)
      .post(`/api/matches/${createdMatch._id}/ping`)
      .set('Authorization', `Bearer ${player1Token}`);

    assert.strictEqual(pingRes1.status, 200);
    assert.strictEqual(pingRes1.body.success, true);
    // Deepak in Vastrapur (~4.5km, Football) should be notified; Sneha in Gandhinagar (~24km, Badminton) should NOT
    assert.strictEqual(pingRes1.body.data.notifiedPlayersCount, 1);
    console.log('   ✅ First ping succeeded and notified 1 nearby football player');

    // Immediate second ping must be blocked by rate limit (429)
    const pingRes2 = await request(app)
      .post(`/api/matches/${createdMatch._id}/ping`)
      .set('Authorization', `Bearer ${player1Token}`);

    assert.strictEqual(pingRes2.status, 429);
    assert(pingRes2.body.message.includes('cooldown'));
    console.log('   ✅ Immediate second ping blocked by 5-minute cooldown (429 Too Many Requests)');

    // Non-host player attempting ping must be forbidden (403)
    const pingRes3 = await request(app)
      .post(`/api/matches/${createdMatch._id}/ping`)
      .set('Authorization', `Bearer ${player2Token}`);

    assert.strictEqual(pingRes3.status, 403);
    console.log('   ✅ Non-host player ping rejected with 403 Forbidden');

    console.log('\n========================================================');
    console.log('🎉 ALL 12 LOCATION SERVICES AUTOMATED TESTS PASSED! 🚀');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

runTests();
