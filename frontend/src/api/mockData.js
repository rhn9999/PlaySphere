// Mock data store for offline demo and testing when VITE_USE_MOCKS=true

export const mockUsers = {
  player: {
    _id: 'p_101',
    name: 'Arjun Patel',
    fullName: 'Arjun Patel',
    username: 'arjun_ahd',
    email: 'arjun@ahmedabadfc.com',
    role: 'PLAYER',
    bio: 'Midfielder and football captain in Ahmedabad. Looking for competitive 7v7 matches.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    sports: ['Football', 'Cricket'],
    preferredSports: ['Football', 'Cricket'],
    reliabilityScore: 92,
    gamesPlayed: 34,
    searchRadius: 10000,
    currentLocation: { type: 'Point', coordinates: [72.5714, 23.0225] }
  },
  owner: {
    _id: 'o_201',
    name: 'Bhavesh Patel',
    fullName: 'Bhavesh Patel',
    username: 'bhavesh_venues',
    email: 'bhavesh@gujaratarenas.com',
    role: 'VENUE_OWNER',
    businessName: 'Gujarat Premier Sports Facilities',
    venueName: 'Gujarat Premier Sports Facilities'
  },
  admin: {
    _id: 'a_301',
    name: 'Ahmedabad Admin',
    fullName: 'Ahmedabad Admin',
    username: 'admin',
    email: 'admin@playsphere.com',
    role: 'ADMIN',
    adminLevel: 'SUPERADMIN'
  }
};

export const mockVenues = [
  {
    _id: 'v_1',
    name: 'Sardar Patel Sports Complex Navrangpura',
    address: {
      street: 'Stadium Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380009',
      fullAddress: 'Stadium Road, Navrangpura, Ahmedabad, Gujarat 380009'
    },
    location: { type: 'Point', coordinates: [72.5645, 23.0402] },
    verifyStatus: 'APPROVED',
    status: 'ACTIVE',
    sport: ['Football', 'Cricket'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800', isPrimary: false }
    ],
    operatingHours: { open: '06:00', close: '23:00' },
    avgRating: 4.8,
    totalReviews: 42,
    amenities: ['Floodlights', 'Changing Rooms', 'Drinking Water', 'Parking', 'First Aid'],
    grounds: [
      { _id: 'g_1', name: 'Field Alpha (7v7)', sportType: 'Football', surface: 'FIFA Pro AstroTurf' },
      { _id: 'g_2', name: 'Cricket Box Nets', sportType: 'Cricket', surface: 'Turf Net' }
    ]
  },
  {
    _id: 'v_2',
    name: 'SG Highway Arena Turf Bodakdev',
    address: {
      street: 'Behind Rajpath Club, SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380054',
      fullAddress: 'Behind Rajpath Club, SG Highway, Bodakdev, Ahmedabad, Gujarat 380054'
    },
    location: { type: 'Point', coordinates: [72.5050, 23.0330] },
    verifyStatus: 'APPROVED',
    status: 'ACTIVE',
    sport: ['Football', 'Badminton'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800', isPrimary: true }
    ],
    operatingHours: { open: '05:30', close: '23:30' },
    avgRating: 4.7,
    totalReviews: 28,
    amenities: ['Floodlights', 'Cafeteria', 'Showers', 'Parking'],
    grounds: [
      { _id: 'g_3', name: 'Arena 5v5 Turf', sportType: 'Football', surface: 'Synthetic Turf' }
    ]
  },
  {
    _id: 'v_3',
    name: 'Sabarmati Riverfront Sports Park',
    address: {
      street: 'West Riverfront Promenade',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380006',
      fullAddress: 'West Riverfront Promenade, Sabarmati, Ahmedabad, Gujarat 380006'
    },
    location: { type: 'Point', coordinates: [72.5790, 23.0280] },
    verifyStatus: 'APPROVED',
    status: 'ACTIVE',
    sport: ['Tennis', 'Basketball', 'Football'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800', isPrimary: true }
    ],
    operatingHours: { open: '06:00', close: '22:00' },
    avgRating: 4.9,
    totalReviews: 65,
    amenities: ['Floodlights', 'River View Walkway', 'Drinking Water'],
    grounds: [
      { _id: 'g_4', name: 'Court 1 (Hard Court)', sportType: 'Tennis', surface: 'Hard Court' }
    ]
  },
  {
    _id: 'v_4',
    name: 'Vastrapur Badminton & Sports Arena',
    address: {
      street: 'Near Vastrapur Lake',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
      fullAddress: 'Near Vastrapur Lake, Vastrapur, Ahmedabad, Gujarat 380015'
    },
    location: { type: 'Point', coordinates: [72.5270, 23.0360] },
    verifyStatus: 'APPROVED',
    status: 'ACTIVE',
    sport: ['Badminton', 'Pickleball'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800', isPrimary: true }
    ],
    operatingHours: { open: '06:00', close: '23:00' },
    avgRating: 4.6,
    totalReviews: 19,
    amenities: ['Air Conditioning', 'Locker Room', 'Pro Shop'],
    grounds: [
      { _id: 'g_5', name: 'Court A (Synthetic Mat)', sportType: 'Badminton', surface: 'Yonex Mat' }
    ]
  },
  {
    _id: 'v_5',
    name: 'Maninagar Multi-Sport Ground',
    address: {
      street: 'Kankaria Lake Road, Maninagar',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380008',
      fullAddress: 'Kankaria Lake Road, Maninagar, Ahmedabad, Gujarat 380008'
    },
    location: { type: 'Point', coordinates: [72.6050, 22.9980] },
    verifyStatus: 'PENDING',
    status: 'PENDING_APPROVAL',
    sport: ['Cricket', 'Football'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800', isPrimary: true }
    ],
    operatingHours: { open: '06:00', close: '22:30' },
    avgRating: 4.5,
    totalReviews: 34,
    amenities: ['Parking', 'Spectator Seating'],
    grounds: []
  }
];

