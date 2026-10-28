import { MatchService } from '../services/match.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createMatch = asyncHandler(async (req, res) => {
  const match = await MatchService.createOpenMatch(req.user._id, req.body);
  return ApiResponse.created(res, match, 'Open match created and nearby players notified');
});

export const listMatches = asyncHandler(async (req, res) => {
  const matches = await MatchService.listOpenMatches(req.query, req.user);
  return ApiResponse.success(res, matches, 'Open matches retrieved successfully');
});

export const getMatchById = asyncHandler(async (req, res) => {
  const match = await MatchService.getMatchById(req.params.id);
  return ApiResponse.success(res, match, 'Match details retrieved successfully');
});

export const pingNearbyPlayers = asyncHandler(async (req, res) => {
  const result = await MatchService.pingNearbyPlayers(req.params.id, req.user._id);
  return ApiResponse.success(res, result, 'Re-broadcast ping sent to nearby players successfully');
});

export const requestJoin = asyncHandler(async (req, res) => {
  const joinRequest = await MatchService.requestJoin(
    req.params.id,
    req.user._id,
    req.body.message
  );
  return ApiResponse.created(res, joinRequest, 'Join request submitted to match host');
});

export const respondJoinRequest = asyncHandler(async (req, res) => {
  const result = await MatchService.respondToJoinRequest(
    req.params.requestId,
    req.user._id,
    req.body.action
  );
  return ApiResponse.success(res, result, `Join request has been ${req.body.action.toLowerCase()}`);
});

export const getMatchJoinRequests = asyncHandler(async (req, res) => {
  const requests = await MatchService.getMatchJoinRequests(req.params.id, req.user._id);
  return ApiResponse.success(res, requests, 'Match join requests retrieved successfully');
});
