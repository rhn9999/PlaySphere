import React, { useState, useEffect } from 'react';
import { reviewsApi } from '../../api/reviews.api.js';
import { venuesApi } from '../../api/venues.api.js';
import { Card } from '../../components/Card.jsx';
import { StarRating } from '../../components/StarRating.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Star,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

export const OwnerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averages, setAverages] = useState({
    overall: 4.8,
    turf: 4.9,
    lighting: 4.8,
    cleanliness: 4.6,
    hospitality: 4.7
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const v = await venuesApi.getMyVenue();
      const venueId = v.venue?._id || v._id;
      if (venueId) {
        const data = await reviewsApi.getVenueReviews(venueId);
        const list = data.reviews || data || [];
        setReviews(list);

        if (list.length > 0) {
          const turfAvg = list.reduce((a, b) => a + (b.turf || 5), 0) / list.length;
          const lightAvg = list.reduce((a, b) => a + (b.lighting || 5), 0) / list.length;
          const cleanAvg = list.reduce((a, b) => a + (b.cleanliness || 5), 0) / list.length;
          const hospAvg = list.reduce((a, b) => a + (b.hospitality || 5), 0) / list.length;
          const overall = (turfAvg + lightAvg + cleanAvg + hospAvg) / 4;

          setAverages({
            overall: Number(overall.toFixed(1)),
            turf: Number(turfAvg.toFixed(1)),
            lighting: Number(lightAvg.toFixed(1)),
            cleanliness: Number(cleanAvg.toFixed(1)),
            hospitality: Number(hospAvg.toFixed(1))
          });
        }
      }
    } catch (err) {
      console.warn('Fallback venue reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading athlete reviews & reputation scores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Venue Reviews & Experience Scores
        </h1>
        <p className="text-xs text-slate-500">
          Player ratings across turf quality, floodlight visibility, cleanliness, and staff hospitality
        </p>
      </div>

      {/* Category Averages Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4 text-center bg-primary-50/40 border-primary-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Overall Facility
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {averages.overall} / 5.0
          </span>
          <div className="flex justify-center mt-1">
            <StarRating rating={Math.round(averages.overall)} readonly size="sm" />
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Turf / Surface
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {averages.turf}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Grass & bounce feel</p>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Lighting
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {averages.lighting}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Evening floodlight lux</p>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Cleanliness
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {averages.cleanliness}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Dugouts & washrooms</p>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Hospitality
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {averages.hospitality}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Staff & check-in flow</p>
        </Card>
      </div>

      {/* Reviews List */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-primary-600" />
          Athlete Feedback ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {r.player?.fullName?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {r.player?.fullName || 'Verified Athlete'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <StarRating rating={r.rating || 5} readonly size="sm" />
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>Turf: <span className="font-bold text-slate-800">{r.turf || 5}/5</span></div>
                  <div>Lighting: <span className="font-bold text-slate-800">{r.lighting || 5}/5</span></div>
                  <div>Cleanliness: <span className="font-bold text-slate-800">{r.cleanliness || 5}/5</span></div>
                  <div>Staff: <span className="font-bold text-slate-800">{r.hospitality || 5}/5</span></div>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-700 pt-1 leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
