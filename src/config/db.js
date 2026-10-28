import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDB = async (uri = env.MONGO_URI) => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Ensure all model indexes (unique, 2dsphere, text) are created on startup
    try {
      const {
        User,
        Player,
        Venue,
        Ground,
        Slot,
        OpenMatch,
        JoinRequest,
        BookingRequest,
        PlayerReview,
        VenueReview,
        SkillTag,
        Report,
        AuditLog
      } = await import('../models/index.js');

      await Promise.allSettled([
        User.syncIndexes(),
        Player.syncIndexes(),
        Venue.syncIndexes(),
        Ground.syncIndexes(),
        Slot.syncIndexes(),
        OpenMatch.syncIndexes(),
        JoinRequest.syncIndexes(),
        BookingRequest.syncIndexes(),
        PlayerReview.syncIndexes(),
        VenueReview.syncIndexes(),
        SkillTag.syncIndexes(),
        Report.syncIndexes(),
        AuditLog.syncIndexes()
      ]);
    } catch (indexErr) {
      console.warn('⚠️ Non-critical index sync warning:', indexErr.message);
    }

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
      isConnected = false;
    });

    return conn.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB connection closed.');
  }
};
