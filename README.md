# 🏆 PlaySphere Backend

A complete, production-ready backend for **PlaySphere** — a modern sports venue booking, community matchmaking, and facility management platform built with **Node.js (ES Modules)**, **Express.js**, and **MongoDB (Mongoose)**.

---

## 🚀 Key Features

1. **Role-Based Authentication with Mongoose Discriminators**:
   - Single-collection inheritance on `User` for `Player`, `VenueOwner`, and `Admin`.
   - Role-specific extensions:
     - `Player`: `reliabilityScore`, `gamesPlayed`, `sports[]`.
     - `VenueOwner`: `businessName`.
     - `Admin`: `adminLevel` (`SUPERADMIN`, `MODERATOR`).
   - Secure password hashing with `bcryptjs` and stateless JWT-based authentication.

2. **Venues, Facilities & Geospatial Search**:
   - GeoJSON `Point` coordinates indexed with MongoDB `2dsphere`.
   - Proximity search via `$nearSphere` radius filtering.
   - Ground management with surface types (e.g., AstroTurf, Hard Court) and sport tagging.

3. **Slot Scheduling & `blocksSlot()`**:
   - Conflict-free slot generation with compound unique indices.
   - Facility maintenance / offline booking locking via `blocksSlot()` and unblocking.
   - Availability checking by ground and date.

4. **Transactional Booking & Double-Booking Prevention**:
   - Transactional Mongoose sessions with automatic fallback to atomic Compare-And-Swap (ACAS) concurrency guards for standalone MongoDB instances.
   - Unique cryptographic QR Pass generation (`KHEL-...`) for gate check-ins.
   - Automatic game counter increments.

5. **Community Matchmaking & Broadcast Pings**:
   - `OpenMatch` creation with minimum player reliability thresholds.
   - Broadcast notification pings to matching players interested in the sport.
   - Join request workflow with host approvals and automatic match closure when target headcount is met.

6. **Social & Reputation System**:
   - Peer reviews (`sportsmanship`, `skillRating`, `comment`) dynamically recalculating player reliability scores.
   - Skill tag endorsements.
   - 1-on-1 direct messaging and match room chat.

7. **Platform Safety & Administrative Moderation**:
   - User report submission queue.
   - Administrative review and resolution.
   - `banUser()`: Instant account suspension with middleware enforcement.
   - `overrideScore()`: Manual reliability score adjustments.
   - Immutable `AuditLog` tracking all administrative interventions.

---

## 📁 Project Structure

```text
src/
├── config/                  # Database connection and validated environment config
│   ├── db.js
│   └── env.js
├── constants/               # Enums for roles, statuses, and permissions
│   └── index.js
├── controllers/             # Express request/response controllers
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── match.controller.js
│   ├── slot.controller.js
│   ├── social.controller.js
│   └── venue.controller.js
├── middleware/              # Auth, RBAC, Zod validation, and error handling
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── role.middleware.js
│   └── validate.middleware.js
├── models/                  # Mongoose models and discriminators
│   ├── AuditLog.js
│   ├── BookingRequest.js
│   ├── ChatMessage.js
│   ├── Ground.js
│   ├── JoinRequest.js
│   ├── OpenMatch.js
│   ├── PlayerReview.js
│   ├── Report.js
│   ├── SkillTag.js
│   ├── Slot.js
│   ├── User.js              # Base User, Player, Admin, VenueOwner
│   ├── Venue.js
│   └── index.js             # Central export
├── routes/                  # Express endpoint definitions
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── booking.routes.js
│   ├── match.routes.js
│   ├── slot.routes.js
│   ├── social.routes.js
│   ├── venue.routes.js
│   └── index.js             # Master router (/api)
├── services/                # Business logic layer
│   ├── admin.service.js
│   ├── auth.service.js
│   ├── booking.service.js
│   ├── match.service.js
│   ├── notification.service.js
│   ├── slot.service.js
│   ├── social.service.js
│   └── venue.service.js
├── utils/                   # ApiError, ApiResponse, asyncHandler, token helpers
│   ├── apiError.js
│   ├── apiResponse.js
│   ├── asyncHandler.js
│   └── token.js
├── app.js                   # Express configuration (Helmet, CORS, Morgan)
└── server.js                # Server entry point & graceful shutdown
scripts/
├── seed.js                  # Realistic database seeder
└── verifyFlow.js            # Automated end-to-end verification suite
```

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on v24)
- **MongoDB** (v5.0 or higher running locally or MongoDB Atlas)

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/khelnow
JWT_SECRET=super_secret_jwt_key_khelnow_production_grade_token_signing_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Realistic Data
```bash
npm run seed
```
This populates the database with venue owners, venues in Bangalore, grounds, slots, players, open matches, and skill tags.

