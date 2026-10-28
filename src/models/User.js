import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_LIST } from '../constants/index.js';

const { Schema } = mongoose;

const baseUserOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) ret.id = ret._id.toString();
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) ret.id = ret._id.toString();
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
};

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.PLAYER,
      required: true,
      index: true
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  baseUserOptions
);

// Virtual for fullName
userSchema.virtual('fullName')
  .get(function () {
    return this.name;
  })
  .set(function (v) {
    this.name = v;
  });

// Password hashing hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method with automatic legacy migration
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;

  // 1. Try standard bcrypt comparison
  try {
    const isBcrypt =
      this.password.startsWith('$2a$') ||
      this.password.startsWith('$2b$') ||
      this.password.startsWith('$2y$');
    if (isBcrypt) {
      const match = await bcrypt.compare(candidatePassword, this.password);
      if (match) return true;
    }
  } catch {
    // If bcrypt compare encounters an error, proceed to check legacy plain-text
  }

  // 2. Safe legacy plain-text migration check
  if (candidatePassword === this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(candidatePassword, salt);
      await this.save();
    } catch (saveErr) {
      // Non-blocking fallback
    }
    return true;
  }

  return false;
};

// Base User Model
export const User = mongoose.models.User || mongoose.model('User', userSchema);

// Discriminator: Player
const playerSchema = new Schema({
  reliabilityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  sports: {
    type: [String],
    default: []
  },
  preferredSports: {
    type: [String],
    default: []
  },
  currentLocation: {
    type: new Schema(
      {
        type: {
          type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
      },
      { _id: false }
    ),
    default: undefined
  },
  searchRadius: {
    type: Number,
    default: 5000,
    min: 100,
    max: 50000
  },
  fcmToken: {
    type: String,
    default: null
  },
  lastLocationUpdate: {
    type: Date,
    default: null
  }
});

// 2dsphere index for player proximity matching (sparse for non-geocoded or base users)
playerSchema.index({ currentLocation: '2dsphere' }, { sparse: true });

export const Player =
  User.discriminators?.[ROLES.PLAYER] || User.discriminator(ROLES.PLAYER, playerSchema);

// Discriminator: Admin
const adminSchema = new Schema({
  adminLevel: {
    type: String,
    enum: ['SUPERADMIN', 'MODERATOR'],
    default: 'MODERATOR'
  }
});

export const Admin =
  User.discriminators?.[ROLES.ADMIN] || User.discriminator(ROLES.ADMIN, adminSchema);

// Discriminator: VenueOwner
const venueOwnerSchema = new Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required for Venue Owner'],
    trim: true
  }
});

export const VenueOwner =
  User.discriminators?.[ROLES.VENUE_OWNER] ||
  User.discriminator(ROLES.VENUE_OWNER, venueOwnerSchema);
