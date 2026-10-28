import React, { useState, useEffect } from 'react';
import { venuesApi } from '../../api/venues.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  BadgePercent,
  Clock,
  IndianRupee,
  Save,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OwnerPricing = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pricing, setPricing] = useState({
    offPeak: 800,
    peak: 1200,
    peakHoursStart: '18:00',
    peakHoursEnd: '23:00',
    weekendMultiplier: 1.2
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const data = await venuesApi.getMyVenue();
      const v = data.venue || data;
      if (v.pricing) {
        setPricing({
          offPeak: v.pricing.offPeak || 800,
          peak: v.pricing.peak || 1200,
          peakHoursStart: v.pricing.peakHoursStart || '18:00',
          peakHoursEnd: v.pricing.peakHoursEnd || '23:00',
          weekendMultiplier: v.pricing.weekendMultiplier || 1.2
        });
      }
    } catch (err) {
      console.warn('Fallback pricing fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await venuesApi.updatePricing(pricing);
      toast.success('Dynamic pricing model saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading pricing configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BadgePercent className="w-5 h-5 text-primary-600" />
          Dynamic Ground Pricing & Peak Hours
        </h1>
        <p className="text-xs text-slate-500">
          Set peak evening rates and promotional daytime prices to optimize facility yield
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Off-Peak Rates */}
          <Card className="p-5 space-y-4 border-emerald-200 bg-emerald-50/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Standard / Off-Peak Rate</h3>
                <p className="text-[11px] text-slate-500">Morning and early afternoon hours</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hourly Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="200"
                  step="50"
                  value={pricing.offPeak}
                  onChange={(e) => setPricing({ ...pricing, offPeak: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recommended for 06:00 to 17:00 slots</p>
            </div>
          </Card>

          {/* Peak Rates */}
          <Card className="p-5 space-y-4 border-amber-200 bg-amber-50/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Prime / Peak Rate</h3>
                <p className="text-[11px] text-slate-500">High-demand evening floodlit slots</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hourly Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="400"
                  step="50"
                  value={pricing.peak}
                  onChange={(e) => setPricing({ ...pricing, peak: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Includes floodlight operational surcharge</p>
            </div>
          </Card>
        </div>

        {/* Peak Hours Range & Weekend Multiplier */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Peak Window Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peak Hours Start
              </label>
              <input
                type="time"
                value={pricing.peakHoursStart}
                onChange={(e) => setPricing({ ...pricing, peakHoursStart: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peak Hours End
              </label>
              <input
                type="time"
                value={pricing.peakHoursEnd}
                onChange={(e) => setPricing({ ...pricing, peakHoursEnd: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Changes will apply to future open slots created on the live ledger.
            </span>
            <Button type="submit" variant="primary" size="md" loading={saving}>
              <Save className="w-4 h-4" />
              Save Pricing Rules
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
