import React, { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge, ReliabilityBadge } from '../../components/Badge.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Award,
  Search,
  History,
  ShieldAlert,
  ArrowRight,
  Save,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReliability = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Override Form
  const [newScore, setNewScore] = useState(90);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await adminApi.searchPlayers(searchQuery.trim());
      const players = data.players || data || [];
      if (players.length > 0) {
        selectPlayer(players[0]);
      } else {
        toast.error('No athlete found matching query');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectPlayer = async (p) => {
    setSelectedPlayer(p);
    setNewScore(p.reliabilityScore || 85);
    setLoadingHistory(true);
    try {
      const data = await adminApi.getPlayerHistory(p._id);
      setHistory(data.history || data || []);
    } catch (err) {
      console.warn('Fallback player history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error('Administrative reason is strictly required for reliability overrides');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.overrideReliabilityScore(
        selectedPlayer._id,
        Number(newScore),
        overrideReason.trim()
      );
      toast.success(`Reliability score updated to ${newScore}%`);
      setSelectedPlayer({ ...selectedPlayer, reliabilityScore: Number(newScore) });
      setOverrideReason('');
      // Reload history
      const data = await adminApi.getPlayerHistory(selectedPlayer._id);
      setHistory(data.history || data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-600" />
          Reliability Score Audit & Manual Override
        </h1>
        <p className="text-xs text-slate-500">
          Investigate attendance disputes, unfreeze accounts, and override reliability ratings with audit logging
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athlete by @username or email (e.g. rohan or athlete@example.com)..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <Button type="submit" variant="primary" size="md" loading={searching}>
            Find Player
          </Button>
        </form>
      </Card>

      {/* Player Dossier & Override Form */}
      {selectedPlayer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Override Form */}
          <Card className="p-5 md:col-span-1 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Athlete Profile
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                {selectedPlayer.fullName || 'Player'}
              </h2>
              <p className="text-xs text-slate-500">@{selectedPlayer.username || 'user'}</p>
              <div className="mt-2">
                <ReliabilityBadge score={selectedPlayer.reliabilityScore || 85} />
              </div>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Adjusted Score ({newScore}%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Justification / Audit Reason
                </label>
                <textarea
                  required
                  rows="3"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Verified genuine medical emergency; reversing auto-deduction"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                className="w-full justify-center"
              >
                <Save className="w-4 h-4" />
                Apply Score Override
              </Button>
            </form>
          </Card>

          {/* Attendance History */}
          <Card className="p-5 md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-primary-600" />
              Recent Match Attendance & Score History
            </h2>

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                No penalty history recorded for this player.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{h.matchTitle || h.venueName || 'Match Session'}</p>
                      <p className="text-slate-500">{h.reason || 'Attended on time'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.date || Date.now()).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black text-sm block ${
                          h.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {h.change >= 0 ? `+${h.change}` : h.change}%
                      </span>
                      <span className="text-[10px] text-slate-400">Score Impact</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
