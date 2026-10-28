import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venuesApi } from '../../api/venues.api.js';
import { reviewsApi } from '../../api/reviews.api.js';
import { matchesApi } from '../../api/matches.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { StarRating } from '../../components/StarRating.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { Badge } from '../../components/Badge.jsx';
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Star,
  Users,
  ChevronLeft,
  Calendar,
  Sparkles,
  Wifi,
  Car,
  ShowerHead,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Reviews & Modal
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    turf: 5,
    lighting: 5,
    cleanliness: 5,
    hospitality: 5,
    comment: ''
  });

  // Host Match Modal
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostForm, setHostForm] = useState({
    sport: 'Football',
    headcount: 10,
    minReliability: 70
  });
  const [hostingMatch, setHostingMatch] = useState(false);

  useEffect(() => {
    fetchVenueDetails();
    fetchReviews();
  }, [id, selectedDate]);

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const data = await venuesApi.getVenueById(id, selectedDate);
      setVenue(data.venue || data);
    } catch (err) {
      toast.error('Failed to load venue details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewsApi.getVenueReviews(id);
      setReviews(data.reviews || data || []);
    } catch (err) {
      console.warn('Reviews fetch fallback:', err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsApi.submitVenueReview(id, reviewForm);
      toast.success('Thank you for rating this facility!');
      setShowReviewModal(false);
      setReviewForm({ turf: 5, lighting: 5, cleanliness: 5, hospitality: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateOpenMatch = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select an available slot first');
      return;
    }
    setHostingMatch(true);
    try {
      const match = await matchesApi.createMatch({
        venueId: id,
        venueName: venue.name,
        groundId: selectedSlot.groundId || venue.grounds?.[0]?._id,
        slotId: selectedSlot._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        sport: hostForm.sport,
        headcountNeeded: Number(hostForm.headcount),
        minReliability: Number(hostForm.minReliability)
      });
      toast.success('Open match published! Nearby players can now request to join.');
      setShowHostModal(false);
      navigate(`/app/matches/${match._id || match.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create open match');
    } finally {
      setHostingMatch(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading venue profile & live slots...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold mb-3">Venue not found</p>
        <Button variant="primary" onClick={() => navigate('/app')}>
          Back to Venues
        </Button>
      </div>
    );
  }

  // Format photos with primary first
  const photos = venue.photos?.length
    ? [...venue.photos].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    : [{ url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80', isPrimary: true }];

  const currentPhoto = photos[selectedPhotoIndex]?.url || photos[0]?.url;

  // Available slots for selected date
  const availableSlots = venue.availableSlots || [];

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/app')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Venues</span>
      </button>

      {/* Photo Gallery with Primary Cover */}
      <div className="space-y-2">
        <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
          <img
            src={currentPhoto}
            alt={venue.name}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Verification Badge */}
          <div className="absolute top-4 left-4 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
            <ShieldCheck className="w-4 h-4" />
            Verified Facility
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
              {venue.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span>{venue.address?.formattedAddress || venue.address?.city || 'Ahmedabad, Gujarat'}</span>
            </p>
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative h-16 w-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === idx
                    ? 'border-primary-500 scale-102 shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p.url || p} alt="" className="w-full h-full object-cover" />
                {p.isPrimary && (
                  <span className="absolute bottom-0 inset-x-0 bg-primary-600 text-[9px] text-white font-bold text-center py-0.5">
                    Cover
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grounds & Details */}
        <Card className="p-5 md:col-span-2 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Facility Overview
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {venue.description || 'Modern synthetic sports turf equipped with floodlights, comfortable player dugout seating, high quality goal posts and live match tracking.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Sports & Playing Grounds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(venue.grounds || [{ name: 'Main Ground A', sportType: 'Football', surface: 'FIFA Certified Artificial Grass' }]).map((g, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{g.name}</p>
                    <p className="text-[11px] text-slate-500">{g.surface || 'Pro Turf'}</p>
                  </div>
                  <Badge variant="primary">{g.sportType}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {(venue.amenities || ['Floodlights', 'Changing Rooms', 'Drinking Water', 'Parking', 'First Aid']).map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Operating Hours & Pricing */}
        <Card className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Timings & Rates
            </h2>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Hours
                </span>
                <span className="font-semibold text-slate-800">
                  {venue.operatingHours?.open || '06:00'} - {venue.operatingHours?.close || '23:00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Off-Peak Rate</span>
                <span className="font-bold text-primary-700">₹{venue.pricing?.offPeak || 800}/hr</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Peak Rate</span>
                <span className="font-bold text-amber-700">₹{venue.pricing?.peak || 1200}/hr</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-900">
              <p className="font-bold flex items-center gap-1 text-primary-800">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                PlaySphere Split-Pay
              </p>
              <p className="mt-0.5 text-primary-700">
                Create an open match to split venue costs automatically among squad members!
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => setShowReviewModal(true)}
          >
            <Star className="w-4 h-4 text-amber-500" />
            Write Venue Review
          </Button>
        </Card>
      </div>

      {/* Available Slots & Match Hosting */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live Available Slots
            </h2>
            <p className="text-xs text-slate-500">
              Pick a slot to host an Open Match or reserve for your private team
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {availableSlots.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            No open slots found for this date. Try selecting another day or check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot?._id === slot._id;
              return (
                <button
                  key={slot._id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-primary-400 text-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  <p className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-primary-100' : 'text-slate-500'}`}>
                    ₹{slot.price || 900}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        {selectedSlot && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/50 p-3 rounded-xl">
            <div>
              <p className="text-xs text-slate-600">Selected Slot:</p>
              <p className="text-sm font-bold text-slate-900">
                {selectedDate} ({selectedSlot.startTime} - {selectedSlot.endTime}) • ₹{selectedSlot.price || 900}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-none justify-center"
                onClick={() => setShowHostModal(true)}
              >
                <Users className="w-4 h-4" />
                Host Open Match
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reviews Section */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Venue Reviews & Turf Quality
            </h2>
            <p className="text-xs text-slate-500">
              Community ratings across lighting, cleanliness, turf and staff
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewModal(true)}
          >
            Leave Review
          </Button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No reviews submitted yet for this facility. Be the first to review!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                      {r.player?.fullName?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.player?.fullName || 'Verified Athlete'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating || 5} readonly size="sm" />
                </div>

                {/* Subcategory Scores */}
                <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>Turf: <span className="font-bold text-slate-700">{r.turf || 5}/5</span></div>
                  <div>Lighting: <span className="font-bold text-slate-700">{r.lighting || 5}/5</span></div>
                  <div>Cleanliness: <span className="font-bold text-slate-700">{r.cleanliness || 5}/5</span></div>
                  <div>Hospitality: <span className="font-bold text-slate-700">{r.hospitality || 5}/5</span></div>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-600 pt-1">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Rate This Venue"
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turf Quality (1 - 5 stars)
              </label>
              <StarRating
                rating={reviewForm.turf}
                onChange={(v) => setReviewForm({ ...reviewForm, turf: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lighting & Visibility (1 - 5 stars)
              </label>
              <StarRating
                rating={reviewForm.lighting}
                onChange={(v) => setReviewForm({ ...reviewForm, lighting: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cleanliness & Dugouts (1 - 5 stars)
              </label>
              <StarRating
                rating={reviewForm.cleanliness}
                onChange={(v) => setReviewForm({ ...reviewForm, cleanliness: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Hospitality (1 - 5 stars)
              </label>
              <StarRating
                rating={reviewForm.hospitality}
                onChange={(v) => setReviewForm({ ...reviewForm, hospitality: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Comments (Optional)
              </label>
              <textarea
                rows="3"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share advice on grass condition, parking convenience, or ball bounce..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submittingReview}>
                Submit Review
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Host Match Modal */}
      {showHostModal && (
        <Modal
          isOpen={showHostModal}
          onClose={() => setShowHostModal(false)}
          title="Create Open Match"
        >
          <form onSubmit={handleCreateOpenMatch} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
              <p className="font-bold text-slate-900">{venue.name}</p>
              <p>{selectedDate} • {selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sport
              </label>
              <select
                value={hostForm.sport}
                onChange={(e) => setHostForm({ ...hostForm, sport: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Badminton">Badminton</option>
                <option value="Tennis">Tennis</option>
                <option value="Basketball">Basketball</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Players Needed (Headcount Target)
              </label>
              <input
                type="number"
                min="2"
                max="30"
                value={hostForm.headcount}
                onChange={(e) => setHostForm({ ...hostForm, headcount: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <p className="mt-1 text-[11px] text-slate-400">Total spots including you as host</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Reliability Score Required ({hostForm.minReliability}%)
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={hostForm.minReliability}
                onChange={(e) => setHostForm({ ...hostForm, minReliability: e.target.value })}
                className="w-full accent-primary-600"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Filters out unreliable participants with frequent cancellations or no-shows.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHostModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={hostingMatch}>
                Publish Open Match
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
