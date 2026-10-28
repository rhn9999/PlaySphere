import mongoose from 'mongoose';
import { VENUE_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    fullAddress: { type: String, required: true }
  },
  { _id: false }
);

const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates [longitude, latitude] are required'],
      validate: {
        validator: function (val) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            val[0] >= -180 &&
            val[0] <= 180 &&
            val[1] >= -90 &&
            val[1] <= 90
          );
        },
        message: 'Coordinates must be valid [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const venueSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true
    },
    address: {
      type: addressSchema,
      required: [true, 'Venue address is required']
    },
    location: {
      type: pointSchema,
      required: [true, 'Venue geo location is required']
    },
    status: {
      type: String,
      enum: Object.values(VENUE_STATUS),
      default: VENUE_STATUS.ACTIVE,
      index: true
    },
    verifyStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    photos: [
      {
        url: { type: String, required: true },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    operatingHours: {
      type: Schema.Types.Mixed,
      default: { open: '06:00', close: '23:00' }
    },
    sport: {
      type: [String],
      default: [],
      index: true
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Venue owner reference is required'],
      index: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Synchronize owner and ownerId
venueSchema.pre('validate', function (next) {
  if (this.owner && !this.ownerId) {
    this.ownerId = this.owner;
  } else if (this.ownerId && !this.owner) {
    this.owner = this.ownerId;
  }
  next();
});

// 2dsphere index for geospatial queries ($nearSphere, $geoWithin)
venueSchema.index({ location: '2dsphere' });

// Text index for search by name and address fields
venueSchema.index({
  name: 'text',
  'address.fullAddress': 'text',
  'address.city': 'text',
  'address.street': 'text'
});

export const Venue = mongoose.models.Venue || mongoose.model('Venue', venueSchema);
