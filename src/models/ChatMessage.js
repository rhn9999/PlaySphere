import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    room: {
      type: String,
      trim: true,
      index: true
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

chatMessageSchema.pre('validate', function (next) {
  if (!this.recipient && !this.room) {
    this.invalidate('room', 'Message must have either a recipient or a room identifier');
  }
  next();
});

export const ChatMessage =
  mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