export const mockSlots = [
  { _id: 's_1', ground: 'g_1', groundName: 'Field Alpha (7v7)', venueId: 'v_1', start: new Date(Date.now() + 86400000 + 6 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 7 * 3600000).toISOString(), price: 1400, status: 'AVAILABLE' },
  { _id: 's_2', ground: 'g_1', groundName: 'Field Alpha (7v7)', venueId: 'v_1', start: new Date(Date.now() + 86400000 + 7 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 8 * 3600000).toISOString(), price: 1400, status: 'AVAILABLE' },
  { _id: 's_3', ground: 'g_1', groundName: 'Field Alpha (7v7)', venueId: 'v_1', start: new Date(Date.now() + 86400000 + 18 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 19 * 3600000).toISOString(), price: 2000, status: 'CONFIRMED' },
  { _id: 's_4', ground: 'g_1', groundName: 'Field Alpha (7v7)', venueId: 'v_1', start: new Date(Date.now() + 86400000 + 19 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 20 * 3600000).toISOString(), price: 2000, status: 'BLOCKED' },
  { _id: 's_5', ground: 'g_1', groundName: 'Field Alpha (7v7)', venueId: 'v_1', start: new Date(Date.now() + 86400000 + 20 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 21 * 3600000).toISOString(), price: 2000, status: 'PENDING' },
  { _id: 's_6', ground: 'g_3', groundName: 'Arena 5v5 Turf', venueId: 'v_2', start: new Date(Date.now() + 86400000 + 18 * 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 19 * 3600000).toISOString(), price: 1800, status: 'AVAILABLE' }
];

