import { Slot, Ground, Venue } from '../models/index.js';
import { SLOT_STATUS, ROLES } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';

export class SlotService {
  /**
   * Helper to verify ground ownership for the requesting user
   */
  static async verifyGroundOwner(groundId, userId, userRole) {
    const ground = await Ground.findById(groundId).populate('venue');
    if (!ground) {
      throw ApiError.notFound('Ground not found');
    }

    if (userRole !== ROLES.ADMIN) {
      if (!ground.venue || ground.venue.owner.toString() !== userId.toString()) {
        throw ApiError.forbidden('You do not have permission to manage this facility');
      }
    }

    return ground;
  }

  /**
   * Create a new bookable time slot for a ground
   */
  static async createSlot(groundId, slotData, userId, userRole) {
    await this.verifyGroundOwner(groundId, userId, userRole);

    const start = new Date(slotData.start);
    const end = new Date(slotData.end);

    if (end <= start) {
      throw ApiError.badRequest('Slot end time must be after start time');
    }

    // Check for overlapping slots on the same ground
    const overlap = await Slot.findOne({
      ground: groundId,
      status: { $ne: SLOT_STATUS.BLOCKED },
      $or: [
        { start: { $lt: end, $gte: start } },
        { end: { $gt: start, $lte: end } },
        { start: { $lte: start }, end: { $gte: end } }
      ]
    });

    if (overlap) {
      throw ApiError.conflict('A slot overlapping with this time period already exists on this ground');
    }

    const slot = await Slot.create({
      ground: groundId,
      start,
      end,
      price: slotData.price,
      status: SLOT_STATUS.AVAILABLE
    });

    return slot;
  }

  /**
   * Check slot availability for a ground on a given date
   */
  static async getAvailableSlots(groundId, dateString) {
    const ground = await Ground.findById(groundId);
    if (!ground) {
      throw ApiError.notFound('Ground not found');
    }

    const query = {
      ground: groundId,
      status: SLOT_STATUS.AVAILABLE
    };

    if (dateString) {
      const startOfDay = new Date(dateString);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateString);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.start = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default from current time onwards
      query.start = { $gte: new Date() };
    }

    const slots = await Slot.find(query).sort({ start: 1 });
    return slots;
  }

  /**
   * Venue owner blocks a slot (blocksSlot requirement)
   */
  static async blocksSlot(slotId, userId, userRole, reason = 'Maintenance / Offline Booking') {
    const slot = await Slot.findById(slotId).populate({
      path: 'ground',
      populate: { path: 'venue' }
    });

    if (!slot) {
      throw ApiError.notFound('Slot not found');
    }

    if (userRole !== ROLES.ADMIN) {
      const ownerId = slot.ground?.venue?.owner?.toString();
      if (ownerId !== userId.toString()) {
        throw ApiError.forbidden('You do not have permission to block slots for this venue');
      }
    }

    if (slot.status === SLOT_STATUS.BOOKED) {
      throw ApiError.conflict('Cannot block a slot that has already been booked by a player');
    }

    slot.status = SLOT_STATUS.BLOCKED;
    await slot.save();

    return slot;
  }

  /**
   * Venue owner unblocks a slot back to AVAILABLE
   */
  static async unblockSlot(slotId, userId, userRole) {
    const slot = await Slot.findById(slotId).populate({
      path: 'ground',
      populate: { path: 'venue' }
    });

    if (!slot) {
      throw ApiError.notFound('Slot not found');
    }

    if (userRole !== ROLES.ADMIN) {
      const ownerId = slot.ground?.venue?.owner?.toString();
      if (ownerId !== userId.toString()) {
        throw ApiError.forbidden('You do not have permission to unblock slots for this venue');
      }
    }

    slot.status = SLOT_STATUS.AVAILABLE;
    await slot.save();

    return slot;
  }
}
