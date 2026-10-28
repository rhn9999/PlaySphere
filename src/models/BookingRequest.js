import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const bookingRequestSchema = new Schema(
  {
    player: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player ID is required'],
      index: true
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true
    },
    qrPass: {
      type: String,
      default: ''
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    respondedAt: {
      type: Date
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const BookingRequest =
  mongoose.models.BookingRequest || mongoose.model('BookingRequest', bookingRequestSchema);
