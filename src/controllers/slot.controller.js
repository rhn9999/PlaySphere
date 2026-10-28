import { SlotService } from '../services/slot.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createSlot = asyncHandler(async (req, res) => {
  const slot = await SlotService.createSlot(
    req.params.groundId,
    req.body,
    req.user._id,
    req.user.role
  );
  return ApiResponse.created(res, slot, 'Slot created successfully');
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const slots = await SlotService.getAvailableSlots(req.params.groundId, req.query.date);
  return ApiResponse.success(res, slots, 'Available slots retrieved successfully');
});

export const blockSlot = asyncHandler(async (req, res) => {
  const slot = await SlotService.blocksSlot(
    req.params.id,
    req.user._id,
    req.user.role,
    req.body.reason
  );
  return ApiResponse.success(res, slot, 'Slot has been blocked successfully');
});

export const unblockSlot = asyncHandler(async (req, res) => {
  const slot = await SlotService.unblockSlot(req.params.id, req.user._id, req.user.role);
  return ApiResponse.success(res, slot, 'Slot has been unblocked and made available');
});
