import { Venue, Ground, Slot, VenueReview } from '../models/index.js';
import { ROLES, VENUE_STATUS, SLOT_STATUS } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';
import { LocationService, validateCoordinates } from './locationService.js';

export class VenueService {
  /**
   * Create a new venue (VenueOwner or Admin)
   * Geocodes the address if coordinates are missing, saves as PENDING.
   */
  static async createVenue(venueData, ownerId, userRole) {
    if (userRole !== ROLES.VENUE_OWNER && userRole !== ROLES.ADMIN) {
      throw ApiError.forbidden('Only Venue Owners or Admins can register a venue');
    }

    const {
      name,
      address,
      location,
      photos = [],
      operatingHours = { open: '06:00', close: '23:00' },
      sport = []
    } = venueData;

    let coordinates = location?.coordinates;

    // If coordinates are not provided, geocode the address
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      const fullAddress =
        typeof address === 'string'
          ? address
          : address.fullAddress || `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim();

      const geocoded = await LocationService.geocodeAddress(fullAddress);
      if (!geocoded) {
        throw ApiError.unprocessableEntity(
          'Address could not be geocoded to geographical coordinates'
        );
      }
      coordinates = geocoded;
    } else {
      validateCoordinates(coordinates[0], coordinates[1]);
    }

    const formattedAddress =
      typeof address === 'string'
        ? { city: 'Unknown', fullAddress: address }
        : {
            street: address.street || '',
            city: address.city || 'Unknown',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: address.country || 'India',
            fullAddress: address.fullAddress || `${address.street || ''}, ${address.city || ''}`.trim()
          };

    // New venues registered by venue owners start as PENDING
    const venue = await Venue.create({
      name,
      address: formattedAddress,
      location: {
        type: 'Point',
        coordinates
      },
      photos,
      operatingHours,
      sport: Array.isArray(sport) ? sport : [sport].filter(Boolean),
      owner: ownerId,
      status: VENUE_STATUS.PENDING_APPROVAL,
      verifyStatus: 'PENDING'
    });

    return venue;
  }

  /**
   * List venues with optional text and status filters
   */
  static async listVenues(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = VENUE_STATUS.ACTIVE;
    }

    if (filters.city) {
      query['address.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.search) {
      query.name = new RegExp(filters.search, 'i');
    }

    const venues = await Venue.find(query)
      .populate('owner', 'name username email')
      .sort({ createdAt: -1 });

    return venues;
  }

  /**
   * Find nearby APPROVED venues using MongoDB 2dsphere $nearSphere
   * Sport and APPROVED filters are applied inside the Mongo query directly.
   */
  static async findNearbyVenues({ lng, lat, distance = 5000, sport = null }) {
    return LocationService.searchNearbyVenues(lng, lat, distance, sport);
  }

  /**
   * Search venues by name / address
   */
  static async searchVenuesByName(q) {
    return LocationService.searchVenuesByName(q);
  }

  /**
   * Get venue details by ID including associated grounds AND available slots
   */
  static async getVenueById(venueId) {
    const venue = await Venue.findById(venueId).populate('owner', 'name username email');
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    const grounds = await Ground.find({ venue: venue._id, isActive: true });
    const groundIds = grounds.map((g) => g._id);

    // Fetch upcoming available slots for this venue's grounds
    const availableSlots = await Slot.find({
      ground: { $in: groundIds },
      status: SLOT_STATUS.AVAILABLE,
      start: { $gte: new Date() }
    })
      .sort({ start: 1 })
      .populate('ground', 'name sportType');

    return {
      venue,
      grounds,
      availableSlots
    };
  }

  /**
   * Add a ground/facility to a venue
   */
  static async addGround(venueId, groundData, userId, userRole) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    // Check ownership unless admin
    if (userRole !== ROLES.ADMIN && venue.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not own this venue');
    }

    const ground = await Ground.create({
      venue: venue._id,
      name: groundData.name,
      sportType: groundData.sportType,
      surface: groundData.surface,
      coverPhoto: groundData.coverPhoto || ''
    });

    // Also ensure the venue's sport list includes this ground's sportType
    if (groundData.sportType && !venue.sport.includes(groundData.sportType)) {
      venue.sport.push(groundData.sportType);
      await venue.save();
    }

    return ground;
  }

  /**
   * List grounds for a specific venue
   */
  static async getVenueGrounds(venueId) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    return Ground.find({ venue: venueId, isActive: true });
  }

  /**
   * List reviews for a specific venue
   */
  static async getVenueReviews(venueId) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    const reviews = await VenueReview.find({ venue: venueId })
      .populate('reviewer', 'name username avatarUrl')
      .sort({ createdAt: -1 });

    return { reviews };
  }

  /**
   * Create review for a venue
   */
  static async createVenueReview(venueId, reviewData, userId) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    const rating = Number(reviewData.rating);
    if (!rating || rating < 1 || rating > 5) {
      throw ApiError.badRequest('Rating must be between 1 and 5');
    }

    const review = await VenueReview.create({
      venue: venueId,
      reviewer: userId,
      rating,
      comment: (reviewData.comment || '').trim()
    });

    // Update venue's total reviews and average rating
    const allReviews = await VenueReview.find({ venue: venueId });
    const totalReviews = allReviews.length;
    const avgRating =
      totalReviews > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    venue.totalReviews = totalReviews;
    venue.avgRating = parseFloat(avgRating);
    await venue.save();

    await review.populate('reviewer', 'name username avatarUrl');
    return review;
  }
}
