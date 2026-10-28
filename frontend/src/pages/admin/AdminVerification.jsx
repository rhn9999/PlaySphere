import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminVerification = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal
  const [rejectingVenue, setRejectingVenue] = useState(null);
  const [rejectReason, setRejectReason] = useState('Missing clear high-resolution turf photos or license');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVerificationQueue();
      setVenues(data.venues || data || []);
    } catch (err) {
      console.warn('Fallback verification queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (venueId) => {
    try {
      await adminApi.approveVenue(venueId);
      toast.success('Venue verified and published to public athlete discovery!');
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingVenue) return;
    setProcessing(true);
    try {
      await adminApi.rejectVenue(rejectingVenue._id, rejectReason);
      toast.success('Venue application rejected with feedback sent to owner.');
      setRejectingVenue(null);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Scanning pending facility verifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Venue Verification Queue
          </h1>
          <p className="text-xs text-slate-500">
            Audit newly submitted sport complexes and synthetic turfs before public listing
          </p>
        </div>

        <Badge variant={venues.length > 0 ? 'warning' : 'success'}>
          {venues.length} Pending Approval
        </Badge>
      </div>

      {venues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="There are currently no new venues awaiting platform verification."
        />
      ) : (
        <div className="space-y-4">
          {venues.map((venue) => {
            const owner = venue.owner || {};
            const photos = venue.photos || [];

            return (
              <Card key={venue._id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning">Verification Pending</Badge>
                      <span className="text-xs text-slate-400">ID: {venue._id?.substring(0, 8)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{venue.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {venue.address?.formattedAddress || venue.address?.city || 'Ahmedabad, Gujarat'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectingVenue(venue)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(venue._id)}
                      className="shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Verify
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Facility Manager
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">{owner.fullName || 'Turf Owner'}</p>
                    <p className="text-slate-500">{owner.email || 'owner@example.com'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Operating Hours
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {venue.operatingHours?.open || '06:00'} - {venue.operatingHours?.close || '23:00'}
                    </p>
                    <p className="text-slate-500">
                      Pricing: ₹{venue.pricing?.offPeak || 800} - ₹{venue.pricing?.peak || 1200}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Grounds & Amenities
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {venue.grounds?.length || 1} Ground(s)
                    </p>
                    <p className="text-slate-500 truncate">
                      {(venue.amenities || ['Floodlights', 'Washrooms']).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Photos audit preview */}
                {photos.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Uploaded Facility Inspection Photos
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.map((p, idx) => (
                        <div
                          key={idx}
                          className="relative h-20 w-32 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200"
                        >
                          <img src={p.url || p} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingVenue && (
        <Modal
          isOpen={!!rejectingVenue}
          onClose={() => setRejectingVenue(null)}
          title={`Reject ${rejectingVenue.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select or provide the compliance rationale. The facility manager will be instructed on required fixes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Missing clear high-resolution turf photos or license">
                  Missing clear high-resolution turf photos or license
                </option>
                <option value="Inaccurate GPS coordinates or vague address">
                  Inaccurate GPS coordinates or vague address
                </option>
                <option value="Facility does not meet minimum synthetic turf safety standards">
                  Facility does not meet synthetic turf safety standards
                </option>
                <option value="Duplicate listing detected on platform">
                  Duplicate listing detected on platform
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRejectingVenue(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={processing}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
