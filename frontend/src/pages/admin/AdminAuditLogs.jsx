import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Table } from '../../components/Table.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setLogs(data.logs || data || []);
    } catch (err) {
      console.warn('Fallback audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.adminEmail?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action?.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      header: 'Timestamp',
      cell: (l) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(l.timestamp || l.createdAt || Date.now()).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Admin',
      cell: (l) => (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-semibold text-slate-800">
            {l.adminEmail || 'superadmin@playsphere.com'}
          </span>
        </div>
      )
    },
    {
      header: 'Action Event',
      cell: (l) => (
        <Badge
          variant={
            l.action?.includes('BAN') || l.action?.includes('SUSPEND')
              ? 'danger'
              : l.action?.includes('OVERRIDE')
              ? 'warning'
              : 'primary'
          }
        >
          {l.action}
        </Badge>
      )
    },
    {
      header: 'Target Resource',
      cell: (l) => (
        <span className="text-xs font-medium text-slate-700">
          {l.targetType}: {l.targetId?.substring(0, 8) || 'N/A'}
        </span>
      )
    },
    {
      header: 'Details & Justification',
      cell: (l) => (
        <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">
          {l.details || 'Administrative operation'}
        </p>
      )
    }
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary-600" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable log of all administrative actions, reliability overrides, bans, and venue updates
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search admin, action or details..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'OVERRIDE', 'APPROVE', 'SUSPEND', 'BROADCAST'].map((act) => (
            <button
              key={act}
              onClick={() => {
                setActionFilter(act);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                actionFilter === act
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div>
            <Table columns={columns} data={paginatedLogs} />

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page {page} of {totalPages} ({filteredLogs.length} entries)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
