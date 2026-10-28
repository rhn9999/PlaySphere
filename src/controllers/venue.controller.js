import { VenueService } from '../services/venue.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createVenue = asyncHandler(async (req, res) => {
  const venue = await VenueService.createVenue(req.body, req.user._id, req.user.role);
  return ApiResponse.created(res, venue, 'Venue registered successfully (pending verification)');
});

export const listVenues = asyncHandler(async (req, res) => {
  const venues = await VenueService.listVenues(req.query);
  return ApiResponse.success(res, venues, 'Venues retrieved successfully');
});

export const getNearbyVenues = asyncHandler(async (req, res) => {
  // Supports both GET query parameters and POST body parameters
  const params = req.method === 'POST' ? req.body : req.query;
  const lng = parseFloat(params.lng);
  const lat = parseFloat(params.lat);
  const radius = params.radius || params.distance || 5000;
  const sport = params.sport || null;

  const venues = await VenueService.findNearbyVenues({
    lng,
    lat,
    distance: parseFloat(radius),
    sport
  });

  return ApiResponse.success(res, venues, 'Nearby venues retrieved successfully');
});

export const searchVenues = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const venues = await VenueService.searchVenuesByName(q);
  return ApiResponse.success(res, venues, 'Venues matching query retrieved successfully');
});

export const getVenueById = asyncHandler(async (req, res) => {
  const result = await VenueService.getVenueById(req.params.id);
  return ApiResponse.success(res, result, 'Venue details with available slots retrieved successfully');
});

export const addGround = asyncHandler(async (req, res) => {
  const ground = await VenueService.addGround(
    req.params.id,
    req.body,
    req.user._id,
    req.user.role
  );
  return ApiResponse.created(res, ground, 'Ground added to venue successfully');
});

export const getVenueGrounds = asyncHandler(async (req, res) => {
  const grounds = await VenueService.getVenueGrounds(req.params.id);
  return ApiResponse.success(res, grounds, 'Venue grounds retrieved successfully');
});

export const getVenueReviews = asyncHandler(async (req, res) => {
  const reviews = await VenueService.getVenueReviews(req.params.id);
  return ApiResponse.success(res, reviews, 'Venue reviews retrieved successfully');
});

export const createVenueReview = asyncHandler(async (req, res) => {
  const review = await VenueService.createVenueReview(
    req.params.id,
    req.body,
    req.user._id
  );
  return ApiResponse.created(res, review, 'Venue review posted successfully');
});
