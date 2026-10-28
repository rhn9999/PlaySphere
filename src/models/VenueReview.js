import mongoose from 'mongoose';

const { Schema } = mongoose;

const venueReviewSchema = new Schema(
  {
    venue: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue reference is required'],
      index: true
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required (1 to 5)'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
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

// Synchronize reviewer and user fields
venueReviewSchema.pre('validate', function (next) {
  if (this.reviewer && !this.user) {
    this.user = this.reviewer;
  } else if (this.user && !this.reviewer) {
    this.reviewer = this.user;
  }
  next();
});

venueReviewSchema.index({ venue: 1, reviewer: 1 });

export const VenueReview =
  mongoose.models.VenueReview || mongoose.model('VenueReview', venueReviewSchema);
