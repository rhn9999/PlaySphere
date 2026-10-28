import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Table } from '../../components/Table.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Activity,
  Search,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminMatchMonitor = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Cancel Modal
  const [cancellingMatch, setCancellingMatch] = useState(null);
  const [cancelReason, setCancelReason] = useState('Emergency administrative intervention / weather safety');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLiveMatches();
      setMatches(data.matches || data || []);
    } catch (err) {
      console.warn('Fallback admin matches:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingMatch) return;
    setProcessing(true);
    try {
      await adminApi.cancelMatchAdmin(cancellingMatch._id, cancelReason);
      toast.success(`Match #${cancellingMatch._id?.substring(0, 8)} cancelled. Squad notified.`);
      setCancellingMatch(null);
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = matches.filter((m) => {
    const matchesSearch =
      m.venueName?.toLowerCase().includes(search.toLowerCase()) ||
      m.sport?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Sport & Match',
      cell: (m) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{m.sport || 'Football'}</span>
          <span className="text-[11px] text-slate-400">#{m._id?.substring(0, 8)}</span>
        </div>
      )
    },
    {
      header: 'Venue',
      cell: (m) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{m.venueName || 'Arena Turf'}</p>
          <p className="text-[10px] text-slate-400">{m.venue?.address?.city || 'Ahmedabad'}</p>
        </div>
      )
    },
    {
      header: 'Timing',
      cell: (m) => (
        <span className="text-xs text-slate-600">
          {m.startTime || '19:00'} - {m.endTime || '20:00'}
        </span>
      )
    },
    {
      header: 'Headcount',
      cell: (m) => (
        <span className="text-xs font-bold text-slate-700">
          {(m.participants?.length || 0) + 1} / {m.headcountNeeded || 10}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (m) => (
        <Badge
          variant={
            m.status === 'CONFIRMED'
              ? 'success'
              : m.status === 'CANCELLED'
              ? 'danger'
              : 'primary'
          }
        >
          {m.status || 'OPEN'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      cell: (m) =>
        m.status !== 'CANCELLED' ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCancellingMatch(m)}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Force Cancel
          </Button>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Terminated</span>
        )
    }
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Live Squad Match Monitor
          </h1>
          <p className="text-xs text-slate-500">
            Realtime supervisory monitor across open matches, squad headcounts, and emergency cancellations
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue or sport..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'OPEN', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table columns={columns} data={filtered} />
        )}
      </Card>

      {/* Cancel Modal */}
      {cancellingMatch && (
        <Modal
          isOpen={!!cancellingMatch}
          onClose={() => setCancellingMatch(null)}
          title={`Administrative Cancel: Match #${cancellingMatch._id?.substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Emergency Interruption
              </p>
              <p>
                Cancelling this match will invalidate participant QR Passes, notify all squad members,
                and reopen the venue slot on the ledger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancellingMatch(null)}>
                Keep Match
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={processing}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
