import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Radio,
  Send,
  Bell,
  Sparkles,
  Sliders,
  CheckCircle2,
  Users,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminBroadcasts = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Broadcast Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCity, setTargetCity] = useState('ALL');
  const [targetSport, setTargetSport] = useState('ALL');

  // Automated Trigger Toggles
  const [triggers, setTriggers] = useState({
    headcountNearTarget: true,
    reliabilityPenaltyWarning: true,
    slotOpenWeekendAlert: false,
    rainCancellationNotice: true
  });
  const [savingTriggers, setSavingTriggers] = useState(false);

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAlertTriggers();
      if (data.triggers) setTriggers(data.triggers);
    } catch (err) {
      console.warn('Fallback alert triggers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    setSending(true);
    try {
      await adminApi.sendBroadcastPush({
        title: title.trim(),
        message: message.trim(),
        city: targetCity === 'ALL' ? undefined : targetCity,
        sport: targetSport === 'ALL' ? undefined : targetSport
      });
      toast.success('Broadcast push notification sent to targeted segment!');
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleToggleTrigger = async (key) => {
    const updated = { ...triggers, [key]: !triggers[key] };
    setTriggers(updated);
    try {
      await adminApi.updateAlertTriggers(updated);
      toast.success('Automation rule updated');
    } catch (err) {
      toast.error('Failed to update trigger');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary-600" />
          Broadcast Alerts & Push Triggers
        </h1>
        <p className="text-xs text-slate-500">
          Broadcast instant push notifications to player segments or configure automated matchmaking triggers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Targeted Broadcast Composer */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Send Segmented Broadcast
              </h2>
              <p className="text-[11px] text-slate-500">Dispatches via Web FCM & in-app inbox</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target City
                </label>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ALL">All Cities (Pan-India)</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Gandhinagar">Gandhinagar</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Sport
                </label>
                <select
                  value={targetSport}
                  onChange={(e) => setTargetSport(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ALL">All Athletes</option>
                  <option value="Football">Football Players</option>
                  <option value="Cricket">Cricket Players</option>
                  <option value="Badminton">Badminton Players</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notification Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Turf Tournament Announced in Ahmedabad!"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Message Body
              </label>
              <textarea
                required
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Compose announcement..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={sending}
              className="w-full justify-center"
            >
              <Send className="w-4 h-4" />
              Dispatch Broadcast
            </Button>
          </form>
        </Card>

        {/* Automated Alert Triggers */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Automated Event Triggers
              </h2>
              <p className="text-[11px] text-slate-500">Autonomous push triggers based on match events</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                key: 'headcountNearTarget',
                title: 'Squad Nearing Capacity',
                desc: 'Alert nearby players when an open match has only 2 spots left'
              },
              {
                key: 'reliabilityPenaltyWarning',
                title: '4-Hour Reliability Cutoff Warning',
                desc: 'Remind squad participants 5 hours prior to avoid late departure penalty'
              },
              {
                key: 'slotOpenWeekendAlert',
                title: 'Prime Weekend Slot Released',
                desc: 'Alert frequent hosts when an unbooked Friday/Saturday slot is available'
              },
              {
                key: 'rainCancellationNotice',
                title: 'Weather Disruption Warning',
                desc: 'Prompt match organizers when turf rain conditions are reported'
              }
            ].map((rule) => {
              const enabled = triggers[rule.key];
              return (
                <div
                  key={rule.key}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="pr-2">
                    <p className="font-bold text-slate-900">{rule.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rule.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTrigger(rule.key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enabled ? 'bg-primary-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
