import { Report, AuditLog, User, Player } from '../models/index.js';
import { REPORT_STATUS, ROLES } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';

export class AdminService {
  /**
   * File a report against a user/player (Platform safety)
   */
  static async fileReport(reporterId, { targetUserId, reason }) {
    if (reporterId.toString() === targetUserId.toString()) {
      throw ApiError.badRequest('You cannot report yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Reported user does not exist');
    }

    const report = await Report.create({
      reporter: reporterId,
      targetUser: targetUserId,
      reason,
      status: REPORT_STATUS.PENDING
    });

    return report;
  }

  /**
   * List reports for moderation queue
   */
  static async listReports(status = null) {
    const query = {};
    if (status) {
      query.status = status;
    }

    return Report.find(query)
      .populate('reporter', 'name username email role')
      .populate('targetUser', 'name username email role isBanned')
      .populate('resolver', 'name username')
      .sort({ createdAt: -1 });
  }

  /**
   * Admin resolves or dismisses a report
   */
  static async resolveReport(reportId, adminId, { status, resolutionNote, actionTaken }) {
    const report = await Report.findById(reportId);
    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    report.status = status;
    report.resolver = adminId;
    report.resolutionNote = resolutionNote;
    report.actionTaken = actionTaken || '';
    report.resolvedAt = new Date();

    await report.save();

    // Log admin action to AuditLog
    await AuditLog.create({
      admin: adminId,
      action: `RESOLVE_REPORT_${status}`,
      target: reportId.toString(),
      details: { resolutionNote, actionTaken, targetUser: report.targetUser }
    });

    return report;
  }

  /**
   * Admin ban or unban user (banUser() requirement)
   */
  static async banUser(targetUserId, adminId, { isBanned, reason }) {
    const user = await User.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === ROLES.ADMIN) {
      throw ApiError.badRequest('Administrators cannot be banned via this endpoint');
    }

    user.isBanned = isBanned;
    await user.save();

    // Log administrative action
    const actionName = isBanned ? 'BAN_USER' : 'UNBAN_USER';
    const audit = await AuditLog.create({
      admin: adminId,
      action: actionName,
      target: targetUserId.toString(),
      details: { reason, targetUsername: user.username, targetEmail: user.email }
    });

    return { user, audit };
  }

  /**
   * Admin manually overrides a player's reliability score (overrideScore() requirement)
   */
  static async overrideScore(playerId, adminId, { reliabilityScore, reason }) {
    const player = await Player.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player profile not found');
    }

    const previousScore = player.reliabilityScore;
    player.reliabilityScore = reliabilityScore;
    await player.save();

    // Record in AuditLog
    const audit = await AuditLog.create({
      admin: adminId,
      action: 'OVERRIDE_RELIABILITY_SCORE',
      target: playerId.toString(),
      details: {
        reason,
        previousScore,
        newScore: reliabilityScore,
        playerUsername: player.username
      }
    });

    return { player, previousScore, newScore: reliabilityScore, audit };
  }

  /**
   * Retrieve platform audit logs
   */
  static async getAuditLogs(limit = 100) {
    return AuditLog.find()
      .populate('admin', 'name username email')
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}
