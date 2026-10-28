import mongoose from 'mongoose';
import { REPORT_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
      index: true
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported target user ID is required'],
      index: true
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [1000, 'Reason cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
      index: true
    },
    resolver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    resolutionNote: {
      type: String,
      default: '',
      trim: true
    },
    actionTaken: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