export const mockMatches = [
  {
    _id: 'm_1',
    title: 'Ahmedabad Techies Friday 7v7 Clash',
    sport: 'Football',
    targetHeadcount: 14,
    minReliability: 80,
    startTime: new Date(Date.now() + 86400000 + 18 * 3600000).toISOString(),
    venue: mockVenues[0],
    slot: mockSlots[0],
    location: mockVenues[0].location,
    locationName: mockVenues[0].name,
    status: 'SEARCHING',
    host: mockUsers.player,
    joinedPlayers: [
      mockUsers.player,
      { _id: 'p_102', name: 'Deepak Shah', username: 'deepak_striker', reliabilityScore: 88, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { _id: 'p_103', name: 'Karan Dave', username: 'karan_d', reliabilityScore: 94, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      { _id: 'p_104', name: 'Rohan Joshi', username: 'rohan_j', reliabilityScore: 82 },
      { _id: 'p_105', name: 'Sameer Khan', username: 'sam_goal', reliabilityScore: 90 },
      { _id: 'p_106', name: 'Varun Vyas', username: 'varun_v', reliabilityScore: 85 },
      { _id: 'p_107', name: 'Tanmay Mehta', username: 'tanmay_m', reliabilityScore: 89 }
    ]
  },
  {
    _id: 'm_2',
    title: 'Weekend Morning Doubles',
    sport: 'Badminton',
    targetHeadcount: 4,
    minReliability: 75,
    startTime: new Date(Date.now() + 86400000 + 8 * 3600000).toISOString(),
    venue: mockVenues[3],
    location: mockVenues[3].location,
    locationName: mockVenues[3].name,
    status: 'SEARCHING',
    host: { _id: 'p_108', name: 'Sneha Joshi', username: 'sneha_shuttler', reliabilityScore: 95, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    joinedPlayers: [
      { _id: 'p_108', name: 'Sneha Joshi', username: 'sneha_shuttler', reliabilityScore: 95 },
      { _id: 'p_109', name: 'Pooja Bhatt', username: 'pooja_b', reliabilityScore: 84 }
    ]
  }
];

export const mockJoinRequests = [
  {
    _id: 'jr_1',
    match: 'm_1',
    player: {
      _id: 'p_110',
      name: 'Aditya Trivedi',
      username: 'aditya_t',
      reliabilityScore: 88,
      gamesPlayed: 19,
      sports: ['Football'],
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'
    },
    message: 'Hey Arjun! Striker ready to play Friday night.',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const mockBookings = [
  {
    _id: 'b_1',
    player: mockUsers.player,
    venue: mockVenues[0],
    slot: mockSlots[2],
    status: 'CONFIRMED',
    qrPass: 'KHEL-AHMD-8762-C4B1',
    amount: 2000,
    createdAt: new Date().toISOString()
  }
];

export const mockReviews = {
  venue: [
    { _id: 'vr_1', author: 'Deepak S.', turf: 5, lighting: 5, cleanliness: 4, hospitality: 5, comment: 'Best turf quality in Navrangpura! High-intensity floodlights.', createdAt: '2026-10-20' },
    { _id: 'vr_2', author: 'Karan D.', turf: 4, lighting: 4, cleanliness: 5, hospitality: 4, comment: 'Very clean dugout and cold water available.', createdAt: '2026-10-18' }
  ],
  player: [
    { _id: 'pr_1', reviewer: 'Deepak Shah', sportsmanship: 5, skillRating: 5, comment: 'Great playmaker, punctual and friendly.', createdAt: '2026-10-22' },
    { _id: 'pr_2', reviewer: 'Karan Dave', sportsmanship: 5, skillRating: 4, comment: 'Competitive player with solid team spirit.', createdAt: '2026-10-15' }
  ]
};

export const mockSkills = [
  { _id: 'sk_1', name: 'Free Kicks', endorsementCount: 8, endorsed: true },
  { _id: 'sk_2', name: 'Through Balls', endorsementCount: 14, endorsed: true },
  { _id: 'sk_3', name: 'Pace', endorsementCount: 6, endorsed: false }
];

export const mockChatMessages = [
  { _id: 'c_1', sender: { _id: 'p_101', name: 'Arjun Patel' }, text: 'Hey team, bring your dark jerseys for Friday!', timestamp: '17:30' },
  { _id: 'c_2', sender: { _id: 'p_102', name: 'Deepak Shah' }, text: 'Got it captain. Need 2 more players to close the team!', timestamp: '17:32' }
];

export const mockAuditLogs = [
  { _id: 'al_1', action: 'VENUE_APPROVED', targetModel: 'Venue', targetId: 'v_1', performedBy: { name: 'Super Administrator' }, details: { reason: 'Passed physical audit' }, createdAt: new Date().toISOString() },
  { _id: 'al_2', action: 'SCORE_OVERRIDDEN', targetModel: 'Player', targetId: 'p_104', performedBy: { name: 'System Admin' }, details: { reason: 'No-show appeal accepted' }, createdAt: new Date(Date.now() - 86400000).toISOString() }
];

export const mockReports = [
  { _id: 'rep_1', reporter: { name: 'Arjun Patel', username: 'arjun_ahd' }, targetUser: { _id: 'p_999', name: 'Disruptive Player', username: 'bad_actor' }, reason: 'Repeated offensive language and intentional physical fouls in match', status: 'PENDING', createdAt: new Date().toISOString() }
];
