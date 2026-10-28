import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await AuthService.registerUser(req.body);
  return ApiResponse.created(res, result, 'User registered successfully');
});

export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.loginUser(req.body);
  return ApiResponse.success(res, result, 'Login successful');
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await AuthService.getCurrentUserProfile(req.user._id);
  return ApiResponse.success(res, profile, 'Profile retrieved successfully');
});
