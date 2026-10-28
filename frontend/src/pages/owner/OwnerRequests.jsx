import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../../api/bookings.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge, ReliabilityBadge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  Inbox,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OwnerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Slot offline maintenance conflict');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await bookingsApi.getVenueRequests();
      setRequests(data.requests || data || []);
    } catch (err) {
      console.warn('Fallback venue requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await bookingsApi.approveBooking(id);
      toast.success('Booking confirmed! Athletes have been issued their QR Passes.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setProcessing(true);
    try {
      await bookingsApi.rejectBooking(rejectingId, rejectReason);
      toast.success('Request rejected.');
      setRejectingId(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary-600" />
            Incoming Booking Requests
          </h1>
          <p className="text-xs text-slate-500">
            Review and approve assembled open squads requesting ground reservations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
          <Timer className="w-4 h-4 text-primary-600" />
          <span>Avg. Response Time: 4.2 mins</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Scanning incoming booking requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="All caught up!"
          description="There are no pending match requests at this moment. You will receive real-time notifications when squads book."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const host = req.host || req.player || {};
            const slot = req.slot || {};
            const elapsedMins = Math.floor((Date.now() - new Date(req.createdAt || Date.now()).getTime()) / 60000);

            return (
              <Card
                key={req._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === 'PENDING' ? 'warning' : 'neutral'}>
                      {req.status}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Received {elapsedMins} mins ago
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {req.groundName || 'Ground A'} • {req.sport || 'Football'} Squad
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {req.date ? new Date(req.date).toLocaleDateString() : 'Today'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {slot.startTime || req.startTime || '19:00'} - {slot.endTime || req.endTime || '20:00'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {req.headcount || 10} Athletes Confirmed
                      </span>
                      <span className="font-bold text-primary-700">
                        Total ₹{req.totalAmount || slot.price || 1000}
                      </span>
                    </div>
                  </div>

                  {/* Host info */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Match Organizer:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {host.fullName || host.name || 'Rahul Sharma'}
                    </span>
                    <ReliabilityBadge score={host.reliabilityScore || 94} />
                  </div>
                </div>

                {/* Actions */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectingId(req._id)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(req._id)}
                      className="shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Booking
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <Modal
          isOpen={!!rejectingId}
          onClose={() => setRejectingId(null)}
          title="Decline Booking Request"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Provide a reason for declining. The host and squad athletes will be notified immediately.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decline Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Slot offline maintenance conflict">Slot offline maintenance conflict</option>
                <option value="Weather / Turf unplayable">Rain / Turf unplayable</option>
                <option value="Double-booked by offline walk-in">Double-booked by offline walk-in</option>
                <option value="Pricing / Special event conflict">Special tournament conflict</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRejectingId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={processing}
                onClick={handleConfirmReject}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
