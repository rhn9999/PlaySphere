import { BookingService } from '../services/booking.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookSlot = asyncHandler(async (req, res) => {
  const result = await BookingService.bookSlot({
    playerId: req.user._id,
    slotId: req.body.slotId,
    notes: req.body.notes
  });
  return ApiResponse.created(res, result, 'Slot booked successfully and QR Pass generated');
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.getPlayerBookings(req.user._id);
  return ApiResponse.success(res, bookings, 'Bookings retrieved successfully');
});

export const verifyQrPass = asyncHandler(async (req, res) => {
  const booking = await BookingService.verifyQrPass(req.params.qrPass);
  return ApiResponse.success(res, booking, 'QR Pass verified successfully');
});
