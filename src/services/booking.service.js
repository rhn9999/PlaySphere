import mongoose from 'mongoose';
import { BookingRequest, Slot, Player } from '../models/index.js';
import { BOOKING_STATUS, SLOT_STATUS } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';
import { generateQrPass } from '../utils/token.js';
import { notificationService } from './notification.service.js';

export class BookingService {
  /**
   * Secure a slot via transactional Mongoose session (preventing double-booking)
   */
  static async bookSlot({ playerId, slotId, notes }) {
    let session = null;
    let useTransaction = false;

    // Determine if connected MongoDB instance is a replica set or sharded cluster
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    const isReplicaSet =
      topologyType === 'ReplicaSetWithPrimary' ||
      topologyType === 'ReplicaSetNoPrimary' ||
      topologyType === 'Sharded' ||
      Boolean(mongoose.connection.client?.topology?.description?.setName);

    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (err) {
        useTransaction = false;
        if (session) {
          session.endSession();
          session = null;
        }
      }
    }

    try {
      if (useTransaction && session) {
        // --- 1. Transactional Mongoose execution path (Replica Sets / Atlas / Production) ---
        const slot = await Slot.findOneAndUpdate(
          { _id: slotId, status: SLOT_STATUS.AVAILABLE },
          { $set: { status: SLOT_STATUS.BOOKED } },
          { new: true, session }
        );

        if (!slot) {
          throw ApiError.conflict(
            'The requested slot is either already booked, blocked, or does not exist'
          );
        }

        const qrPass = generateQrPass('KHEL');

        const [booking] = await BookingRequest.create(
          [
            {
              player: playerId,
              slot: slot._id,
              status: BOOKING_STATUS.CONFIRMED,
              qrPass,
              totalAmount: slot.price,
              notes: notes || '',
              respondedAt: new Date()
            }
          ],
          { session }
        );

        // Increment player's gamesPlayed
        await Player.findByIdAndUpdate(
          playerId,
          { $inc: { gamesPlayed: 1 } },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        notificationService.sendDirectNotification(
          playerId,
          'Booking Confirmed',
          `Your slot booking has been confirmed! Pass Code: ${qrPass}`,
          { bookingId: booking._id, qrPass }
        );

        return { booking, slot };
      } else {
        // --- 2. Atomic Compare-And-Swap (ACAS) concurrency guard (standalone fallback) ---
        const slot = await Slot.findOneAndUpdate(
          { _id: slotId, status: SLOT_STATUS.AVAILABLE },
          { $set: { status: SLOT_STATUS.BOOKED } },
          { new: true }
        );

        if (!slot) {
          throw ApiError.conflict(
            'The requested slot is either already booked, blocked, or does not exist'
          );
        }

        const qrPass = generateQrPass('KHEL');

        try {
          const booking = await BookingRequest.create({
            player: playerId,
            slot: slot._id,
            status: BOOKING_STATUS.CONFIRMED,
            qrPass,
            totalAmount: slot.price,
            notes: notes || '',
            respondedAt: new Date()
          });

          await Player.findByIdAndUpdate(playerId, { $inc: { gamesPlayed: 1 } });

          notificationService.sendDirectNotification(
            playerId,
            'Booking Confirmed',
            `Your slot booking has been confirmed! Pass Code: ${qrPass}`,
            { bookingId: booking._id, qrPass }
          );

          return { booking, slot };
        } catch (bookingError) {
          // Rollback slot status if booking document creation fails
          await Slot.findByIdAndUpdate(slotId, { $set: { status: SLOT_STATUS.AVAILABLE } });
          throw bookingError;
        }
      }
    } catch (error) {
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * List bookings for a player
   */
  static async getPlayerBookings(playerId) {
    return BookingRequest.find({ player: playerId })
      .populate({
        path: 'slot',
        populate: {
          path: 'ground',
          populate: { path: 'venue', select: 'name address' }
        }
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Verify QR pass for venue entry check-in
   */
  static async verifyQrPass(qrPass) {
    const booking = await BookingRequest.findOne({ qrPass })
      .populate('player', 'name username email')
      .populate({
        path: 'slot',
        populate: {
          path: 'ground',
          populate: { path: 'venue' }
        }
      });

    if (!booking) {
      throw ApiError.notFound('Invalid QR Pass: No matching booking found');
    }

    return booking;
  }
}
