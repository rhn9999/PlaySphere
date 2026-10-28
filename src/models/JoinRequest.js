import mongoose from 'mongoose';
import { JOIN_REQUEST_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const joinRequestSchema = new Schema(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: 'OpenMatch',
      required: [true, 'Match ID is required'],
      index: true
    },
    player: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(JOIN_REQUEST_STATUS),
      default: JOIN_REQUEST_STATUS.PENDING,
      index: true
    },
    message: {
      type: String,
      default: '',
      maxlength: 200
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate join request from same player to same match
joinRequestSchema.index({ match: 1, player: 1 }, { unique: true });

export const JoinRequest =
  mongoose.models.JoinRequest || mongoose.model('JoinRequest', joinRequestSchema);
