import mongoose from 'mongoose';

const { Schema } = mongoose;

const playerReviewSchema = new Schema(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true
    },
    targetPlayer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target player ID is required'],
      index: true
    },
    sportsmanship: {
      type: Number,
      required: [true, 'Sportsmanship rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    skillRating: {
      type: Number,
      required: [true, 'Skill rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    comment: {
      type: String,
      default: '',
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent reviewer from reviewing himself
playerReviewSchema.pre('validate', function (next) {
  if (this.reviewer && this.targetPlayer && this.reviewer.toString() === this.targetPlayer.toString()) {
    this.invalidate('targetPlayer', 'Players cannot review themselves');
  }
  next();
});

export const PlayerReview =
  mongoose.models.PlayerReview || mongoose.model('PlayerReview', playerReviewSchema);
