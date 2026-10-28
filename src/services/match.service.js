import { OpenMatch, JoinRequest, Player, Venue, Slot } from '../models/index.js';
import { MATCH_STATUS, JOIN_REQUEST_STATUS } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';
import { notificationService } from './notification.service.js';
import { LocationService } from './locationService.js';

export class MatchService {
  /**
   * Create an OpenMatch, copy the venue's location, and notify nearby players matching the sport
   */
  static async createOpenMatch(hostId, matchData) {
    const host = await Player.findById(hostId);
    if (!host) {
      throw ApiError.notFound('Host player profile not found');
    }

    const {
      title,
      sport,
      targetHeadcount,
      minReliability = 0,
      startTime,
      venueId,
      slotId,
      locationName
    } = matchData;

    // Verify host meets the minimum reliability requirement
    if (host.reliabilityScore < minReliability) {
      throw ApiError.badRequest(
        `Your reliability score (${host.reliabilityScore}) is lower than the match requirement (${minReliability})`
      );
    }

    let resolvedVenueId = venueId || null;
    let resolvedSlotId = slotId || null;
    let resolvedLocation = null;
    let resolvedLocationName = locationName || '';
    let matchStartTime = startTime ? new Date(startTime) : new Date(Date.now() + 3600 * 1000);

    // If a slot is specified, fetch the slot, ground, and associated venue
    if (resolvedSlotId) {
      const slot = await Slot.findById(resolvedSlotId).populate({
        path: 'ground',
        populate: { path: 'venue' }
      });

      if (!slot) {
        throw ApiError.notFound('Slot not found');
      }

      matchStartTime = slot.start;
      if (slot.ground?.venue) {
        const venue = slot.ground.venue;
        resolvedVenueId = venue._id;
        resolvedLocation = {
          type: 'Point',
          coordinates: venue.location?.coordinates || [0, 0]
        };
        resolvedLocationName = venue.name;
      }
    } else if (resolvedVenueId) {
      // If venueId is specified, fetch venue and copy its location
      const venue = await Venue.findById(resolvedVenueId);
      if (venue) {
        resolvedLocation = {
          type: 'Point',
          coordinates: venue.location?.coordinates || [0, 0]
        };
        if (!resolvedLocationName) {
          resolvedLocationName = venue.name;
        }
      }
    }

    const openMatch = await OpenMatch.create({
      host: hostId,
      title: title || `${sport} Match`,
      sport,
      targetHeadcount,
      minReliability,
      startTime: matchStartTime,
      venue: resolvedVenueId,
      slot: resolvedSlotId,
      location: resolvedLocation,
      locationName: resolvedLocationName,
      status: MATCH_STATUS.SEARCHING,
      joinedPlayers: [hostId] // Host is the first joined player
    });

    // Notify nearby players based on geographic proximity
    let eligibleNearbyPlayers = [];
    if (resolvedLocation?.coordinates && resolvedLocation.coordinates.length === 2) {
      const [lng, lat] = resolvedLocation.coordinates;
      const searchRadius = host.searchRadius || 5000;

      const nearbyPlayers = await LocationService.findPlayersNearby(
        lng,
        lat,
        searchRadius,
        sport,
        hostId
      );

      eligibleNearbyPlayers = nearbyPlayers.filter(
        (p) => p.reliabilityScore >= minReliability
      );

      await notificationService.notifyNearbyPlayersForMatch({
        openMatch,
        nearbyPlayers: eligibleNearbyPlayers,
        isPing: false
      });
    }

    // Also count eligible players globally for backward compatibility
    const eligiblePlayersCount = await Player.countDocuments({
      _id: { $ne: hostId },
      $or: [{ preferredSports: sport }, { sports: sport }],
      reliabilityScore: { $gte: minReliability },
      isBanned: false
    });

    notificationService.broadcastOpenMatchPing(openMatch, eligiblePlayersCount);

    return openMatch;
  }

