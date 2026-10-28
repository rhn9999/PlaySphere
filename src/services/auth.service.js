import { User, Player, Admin, VenueOwner } from '../models/index.js';
import { ROLES } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/token.js';

export class AuthService {
  /**
   * Register a new user using Mongoose Discriminators based on role
   */
  static async registerUser(payload) {
    const { name, username, email, password, bio, avatarUrl, role, ...roleData } = payload;

    // Check existing email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.conflict('Username is already taken');
    }

    let newUser;
    const baseData = {
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      bio,
      avatarUrl,
      role
    };

    switch (role) {
      case ROLES.PLAYER:
        newUser = new Player({
          ...baseData,
          sports: roleData.sports || [],
          reliabilityScore: 100,
          gamesPlayed: 0
        });
        break;

      case ROLES.ADMIN:
        newUser = new Admin({
          ...baseData,
          adminLevel: roleData.adminLevel || 'MODERATOR'
        });
        break;

      case ROLES.VENUE_OWNER:
        if (!roleData.businessName) {
          throw ApiError.badRequest('businessName is required for VENUE_OWNER');
        }
        newUser = new VenueOwner({
          ...baseData,
          businessName: roleData.businessName
        });
        break;

      default:
        newUser = new User(baseData);
    }

    await newUser.save();

    const token = signToken({
      id: newUser._id,
      role: newUser.role,
      username: newUser.username
    });

    return {
      user: newUser.toJSON(),
      token
    };
  }

  /**
   * Log in user with email or username and password
   */
  static async loginUser(payload = {}) {
    const rawIdentifier = (
      payload.identifier ||
      payload.login ||
      payload.email ||
      payload.username ||
      payload.emailOrUsername ||
      ''
    ).trim();

    const password = payload.password;

    if (!rawIdentifier || !password) {
      throw ApiError.badRequest('Email or username and password are required');
    }

    // Strip leading @ if user typed @username
    const cleanIdentifier = rawIdentifier.startsWith('@')
      ? rawIdentifier.slice(1).trim()
      : rawIdentifier;

    const normalized = cleanIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }]
    }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (user.isBanned) {
      throw ApiError.forbidden('Your account has been suspended by administration');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = signToken({
      id: user._id,
      role: user.role,
      username: user.username
    });

    const userObj = user.toJSON();

    return {
      token,
      user: {
        ...userObj,
        id: user._id.toString()
      }
    };
  }

  /**
   * Fetch currently authenticated user profile
   */
  static async getCurrentUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user.toJSON();
  }
}
