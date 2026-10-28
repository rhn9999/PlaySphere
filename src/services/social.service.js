import { PlayerReview, SkillTag, ChatMessage, Player, User } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';

export class SocialService {
  /**
   * Submit a review for a player and adjust their reliability and reputation score
   */
  static async createPlayerReview(reviewerId, reviewData) {
    const { targetPlayerId, sportsmanship, skillRating, comment } = reviewData;

    if (reviewerId.toString() === targetPlayerId.toString()) {
      throw ApiError.badRequest('Players cannot submit reviews for themselves');
    }

    const targetPlayer = await Player.findById(targetPlayerId);
    if (!targetPlayer) {
      throw ApiError.notFound('Target player not found');
    }

    // Check if review already exists
    let review = await PlayerReview.findOne({
      reviewer: reviewerId,
      targetPlayer: targetPlayerId
    });

    if (review) {
      review.sportsmanship = sportsmanship;
      review.skillRating = skillRating;
      review.comment = comment || '';
      await review.save();
    } else {
      review = await PlayerReview.create({
        reviewer: reviewerId,
        targetPlayer: targetPlayerId,
        sportsmanship,
        skillRating,
        comment: comment || ''
      });
    }

    // Recalculate player reliability score based on aggregate sportsmanship (1-5 scaled to 0-100)
    const allReviews = await PlayerReview.find({ targetPlayer: targetPlayerId });
    if (allReviews.length > 0) {
      const avgSportsmanship =
        allReviews.reduce((sum, r) => sum + r.sportsmanship, 0) / allReviews.length;
      // Formula: weighted 80% default baseline + 20% review impact, or direct percentage
      const calculatedScore = Math.round((avgSportsmanship / 5) * 100);
      targetPlayer.reliabilityScore = calculatedScore;
      await targetPlayer.save();
    }

    return { review, updatedReliabilityScore: targetPlayer.reliabilityScore };
  }

  /**
   * Endorse a skill tag for a player
   */
  static async endorseSkill(endorserId, playerId, skillName) {
    const normalizedSkill = skillName.trim().toLowerCase();

    if (endorserId.toString() === playerId.toString()) {
      throw ApiError.badRequest('Players cannot endorse their own skills');
    }

    const player = await Player.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player not found');
    }

    let skill = await SkillTag.findOne({
      player: playerId,
      name: normalizedSkill
    });

    if (skill) {
      if (skill.endorsedBy.some((id) => id.toString() === endorserId.toString())) {
        throw ApiError.conflict('You have already endorsed this player for this skill');
      }

      skill.endorsedBy.push(endorserId);
      skill.endorsementCount = skill.endorsedBy.length;
      await skill.save();
    } else {
      skill = await SkillTag.create({
        name: normalizedSkill,
        player: playerId,
        endorsementCount: 1,
        endorsedBy: [endorserId]
      });
    }

    return skill;
  }

  /**
   * Get all endorsed skills for a player
   */
  static async getPlayerSkills(playerId) {
    return SkillTag.find({ player: playerId }).sort({ endorsementCount: -1 });
  }

  /**
   * Send a chat message (Direct Message or Match Room)
   */
  static async sendMessage(senderId, { recipientId, room, text }) {
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw ApiError.notFound('Recipient user not found');
      }
    }

    const message = await ChatMessage.create({
      sender: senderId,
      recipient: recipientId || null,
      room: room || null,
      text
    });

    return message.populate('sender', 'name username avatarUrl');
  }

  /**
   * Retrieve messages for a room or direct conversation
   */
  static async getMessages({ room, userA, userB, limit = 50 }) {
    const query = {};

    if (room) {
      query.room = room;
    } else if (userA && userB) {
      query.$or = [
        { sender: userA, recipient: userB },
        { sender: userB, recipient: userA }
      ];
    } else {
      throw ApiError.badRequest('Must provide either room or two user IDs');
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'name username avatarUrl')
      .sort({ sentAt: 1 })
      .limit(limit);

    return messages;
  }
}
