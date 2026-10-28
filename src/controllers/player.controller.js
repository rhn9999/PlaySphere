import { Player } from '../models/index.js';
import { LocationService } from '../services/locationService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Update player's coordinates [longitude, latitude]
 */
export const updatePlayerLocation = asyncHandler(async (req, res) => {
  const { lng, lat } = req.body;
  const playerId = req.user._id;

  const player = await LocationService.updatePlayerLocation(
    playerId,
    parseFloat(lng),
    parseFloat(lat)
  );

  return ApiResponse.success(
    res,
    {
      playerId: player._id,
      currentLocation: player.currentLocation,
      lastLocationUpdate: player.lastLocationUpdate
    },
    'Location updated successfully'
  );
});

/**
 * Register or update player's Firebase Cloud Messaging push token
 */
export const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  const playerId = req.user._id;

  const player = await Player.findByIdAndUpdate(
    playerId,
    { fcmToken },
    { new: true }
  );

  if (!player) {
    throw ApiError.notFound('Player profile not found');
  }

  return ApiResponse.success(
    res,
    {
      playerId: player._id,
      fcmToken: player.fcmToken
    },
    'FCM push notification token registered successfully'
  );
});

/**
 * Retrieve authenticated player's own profile and location configuration
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.user._id).select('-password');
  if (!player) {
    throw ApiError.notFound('Player profile not found');
  }

  return ApiResponse.success(res, player, 'Player profile retrieved successfully');
});
