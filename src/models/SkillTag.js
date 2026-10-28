import mongoose from 'mongoose';

const { Schema } = mongoose;

const skillTagSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill tag name is required'],
      trim: true,
      lowercase: true
    },
    player: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player reference is required'],
      index: true
    },
    endorsementCount: {
      type: Number,
      default: 1,
      min: 0
    },
    endorsedBy: [
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

skillTagSchema.index({ name: 1, player: 1 }, { unique: true });

export const SkillTag =
  mongoose.models.SkillTag || mongoose.model('SkillTag', skillTagSchema);