### 5. Run Verification Flow Test
```bash
npm run test:flow
```
Executes an automated end-to-end test suite testing every single requirement and endpoint lifecycle.

### 6. Start the Server
- **Development Mode** (with native file watcher):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

---

## 📋 API Reference Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register Player, Venue Owner, or Admin | Public |
| `POST` | `/api/auth/login` | Login with username/email & password | Public |
| `GET` | `/api/auth/me` | Get authenticated user profile | Authenticated |

### Venues & Grounds (`/api/venues`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/venues` | List venues with optional city/search filters | Public |
| `GET` | `/api/venues/nearby` | Geospatial 2dsphere proximity search (`lat`, `lng`, `distance`) | Public |
| `GET` | `/api/venues/:id` | Get venue details and active grounds | Public |
| `POST` | `/api/venues` | Register a new venue | Venue Owner / Admin |
| `POST` | `/api/venues/:id/grounds` | Add ground/pitch to venue | Venue Owner / Admin |
| `GET` | `/api/venues/:id/grounds` | List grounds of a venue | Public |

### Slots & Availability (`/api/slots`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/slots/ground/:groundId/available` | View available slots for a ground | Public |
| `POST` | `/api/slots/ground/:groundId` | Create a bookable time slot | Venue Owner / Admin |
| `POST` | `/api/slots/:id/block` | Block a slot (`blocksSlot()`) for maintenance | Venue Owner / Admin |
| `POST` | `/api/slots/:id/unblock` | Unblock a slot back to AVAILABLE | Venue Owner / Admin |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/bookings` | Book a slot (transactional concurrency-guarded) | Player |
| `GET` | `/api/bookings/my` | View player booking history with QR pass codes | Player |
| `GET` | `/api/bookings/verify/:qrPass` | Verify player entry pass at venue gate | Venue Owner / Admin |

### Matchmaking (`/api/matches`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/matches` | List open matches with reliability filters | Public |
| `GET` | `/api/matches/:id` | Get match details and joined players | Public |
| `POST` | `/api/matches` | Create OpenMatch & trigger broadcast pings | Player |
| `POST` | `/api/matches/:id/join` | Submit JoinRequest to an OpenMatch | Player |
| `GET` | `/api/matches/:id/join-requests` | View pending join requests for host's match | Host |
| `POST` | `/api/matches/requests/:requestId/respond` | Accept or reject a join request | Host |

### Social & Community (`/api/social`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/social/reviews` | Review a player (adjusts reliability score) | Player |
| `POST` | `/api/social/skills/endorse` | Endorse a skill tag for a player | Player |
| `GET` | `/api/social/skills/:playerId` | Get player's endorsed skill tags | Public |
| `POST` | `/api/social/chat/messages` | Send direct or match room message | Authenticated |
| `GET` | `/api/social/chat/messages` | Read messages for a room or user thread | Authenticated |

### Safety & Moderation (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/admin/reports` | File a misconduct report against a user | Authenticated |
| `GET` | `/api/admin/reports` | Moderation queue: list reports | Admin |
| `PATCH` | `/api/admin/reports/:id/resolve` | Resolve or dismiss report with audit entry | Admin |
| `POST` | `/api/admin/users/:id/ban` | Suspend / unsuspend user (`banUser()`) | Admin |
| `PATCH` | `/api/admin/players/:id/reliability-score` | Manually adjust score (`overrideScore()`) | Admin |
| `GET` | `/api/admin/audit-logs` | Retrieve compliance audit trail | Admin |

---

## 🔒 Security Best Practices Implemented
- **Helmet**: Secures HTTP response headers against cross-site scripting and sniffing attacks.
- **CORS**: Configurable allowed origin whitelist.
- **Request Payload Validation**: Comprehensive Zod schemas protecting every incoming endpoint parameter.
- **Password Protection**: Salting and hashing via `bcryptjs`, excluded from default query projections (`select: false`).
- **Authorization Guard**: Token payload cross-referenced with database to ensure banned or deactivated users cannot access protected resources.
