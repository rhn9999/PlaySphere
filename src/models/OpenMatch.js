import mongoose from 'mongoose';
import { MATCH_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const openMatchSchema = new Schema(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host player reference is required'],
      index: true
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
      index: true
    },
    targetHeadcount: {
      type: Number,
      required: [true, 'Target headcount is required'],
      min: [2, 'Target headcount must be at least 2']
    },
    minReliability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: Object.values(MATCH_STATUS),
      default: MATCH_STATUS.SEARCHING,
      index: true
    },
    startTime: {
      type: Date,
      default: () => new Date(Date.now() + 3600 * 1000)
    },
    venue: {
      type: Schema.Types.ObjectId,
      ref: 'Venue'
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'Slot'
    },
    locationName: {
      type: String,
      default: ''
    },
    location: {
      type: new Schema(
        {
          type: {
            type: String,
            enum: ['Point'],
            required: true
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
          }
        },
        { _id: false }
      ),
      default: undefined
    },
    lastPingAt: {
      type: Date,
      default: null
    },
    joinedPlayers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 2dsphere index for geospatial queries on matches
openMatchSchema.index({ location: '2dsphere' }, { sparse: true });

// Virtual for remaining slots
openMatchSchema.virtual('remainingSlots').get(function () {
  const currentCount = (this.joinedPlayers?.length || 0) + 1; // +1 for host
  return Math.max(0, this.targetHeadcount - currentCount);
});

export const OpenMatch =
  mongoose.models.OpenMatch || mongoose.model('OpenMatch', openMatchSchema);
