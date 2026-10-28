import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Table } from '../../components/Table.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Building2,
  Search,
  AlertTriangle,
  Ban,
  Trash2,
  CheckCircle,
  MapPin,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminListings = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action Modals
  const [actionVenue, setActionVenue] = useState(null);
  const [actionType, setActionType] = useState(null); // 'SUSPEND' | 'DELIST'
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listVenues();
      setVenues(data.venues || data || []);
    } catch (err) {
      console.warn('Fallback venues list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionVenue || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === 'SUSPEND') {
        await adminApi.suspendVenue(actionVenue._id, actionReason || 'Policy violation');
        toast.success(`Venue ${actionVenue.name} suspended.`);
      } else if (actionType === 'DELIST') {
        await adminApi.delistVenue(actionVenue._id, actionReason || 'Facility decommissioned');
        toast.success(`Venue ${actionVenue.name} delisted.`);
      }
      setActionVenue(null);
      setActionType(null);
      setActionReason('');
      fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredVenues = venues.filter((v) => {
    const matchesSearch = v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.verifyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Venue',
      cell: (v) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{v.name}</p>
          <p className="text-[11px] text-slate-400">{v.address?.city || 'Ahmedabad'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (v) => (
        <Badge
          variant={
            v.verifyStatus === 'APPROVED'
              ? 'success'
              : v.verifyStatus === 'SUSPENDED'
              ? 'danger'
              : 'warning'
          }
        >
          {v.verifyStatus || 'APPROVED'}
        </Badge>
      )
    },
    {
      header: 'Grounds',
      cell: (v) => <span className="text-xs text-slate-600">{v.grounds?.length || 1} playing turf(s)</span>
    },
    {
      header: 'Price Range',
      cell: (v) => (
        <span className="text-xs font-semibold text-slate-800">
          ₹{v.pricing?.offPeak || 800} - ₹{v.pricing?.peak || 1200}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (v) => (
        <div className="flex items-center gap-1.5">
          {v.verifyStatus !== 'SUSPENDED' ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setActionVenue(v);
                setActionType('SUSPEND');
              }}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Ban className="w-3.5 h-3.5" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={async () => {
                await adminApi.approveVenue(v._id);
                toast.success('Venue reinstated');
                fetchVenues();
              }}
              className="text-emerald-600 border-emerald-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Reinstate
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setActionVenue(v);
              setActionType('DELIST');
            }}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delist
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Facility Listing Moderation
          </h1>
          <p className="text-xs text-slate-500">
            Audit, suspend, or delist venues flagged for policy non-compliance
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
            placeholder="Search venue name or city..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
          <Table columns={columns} data={filteredVenues} />
        )}
      </Card>

      {/* Confirmation Modal */}
      {actionVenue && (
        <Modal
          isOpen={!!actionVenue}
          onClose={() => setActionVenue(null)}
          title={`${actionType === 'SUSPEND' ? 'Suspend' : 'Delist'} ${actionVenue.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              {actionType === 'SUSPEND'
                ? 'Suspending this facility temporarily hides its slots from the player search feed.'
                : 'Delisting permanently removes this venue and all active future reservations.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Reason
              </label>
              <textarea
                rows="3"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State the compliance violation or reason..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActionVenue(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={processing}
                onClick={handleExecuteAction}
              >
                Confirm {actionType === 'SUSPEND' ? 'Suspension' : 'Delisting'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
