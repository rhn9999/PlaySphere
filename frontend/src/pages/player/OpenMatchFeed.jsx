import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesApi } from '../../api/matches.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge, ReliabilityBadge } from '../../components/Badge.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Plus,
  Flame,
  Filter,
  Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OpenMatchFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState('ALL');

  const sports = ['ALL', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball'];

  useEffect(() => {
    fetchMatches();
  }, [selectedSport]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchesApi.listMatches({
        sport: selectedSport === 'ALL' ? undefined : selectedSport
      });
      setMatches(data.matches || data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch open match feed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            Open Matches
          </h1>
          <p className="text-xs text-slate-500">
            Join public squads nearby or host a match at your favorite turf
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/app')}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Host Match at Venue
        </Button>
      </div>

      {/* Sport Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {sports.map((sp) => {
          const active = selectedSport === sp;
          return (
            <button
              key={sp}
              type="button"
              onClick={() => setSelectedSport(sp)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sp}
            </button>
          );
        })}
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Scanning live matches in your area...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center">
          <p className="text-sm text-rose-600 font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMatches}>
            Retry
          </Button>
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No open matches right now"
          description="Be the initiator! Find a venue slot and host an open squad match for nearby athletes to join."
          actionText="Find Venue & Host"
          onAction={() => navigate('/app')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => {
            const currentCount = (match.participants?.length || 0) + 1; // +1 for host
            const targetCount = match.headcountNeeded || 10;
            const progressPct = Math.min(100, Math.round((currentCount / targetCount) * 100));
            const isFull = currentCount >= targetCount;

            const host = match.host || {};
            const venue = match.venue || {};

            return (
              <Card
                key={match._id}
                interactive
                onClick={() => navigate(`/app/matches/${match._id}`)}
                className="p-4 flex flex-col justify-between hover:border-primary-400 transition-all group"
              >
                <div className="space-y-3">
                  {/* Card Header: Sport & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200/60">
                      {match.sport || 'Football'}
                    </span>
                    <Badge variant={isFull ? 'danger' : 'success'}>
                      {isFull ? 'Squad Full' : `${targetCount - currentCount} spots left`}
                    </Badge>
                  </div>

                  {/* Venue & Time */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {match.venueName || venue.name || 'Arena Turf'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{venue.address?.city || 'Ahmedabad, Gujarat'}</span>
                    </p>
                  </div>

                  {/* Date & Time pill */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {match.date ? new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {match.startTime || '19:00'} - {match.endTime || '20:00'}
                    </span>
                  </div>

                  {/* Headcount progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Squad Assembly
                      </span>
                      <span className="font-bold text-slate-900">
                        {currentCount} / {targetCount}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-amber-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Host Info & Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      {host.fullName?.[0] || host.name?.[0] || 'H'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {host.fullName || host.name || 'Host'}
                      </p>
                      <p className="text-[10px] text-slate-400">Host</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ReliabilityBadge score={host.reliabilityScore || 92} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
