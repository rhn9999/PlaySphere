import React, { useState, useEffect } from 'react';
import { venuesApi } from '../../api/venues.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  CalendarDays,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LiveLedger = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [venueInfo, setVenueInfo] = useState(null);

  // 2-Tap Slot Blocking Modal
  const [activeSlot, setActiveSlot] = useState(null);
  const [processingBlock, setProcessingBlock] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [selectedDate]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await venuesApi.getMyVenueSlots(selectedDate);
      setSlots(data.slots || data || []);
      if (data.venue) setVenueInfo(data.venue);
    } catch (err) {
      console.warn('Fallback ledger fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    // If slot is CONFIRMED or PENDING, show details
    // If AVAILABLE or BLOCKED, trigger 2-tap block/unblock modal
    setActiveSlot(slot);
  };

  const handleConfirmToggleBlock = async () => {
    if (!activeSlot) return;
    setProcessingBlock(true);
    try {
      if (activeSlot.status === 'BLOCKED') {
        await venuesApi.unblockSlot(activeSlot._id);
        toast.success(`Slot ${activeSlot.startTime} unblocked and opened for booking!`);
      } else if (activeSlot.status === 'AVAILABLE') {
        await venuesApi.blockSlot(activeSlot._id, 'Blocked offline for academy session');
        toast.success(`Slot ${activeSlot.startTime} successfully blocked.`);
      }
      setActiveSlot(null);
      fetchLedger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update slot status');
    } finally {
      setProcessingBlock(false);
    }
  };

  const getSlotColorClass = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400';
      case 'PENDING':
        return 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400';
      case 'CONFIRMED':
        return 'bg-rose-50 border-rose-300 text-rose-900 cursor-not-allowed';
      case 'BLOCKED':
        return 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200';
      default:
        return 'bg-white border-slate-200 text-slate-700';
    }
  };

  const getSlotBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Request Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="danger">Booked</Badge>;
      case 'BLOCKED':
        return <Badge variant="neutral">Blocked</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600" />
            Live Ledger & Slot Grid
          </h1>
          <p className="text-xs text-slate-500">
            Realtime slot occupancy. Tap any slot twice to block or reopen instantly.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-500">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
          <span className="text-slate-700">Available (Green)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-500" />
          <span className="text-slate-700">Pending Match (Amber)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-500" />
          <span className="text-slate-700">Confirmed (Red)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-400" />
          <span className="text-slate-700">Offline Blocked (Gray)</span>
        </div>
      </div>

      {/* Slot Grid */}
      <Card className="p-5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Syncing ground calendar...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No operating slots configured for this date.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const colorClass = getSlotColorClass(slot.status);
              return (
                <button
                  key={slot._id}
                  type="button"
                  onClick={() => handleSlotClick(slot)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-28 shadow-xs ${colorClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">
                      {slot.startTime}
                    </span>
                    {slot.status === 'BLOCKED' ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    ) : slot.status === 'AVAILABLE' ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : null}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold truncate">
                      {slot.groundName || 'Ground A'}
                    </p>
                    <p className="text-[10px] opacity-75">
                      ₹{slot.price || 900}
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider block truncate">
                      {slot.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2-TAP OFFLINE BLOCK / UNBLOCK MODAL */}
      {activeSlot && (
        <Modal
          isOpen={!!activeSlot}
          onClose={() => setActiveSlot(null)}
          title={
            activeSlot.status === 'BLOCKED'
              ? 'Unblock Slot'
              : activeSlot.status === 'AVAILABLE'
              ? '2-Tap Offline Block'
              : 'Slot Reservation Info'
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {activeSlot.groundName || 'Ground A'} • {activeSlot.startTime} - {activeSlot.endTime}
              </p>
              <p className="text-slate-500">Date: {selectedDate}</p>
              <p className="text-slate-500">Price: ₹{activeSlot.price || 900}</p>
              <div className="pt-1">{getSlotBadge(activeSlot.status)}</div>
            </div>

            {activeSlot.status === 'AVAILABLE' ? (
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  Need this slot for an offline walk-in, private coaching session, or maintenance?
                  Tap confirm to lock this slot from PlaySphere public discovery.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveSlot(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={processingBlock}
                    onClick={handleConfirmToggleBlock}
                  >
                    Confirm Block
                  </Button>
                </div>
              </div>
            ) : activeSlot.status === 'BLOCKED' ? (
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  This slot is currently blocked. Would you like to reopen it to accepting athlete booking requests?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveSlot(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={processingBlock}
                    onClick={handleConfirmToggleBlock}
                  >
                    Reopen Slot (Unblock)
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-3">
                  This slot has an active booking or match request. Manage requests in the Requests Queue.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveSlot(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
