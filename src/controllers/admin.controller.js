import { AdminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const fileReport = asyncHandler(async (req, res) => {
  const report = await AdminService.fileReport(req.user._id, req.body);
  return ApiResponse.created(res, report, 'Report submitted successfully to administration');
});

export const listReports = asyncHandler(async (req, res) => {
  const reports = await AdminService.listReports(req.query.status);
  return ApiResponse.success(res, reports, 'Reports retrieved successfully');
});

export const resolveReport = asyncHandler(async (req, res) => {
  const report = await AdminService.resolveReport(req.params.id, req.user._id, req.body);
  return ApiResponse.success(res, report, 'Report resolved successfully');
});

export const banUser = asyncHandler(async (req, res) => {
  const result = await AdminService.banUser(req.params.id, req.user._id, req.body);
  const statusMsg = req.body.isBanned ? 'User banned successfully' : 'User unbanned successfully';
  return ApiResponse.success(res, result, statusMsg);
});

export const overrideScore = asyncHandler(async (req, res) => {
  const result = await AdminService.overrideScore(req.params.id, req.user._id, req.body);
  return ApiResponse.success(res, result, 'Player reliability score overridden successfully');
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
  const logs = await AdminService.getAuditLogs(limit);
  return ApiResponse.success(res, logs, 'Audit logs retrieved successfully');
});
