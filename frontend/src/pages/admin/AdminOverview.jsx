import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { Button } from '../../components/Button.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { LeafletMap } from '../../components/LeafletMap.jsx';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Activity,
  Layers,
  Settings,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(7.5);
  const [updatingCommission, setUpdatingCommission] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPlatformAnalytics();
      const analytics = res.analytics || res;
      setData(analytics);
      if (analytics.commissionRate) setCommissionRate(analytics.commissionRate);
    } catch (err) {
      console.warn('Fallback admin analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    setUpdatingCommission(true);
    try {
      await adminApi.updateCommissionTiers({ baseRate: commissionRate });
      toast.success(`Platform commission tier updated to ${commissionRate}%`);
    } catch (err) {
      toast.error('Failed to update commission rate');
    } finally {
      setUpdatingCommission(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Aggregating platform metrics...</p>
      </div>
    );
  }

  const d = data || {};
  const mauData = d.userActivityTrend || [
    { month: 'May', dau: 1200, mau: 8400 },
    { month: 'Jun', dau: 1800, mau: 12600 },
    { month: 'Jul', dau: 2400, mau: 17800 },
    { month: 'Aug', dau: 3200, mau: 24100 },
    { month: 'Sep', dau: 4100, mau: 31500 },
    { month: 'Oct', dau: 5400, mau: 42000 }
  ];

  const cityClusters = d.cityClusters || [
    { name: 'Ahmedabad (West Zone)', location: { coordinates: [72.5086, 23.0338] }, groundsCount: 28 },
    { name: 'Ahmedabad (East Hub)', location: { coordinates: [72.6021, 23.0112] }, groundsCount: 16 },
    { name: 'Gandhinagar Sports City', location: { coordinates: [72.6369, 23.2156] }, groundsCount: 12 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Executive Administration
          </span>
          <h1 className="text-2xl font-black tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Realtime GMV, ground utilization, active squads, and financial commission controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Gross Merchandise Value</span>
            <span className="text-2xl font-black text-emerald-400">₹{d.totalGMV || '4,820,000'}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={d.totalBookings || '3,420'}
          change="+18.4% this month"
          trend="up"
          icon={Activity}
        />
        <StatCard
          title="Active Athletes"
          value={d.activeUsers || '14,890'}
          change="+850 this week"
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Partner Venues"
          value={d.verifiedVenues || '142'}
          change="8 pending verification"
          trend="neutral"
          icon={Building}
        />
        <StatCard
          title="Acceptance Rate"
          value={`${d.matchAcceptanceRate || 92.4}%`}
          change="High venue responsiveness"
          trend="up"
          icon={TrendingUp}
        />
      </div>

      {/* Charts & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAU / MAU Line Chart */}
        <Card className="p-5 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                User Growth & Engagement (DAU / MAU)
              </h2>
              <p className="text-xs text-slate-500">Active monthly squad athletes vs daily match participants</p>
            </div>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
              MoM +24%
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mauData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mau"
                  name="Monthly Active (MAU)"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="dau"
                  name="Daily Active (DAU)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Commission & Tier Controls */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Commission Tier Management
              </h2>
              <p className="text-xs text-slate-500">Platform take-rate settings</p>
            </div>
          </div>

          <form onSubmit={handleUpdateCommission} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Standard Ground Take Rate</span>
                <span className="font-bold text-slate-900">{commissionRate}%</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="15.0"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <p className="text-[11px] text-slate-400">
                Applied automatically on approved split-pay match bookings.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold">Projected Monthly Platform Yield</p>
              <p className="text-lg font-black text-emerald-700">
                ₹{Math.round(((d.totalGMV || 4820000) * commissionRate) / 100).toLocaleString()}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={updatingCommission}
              className="w-full justify-center"
            >
              Update Take-Rate Tier
            </Button>
          </form>
        </Card>
      </div>

      {/* City Heatmap on Leaflet Map */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              Metropolitan Turf & Match Distribution Heatmap
            </h2>
            <p className="text-xs text-slate-500">Live geographic concentration of active partner facilities</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            3 Clusters Monitored
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <LeafletMap
            userLocation={[23.0338, 72.5086]}
            radiusKm={15}
            venues={cityClusters}
            height="360px"
          />
        </div>
      </Card>
    </div>
  );
};
