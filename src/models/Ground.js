import mongoose from 'mongoose';

const { Schema } = mongoose;

const groundSchema = new Schema(
  {
    venue: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Ground name is required (e.g. Field A, Court 1)'],
      trim: true
    },
    sportType: {
      type: String,
      required: [true, 'Sport type is required (e.g. Football, Cricket, Badminton)'],
      trim: true,
      index: true
    },
    surface: {
      type: String,
      required: [true, 'Surface type is required (e.g. Turf, Clay, Grass, Hard Court)'],
      trim: true
    },
    coverPhoto: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const Ground = mongoose.models.Ground || mongoose.model('Ground', groundSchema);