  /**
   * Re-broadcast ping to nearby players to fill remaining spots.
   * Host only; rate-limited to once per 5 minutes per match.
   */
  static async pingNearbyPlayers(matchId, hostId) {
    const openMatch = await OpenMatch.findById(matchId);
    if (!openMatch) {
      throw ApiError.notFound('Match not found');
    }

    // Only host can trigger re-broadcast ping
    if (openMatch.host.toString() !== hostId.toString()) {
      throw ApiError.forbidden('Only the match host can ping nearby players');
    }

    // Rate-limit: 1 ping per 5 minutes (300 seconds)
    const COOLDOWN_MS = 5 * 60 * 1000;
    if (openMatch.lastPingAt) {
      const timeSincePing = Date.now() - openMatch.lastPingAt.getTime();
      if (timeSincePing < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSincePing) / 1000);
        throw ApiError.tooManyRequests(
          `Ping cooldown active. Please wait ${remainingSeconds} seconds before pinging again.`
        );
      }
    }

    // Find coordinates
    let coordinates = openMatch.location?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      if (openMatch.venue) {
        const venue = await Venue.findById(openMatch.venue);
        if (venue?.location?.coordinates) {
          coordinates = venue.location.coordinates;
          openMatch.location = { type: 'Point', coordinates };
        }
      }
    }

    let notifiedCount = 0;
    if (coordinates && coordinates.length === 2) {
      const host = await Player.findById(hostId);
      const searchRadius = host?.searchRadius || 5000;

      const nearbyPlayers = await LocationService.findPlayersNearby(
        coordinates[0],
        coordinates[1],
        searchRadius,
        openMatch.sport,
        hostId
      );

      const eligibleNearby = nearbyPlayers.filter(
        (p) => p.reliabilityScore >= openMatch.minReliability
      );

      await notificationService.notifyNearbyPlayersForMatch({
        openMatch,
        nearbyPlayers: eligibleNearby,
        isPing: true
      });

      notifiedCount = eligibleNearby.length;
    }

    openMatch.lastPingAt = new Date();
    await openMatch.save();

    return {
      matchId: openMatch._id,
      notifiedPlayersCount: notifiedCount,
      lastPingAt: openMatch.lastPingAt
    };
  }

  /**
   * List open matches with optional filters
   */
  static async listOpenMatches(filters = {}, requestingPlayer = null) {
    const query = {
      status: { $in: [MATCH_STATUS.OPEN, MATCH_STATUS.SEARCHING] }
    };

    if (filters.sport) {
      query.sport = new RegExp(filters.sport, 'i');
    }

    if (requestingPlayer && typeof requestingPlayer.reliabilityScore === 'number') {
      query.minReliability = { $lte: requestingPlayer.reliabilityScore };
    }

    const matches = await OpenMatch.find(query)
      .populate('host', 'name username reliabilityScore')
      .populate('joinedPlayers', 'name username reliabilityScore')
      .populate('venue', 'name address location')
      .sort({ startTime: 1 });

    return matches;
  }

  /**
   * Get match details by ID
   */
  static async getMatchById(matchId) {
    const match = await OpenMatch.findById(matchId)
      .populate('host', 'name username reliabilityScore bio')
      .populate('joinedPlayers', 'name username reliabilityScore')
      .populate('venue')
      .populate('slot');

    if (!match) {
      throw ApiError.notFound('Match not found');
    }

    return match;
  }

  /**
   * Request to join an OpenMatch
   */
  static async requestJoin(matchId, playerId, message = '') {
    const match = await OpenMatch.findById(matchId);
    if (!match) {
      throw ApiError.notFound('Match not found');
    }

    if (
      match.status !== MATCH_STATUS.OPEN &&
      match.status !== MATCH_STATUS.SEARCHING
    ) {
      throw ApiError.badRequest('This match is no longer open for new players');
    }

    if (match.host.toString() === playerId.toString()) {
      throw ApiError.badRequest('You are the host of this match');
    }

    if (match.joinedPlayers.some((p) => p.toString() === playerId.toString())) {
      throw ApiError.badRequest('You have already joined this match');
    }

    const player = await Player.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player profile not found');
    }

    if (player.reliabilityScore < match.minReliability) {
      throw ApiError.forbidden(
        `Your reliability score (${player.reliabilityScore}) is below the match requirement (${match.minReliability})`
      );
    }

    const existing = await JoinRequest.findOne({
      match: matchId,
      player: playerId
    });

    if (existing) {
      if (existing.status === JOIN_REQUEST_STATUS.PENDING) {
        throw ApiError.conflict('You already have a pending join request for this match');
      }
      if (existing.status === JOIN_REQUEST_STATUS.ACCEPTED) {
        throw ApiError.conflict('You have already been accepted into this match');
      }
      existing.status = JOIN_REQUEST_STATUS.PENDING;
      existing.message = message;
      existing.requestedAt = new Date();
      await existing.save();
      return existing;
    }

    const joinRequest = await JoinRequest.create({
      match: matchId,
      player: playerId,
      message,
      status: JOIN_REQUEST_STATUS.PENDING
    });

    notificationService.sendDirectNotification(
      match.host,
      'New Join Request',
      `${player.name} requested to join your ${match.sport} match`,
      { matchId, joinRequestId: joinRequest._id }
    );

    return joinRequest;
  }

  /**
   * Host responds to a join request (ACCEPTED / REJECTED)
   */
  static async respondToJoinRequest(requestId, hostId, action) {
    const request = await JoinRequest.findById(requestId).populate('match');
    if (!request) {
      throw ApiError.notFound('Join request not found');
    }

    const match = request.match;
    if (match.host.toString() !== hostId.toString()) {
      throw ApiError.forbidden('Only the match host can accept or reject join requests');
    }

    if (request.status !== JOIN_REQUEST_STATUS.PENDING) {
      throw ApiError.badRequest(`Join request has already been ${request.status.toLowerCase()}`);
    }

    if (action === JOIN_REQUEST_STATUS.ACCEPTED) {
      const currentCount = match.joinedPlayers.length;
      if (currentCount >= match.targetHeadcount) {
        throw ApiError.conflict('Match target headcount has already been reached');
      }

      match.joinedPlayers.push(request.player);

      // Check if match is now full
      if (match.joinedPlayers.length >= match.targetHeadcount) {
        match.status = MATCH_STATUS.TEAM_FULL;
      }

      await match.save();

      // Increment gamesPlayed for the accepted player
      await Player.findByIdAndUpdate(request.player, { $inc: { gamesPlayed: 1 } });

      request.status = JOIN_REQUEST_STATUS.ACCEPTED;
      request.respondedAt = new Date();
      await request.save();

      notificationService.sendDirectNotification(
        request.player,
        'Join Request Accepted',
        `You have been accepted into the ${match.sport} match!`,
        { matchId: match._id }
      );
    } else {
      request.status = JOIN_REQUEST_STATUS.REJECTED;
      request.respondedAt = new Date();
      await request.save();

      notificationService.sendDirectNotification(
        request.player,
        'Join Request Declined',
        `Your request to join the ${match.sport} match was declined.`,
        { matchId: match._id }
      );
    }

    return { request, match };
  }

  /**
   * Get join requests for a match (for the host to inspect)
   */
  static async getMatchJoinRequests(matchId, hostId) {
    const match = await OpenMatch.findById(matchId);
    if (!match) {
      throw ApiError.notFound('Match not found');
    }

    if (match.host.toString() !== hostId.toString()) {
      throw ApiError.forbidden('Only the match host can view join requests');
    }

    return JoinRequest.find({ match: matchId })
      .populate('player', 'name username reliabilityScore sports')
      .sort({ requestedAt: -1 });
  }
}
