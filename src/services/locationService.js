import axios from 'axios';
import { Venue, Player } from '../models/index.js';
import { ROLES } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';

// In-memory geocoding caches to ensure an address/coordinate is never geocoded twice
const geocodeCache = new Map();
const reverseGeocodeCache = new Map();

// Rate limiter state for Nominatim (strict 1 request/second)
let lastNominatimRequestTime = 0;

/**
 * Coordinate validator
 */
export const validateCoordinates = (lng, lat) => {
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    throw ApiError.badRequest('Longitude and latitude must be valid numbers');
  }
  if (lng < -180 || lng > 180) {
    throw ApiError.badRequest('Longitude must be between -180 and 180 degrees');
  }
  if (lat < -90 || lat > 90) {
    throw ApiError.badRequest('Latitude must be between -90 and 90 degrees');
  }
};

/**
 * Validate radius capped at 50 km (50,000 meters)
 */
export const validateRadius = (radius) => {
  const rad = Number(radius);
  if (isNaN(rad) || rad <= 0) {
    throw ApiError.badRequest('Radius must be a positive number');
  }
  if (rad > 50000) {
    throw ApiError.badRequest('Search radius cannot exceed 50 km (50,000 meters)');
  }
  return rad;
};

/**
 * Ensures Nominatim 1 request per second rule is strictly honored
 */
const waitForNominatimRateLimit = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLast));
  }
  lastNominatimRequestTime = Date.now();
};

export class LocationService {
  /**
   * Geocode an address to [longitude, latitude] using Nominatim (OpenStreetMap)
   * Includes 5s timeout, custom User-Agent, rate limiting, and in-memory cache.
   */
  static async geocodeAddress(address) {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw ApiError.badRequest('Address string is required for geocoding');
    }

    const normalizedAddress = address.trim().toLowerCase();
    if (geocodeCache.has(normalizedAddress)) {
      return geocodeCache.get(normalizedAddress);
    }

    await waitForNominatimRateLimit();

    const nominatimBase = process.env.NOMINATIM_API || 'https://nominatim.openstreetmap.org';

    try {
      const response = await axios.get(`${nominatimBase}/search`, {
        params: {
          q: address.trim(),
          format: 'json',
          limit: 1
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'PlaySphere-LocationService/1.0 (contact@playsphere.com)'
        }
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      const firstMatch = response.data[0];
      const lng = parseFloat(firstMatch.lon);
      const lat = parseFloat(firstMatch.lat);

      if (isNaN(lng) || isNaN(lat)) {
        return null;
      }

      const coordinates = [lng, lat];
      geocodeCache.set(normalizedAddress, coordinates);
      return coordinates;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Nominatim geocoding request timed out after 5s');
      } else {
        console.warn(`⚠️ Nominatim geocoding error: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Reverse geocode [latitude, longitude] to an address string using Nominatim
   */
  static async reverseGeocode(lat, lng) {
    validateCoordinates(lng, lat);

    const cacheKey = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
    if (reverseGeocodeCache.has(cacheKey)) {
      return reverseGeocodeCache.get(cacheKey);
    }

    await waitForNominatimRateLimit();

    const nominatimBase = process.env.NOMINATIM_API || 'https://nominatim.openstreetmap.org';

    try {
      const response = await axios.get(`${nominatimBase}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json'
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'PlaySphere-LocationService/1.0 (contact@playsphere.com)'
        }
      });

      if (!response.data || !response.data.display_name) {
        return null;
      }

      const result = {
        displayName: response.data.display_name,
        address: response.data.address || {}
      };

      reverseGeocodeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn(`⚠️ Nominatim reverse geocoding error: ${error.message}`);
      return null;
    }
  }

  /**
   * Search nearby APPROVED venues using MongoDB 2dsphere $nearSphere
   * Sport and APPROVED filters are evaluated inside the Mongo query directly.
   */
  static async searchNearbyVenues(lng, lat, radius = 5000, sport = null) {
    validateCoordinates(lng, lat);
    const validRadius = validateRadius(radius);

    const query = {
      verifyStatus: { $in: ['APPROVED', 'ACTIVE'] },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: validRadius
        }
      }
    };

    if (sport && typeof sport === 'string' && sport.trim()) {
      query.sport = { $regex: new RegExp(`^${sport.trim()}$`, 'i') };
    }

    const venues = await Venue.find(query)
      .populate('owner', 'name username email')
      .limit(50);

    return venues;
  }

  /**
   * Search venues by name, city, street or fullAddress
   */
  static async searchVenuesByName(q) {
    if (!q || typeof q !== 'string' || !q.trim()) {
      return Venue.find({ verifyStatus: { $in: ['APPROVED', 'ACTIVE'] } })
        .populate('owner', 'name username')
        .limit(20);
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const query = {
      verifyStatus: { $in: ['APPROVED', 'ACTIVE'] },
      $or: [
        { name: searchRegex },
        { 'address.fullAddress': searchRegex },
        { 'address.city': searchRegex },
        { 'address.street': searchRegex }
      ]
    };

    return Venue.find(query)
      .populate('owner', 'name username')
      .sort({ avgRating: -1 })
      .limit(50);
  }

  /**
   * Find nearby eligible players for matchmaking
   * Excludes the host, filters by recent location update, matching sport,
   * and NEVER returns other players' exact currentLocation for privacy.
   */
  static async findPlayersNearby(lng, lat, radius = 5000, sport = null, excludeUserId = null) {
    validateCoordinates(lng, lat);
    const validRadius = validateRadius(radius);

    const query = {
      role: ROLES.PLAYER,
      isBanned: false,
      isActive: true,
      currentLocation: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: validRadius
        }
      },
      lastLocationUpdate: { $ne: null }
    };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    if (sport && typeof sport === 'string' && sport.trim()) {
      const sportRegex = new RegExp(`^${sport.trim()}$`, 'i');
      query.$or = [
        { preferredSports: sportRegex },
        { sports: sportRegex }
      ];
    }

    // PRIVACY: Exclude currentLocation and password so other players' exact coordinates are never exposed
    const players = await Player.find(query)
      .select('-password -currentLocation')
      .limit(100);

    return players;
  }

  /**
   * Update player's currentLocation and timestamp
   */
  static async updatePlayerLocation(playerId, lng, lat) {
    validateCoordinates(lng, lat);

    const player = await Player.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player profile not found');
    }

    player.currentLocation = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    player.lastLocationUpdate = new Date();

    await player.save();

    return player;
  }
}
