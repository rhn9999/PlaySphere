import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { StarRating } from '../../components/StarRating.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  MessageSquare,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'VENUE' | 'PLAYER'

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getModerationReviews();
      setReviews(data.reviews || data || []);
    } catch (err) {
      console.warn('Fallback moderation reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (reviewId) => {
    try {
      await adminApi.hideReview(reviewId);
      toast.success('Review visibility toggled to hidden');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to hide review');
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await adminApi.deleteReview(reviewId);
      toast.success('Review permanently removed');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const filtered = reviews.filter((r) => {
    if (typeFilter === 'ALL') return true;
    return r.targetType === typeFilter;
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Review & Endorsement Moderation
          </h1>
          <p className="text-xs text-slate-500">
            Moderate player reviews, skill endorsements, and turf feedback for defamatory content
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['ALL', 'VENUE', 'PLAYER'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No reviews found matching current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rev) => (
            <Card key={rev._id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={rev.targetType === 'VENUE' ? 'primary' : 'warning'}>
                    {rev.targetType === 'VENUE' ? 'Venue Review' : 'Player Review'}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    By {rev.authorName || 'Athlete'} on {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleHide(rev._id)}
                    className="text-amber-600 border-amber-200"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleDelete(rev._id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={rev.rating || 4} readonly size="sm" />
                <span className="text-xs font-bold text-slate-800">
                  Target: {rev.targetName || 'Facility/Player'}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                "{rev.comment || 'Review comment content.'}"
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
