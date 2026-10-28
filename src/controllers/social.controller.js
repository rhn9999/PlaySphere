import { SocialService } from '../services/social.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  const result = await SocialService.createPlayerReview(req.user._id, req.body);
  return ApiResponse.created(res, result, 'Review submitted successfully');
});

export const endorseSkill = asyncHandler(async (req, res) => {
  const { playerId, skillName } = req.body;
  const result = await SocialService.endorseSkill(req.user._id, playerId, skillName);
  return ApiResponse.created(res, result, 'Skill endorsed successfully');
});

export const getPlayerSkills = asyncHandler(async (req, res) => {
  const skills = await SocialService.getPlayerSkills(req.params.playerId);
  return ApiResponse.success(res, skills, 'Player skill tags retrieved successfully');
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await SocialService.sendMessage(req.user._id, req.body);
  return ApiResponse.created(res, message, 'Chat message sent successfully');
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await SocialService.getMessages({
    room: req.query.room,
    userA: req.user._id,
    userB: req.query.recipientId,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 50
  });
  return ApiResponse.success(res, messages, 'Chat messages retrieved successfully');
});
