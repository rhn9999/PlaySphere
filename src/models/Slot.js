import mongoose from 'mongoose';
import { SLOT_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const slotSchema = new Schema(
  {
    ground: {
      type: Schema.Types.ObjectId,
      ref: 'Ground',
      required: [true, 'Ground ID is required'],
      index: true
    },
    start: {
      type: Date,
      required: [true, 'Slot start time is required'],
      index: true
    },
    end: {
      type: Date,
      required: [true, 'Slot end time is required']
    },
    price: {
      type: Number,
      required: [true, 'Slot price is required'],
      min: [0, 'Slot price cannot be negative']
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.AVAILABLE,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// End date must be greater than start date
slotSchema.pre('validate', function (next) {
  if (this.start && this.end && this.end <= this.start) {
    this.invalidate('end', 'Slot end time must be after start time');
  }
  next();
});

// Compound unique index to prevent duplicate identical slot windows on the same ground
slotSchema.index({ ground: 1, start: 1, end: 1 }, { unique: true });

export const Slot = mongoose.models.Slot || mongoose.model('Slot', slotSchema);
