import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Table } from '../../components/Table.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  AlertTriangle,
  ShieldAlert,
  UserX,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ban Modal
  const [actionReport, setActionReport] = useState(null);
  const [actionType, setActionType] = useState('WARN'); // 'WARN' | 'TEMP_BAN' | 'PERM_BAN'
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReports();
      setReports(data.reports || data || []);
    } catch (err) {
      console.warn('Fallback reports list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (reportId) => {
    try {
      await adminApi.resolveReport(reportId, 'DISMISSED', 'Reviewed - no malicious violation detected');
      toast.success('Report dismissed');
      fetchReports();
    } catch (err) {
      toast.error('Failed to dismiss report');
    }
  };

  const handleApplyDisciplinary = async () => {
    if (!actionReport) return;
    setProcessing(true);
    try {
      const targetUser = actionReport.reportedUser || actionReport.targetUser || {};
      const targetId = targetUser._id || targetUser;

      if (actionType === 'WARN') {
        await adminApi.resolveReport(actionReport._id, 'WARNED', actionNotes || 'Formal warning issued');
        toast.success(`Formal warning sent to ${targetUser.fullName || 'User'}`);
      } else {
        const durationDays = actionType === 'TEMP_BAN' ? 7 : null;
        await adminApi.banUser(targetId, actionNotes || 'Disciplinary violation', durationDays);
        await adminApi.resolveReport(actionReport._id, 'BANNED', actionNotes);
        toast.success(`Disciplinary ban enforced on ${targetUser.fullName || 'User'}`);
      }

      setActionReport(null);
      setActionNotes('');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enforce disciplinary action');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Misconduct Reports & Sportsmanship Disputes
          </h1>
          <p className="text-xs text-slate-500">
            Investigate player harassment, no-shows, and issue warnings or disciplinary bans
          </p>
        </div>

        <Badge variant={reports.filter((r) => r.status === 'PENDING').length > 0 ? 'danger' : 'success'}>
          {reports.filter((r) => r.status === 'PENDING').length} Unresolved Incidents
        </Badge>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Zero reports pending"
          description="Fair play is thriving! No new sportsmanship or misconduct disputes filed."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => {
            const reporter = rep.reporter || {};
            const reported = rep.reportedUser || rep.targetUser || {};

            return (
              <Card key={rep._id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={rep.status === 'PENDING' ? 'danger' : 'neutral'}>
                        {rep.status}
                      </Badge>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(rep.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 pt-1">
                      Reported by <span className="text-slate-900 font-bold">{reporter.fullName || 'Athlete'}</span> against{' '}
                      <span className="text-rose-600 font-bold">{reported.fullName || 'Accused Athlete'}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      "{rep.details || 'Player failed to attend after confirmed squad booking and did not respond in match chat.'}"
                    </p>
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleDismiss(rep._id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => {
                          setActionReport(rep);
                          setActionType('WARN');
                        }}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Take Action
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disciplinary Action Modal */}
      {actionReport && (
        <Modal
          isOpen={!!actionReport}
          onClose={() => setActionReport(null)}
          title="Disciplinary Resolution"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Target Athlete:</span>
              <p className="font-bold text-slate-900">
                {actionReport.reportedUser?.fullName || actionReport.targetUser?.fullName || 'User'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disciplinary Measure
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="WARN">Issue Official In-App Warning</option>
                <option value="TEMP_BAN">7-Day Temporary Matchmaking Ban</option>
                <option value="PERM_BAN">Permanent Account Suspension</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notice to User / Investigation Notes
              </label>
              <textarea
                rows="3"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Details of warning or violation penalty..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActionReport(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={processing}
                onClick={handleApplyDisciplinary}
              >
                Confirm Enforcement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
