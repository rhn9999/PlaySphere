import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Ticket,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingsApi.getMyBookings();
      setBookings(data.bookings || data || []);
    } catch (err) {
      console.warn('Fallback bookings fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success">Confirmed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Awaiting Venue</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary-600" />
          My Bookings & Passes
        </h1>
        <p className="text-xs text-slate-500">
          Access your digital QR entry passes and active venue reservations
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading match reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings yet"
          description="Find a nearby turf or create an open match squad to make your first booking."
          actionText="Explore Venues"
          onAction={() => navigate('/app')}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const venue = b.venue || {};
            const slot = b.slot || {};
            const isConfirmed = b.status === 'CONFIRMED';
            const qrPass = b.qrPass || `PASS_${b._id}`;

            return (
              <Card key={b._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(b.status)}
                    <span className="text-xs text-slate-400 font-mono">
                      #{b._id?.substring(0, 8)}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">
                    {b.venueName || venue.name || 'Sports Arena'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.date ? new Date(b.date).toLocaleDateString() : 'Upcoming'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {slot.startTime || b.startTime || '19:00'} - {slot.endTime || b.endTime || '20:00'}
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{b.totalAmount || slot.price || 900}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConfirmed && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedPass({ ...b, qrPass })}
                      className="shadow-xs"
                    >
                      <QrCode className="w-4 h-4" />
                      Show QR Pass
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR PASS MODAL */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Digital Turf Gate Pass"
        >
          <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-xl">
              <QRCodeSVG value={selectedPass.qrPass} size={200} level="H" includeMargin />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {selectedPass.venueName || 'Sports Facility'}
              </p>
              <p className="text-xs text-slate-600">
                Reservation Pass #{selectedPass._id?.substring(0, 8)}
              </p>
              <p className="text-[11px] text-slate-400">
                Show this QR Code at the venue reception / gate reader for entry verification
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPass(null)}
              className="w-full justify-center"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
