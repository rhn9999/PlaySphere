import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesApi } from '../../api/matches.api.js';
import { joinRequestsApi } from '../../api/joinRequests.api.js';
import { bookingsApi } from '../../api/bookings.api.js';
import { reportsApi } from '../../api/reports.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { socketService } from '../../services/socket.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Badge, ReliabilityBadge } from '../../components/Badge.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Radio,
  Send,
  QrCode,
  AlertTriangle,
  Flag,
  LogOut,
  CheckCircle,
  XCircle,
  ChevronLeft,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Match State
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [myRequestStatus, setMyRequestStatus] = useState(null); // 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

  // Host Controls
  const [joinRequests, setJoinRequests] = useState([]);
  const [pingCooldown, setPingCooldown] = useState(0);
  const [pinging, setPinging] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ targetUserId: '', reason: 'NO_SHOW', details: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const isHost = match?.host?._id === user?._id || match?.host === user?._id;
  const isParticipant =
    isHost || match?.participants?.some((p) => (p._id || p) === user?._id);

  // 1. Fetch match & chat
  useEffect(() => {
    fetchMatch();
  }, [id]);

  // Cooldown timer tick
  useEffect(() => {
    let timer;
    if (pingCooldown > 0) {
      timer = setInterval(() => {
        setPingCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pingCooldown]);

  // Socket room join & chat fetch
  useEffect(() => {
    if (!match || !isParticipant) return;

    fetchChatMessages();

    // Connect socket and listen to match room
    const socket = socketService.connect();
    socketService.joinMatch(id);

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToChatBottom();
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socketService.leaveMatch(id);
    };
  }, [match?._id, isParticipant]);

  const fetchMatch = async () => {
    setLoading(true);
    try {
      const data = await matchesApi.getMatchById(id);
      const m = data.match || data;
      setMatch(m);

      // Check current user status
      if (m.host?._id === user?._id || m.host === user?._id) {
        // Fetch host requests
        fetchJoinRequests();
      } else {
        // Check if user already requested
        const myReq = m.joinRequests?.find((r) => (r.player?._id || r.player) === user?._id);
        if (myReq) setMyRequestStatus(myReq.status);
      }
    } catch (err) {
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const data = await joinRequestsApi.getRequestsForMatch(id);
      setJoinRequests(data.requests || data || []);
    } catch (err) {
      console.warn('Fallback join requests:', err.message);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const data = await matchesApi.getMatchChat(id);
      setMessages(data.messages || data || []);
      scrollToChatBottom();
    } catch (err) {
      console.warn('Fallback match chat:', err.message);
    }
  };

  const scrollToChatBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Actions
  const handleRequestToJoin = async () => {
    setJoining(true);
    try {
      await joinRequestsApi.requestToJoin(id);
      setMyRequestStatus('PENDING');
      toast.success('Join request sent to the match host!');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send join request');
    } finally {
      setJoining(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await joinRequestsApi.acceptRequest(requestId);
      toast.success('Player accepted into match squad!');
      fetchMatch();
      fetchJoinRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await joinRequestsApi.declineRequest(requestId);
      toast('Request declined');
      fetchJoinRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handlePingNearby = async () => {
    if (pingCooldown > 0) return;
    setPinging(true);
    try {
      const res = await matchesApi.pingNearby(id);
      toast.success(res.message || 'Ping broadcasted to nearby verified players!');
      setPingCooldown(300); // 5 minutes (300 seconds)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ping failed or on cooldown');
    } finally {
      setPinging(false);
    }
  };

  const handleSubmitBooking = async () => {
    setBookingLoading(true);
    try {
      const res = await bookingsApi.submitBooking(id);
      toast.success('Booking submitted to venue ledger!');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput.trim();
    setChatInput('');

    // Optimistic UI append
    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: user._id,
        fullName: user.fullName || 'You'
      },
      message: content,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToChatBottom();

    try {
      socketService.sendMessage(id, content);
      await matchesApi.sendChatMessage(id, content);
    } catch (err) {
      console.warn('Realtime message send fallback:', err.message);
    }
  };

  const handleLeaveOrCancel = async () => {
    try {
      if (isHost) {
        await matchesApi.cancelMatch(id, 'Host cancelled match');
        toast.success('Match cancelled. Players notified.');
      } else {
        await matchesApi.leaveMatch(id);
        toast.success('You have left the match.');
      }
      setShowLeaveModal(false);
      navigate('/app/matches');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await reportsApi.submitReport({
        targetUserId: reportForm.targetUserId || match.host?._id,
        matchId: id,
        reason: reportForm.reason,
        details: reportForm.details
      });
      toast.success('Report submitted for admin review.');
      setShowReportModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Syncing match squad details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold mb-3">Match not found</p>
        <Button variant="primary" onClick={() => navigate('/app/matches')}>
          Back to Feed
        </Button>
      </div>
    );
  }

  const currentCount = (match.participants?.length || 0) + 1;
  const targetCount = match.headcountNeeded || 10;
  const isFull = currentCount >= targetCount;
  const userReliability = user?.reliabilityScore || 90;
  const minReliability = match.minReliability || 70;
  const meetsReliability = userReliability >= minReliability;

  const isConfirmed = match.bookingStatus === 'CONFIRMED';
  const qrPassData = match.qrPass || `PLAYSPHERE-MATCH-${match._id}-USER-${user?._id}`;

  return (
    <div className="space-y-4 pb-28 max-w-4xl mx-auto">
      {/* Top back & actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/matches')}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Matches</span>
        </button>

        <div className="flex items-center gap-2">
          {isParticipant && (
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1"
              title="Report User / No-Show"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          {isParticipant && (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHost ? 'Cancel Match' : 'Leave Squad'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                {match.sport || 'Football'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Min. Reliability: {minReliability}%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {match.venueName || match.venue?.name || 'Sports Arena'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {match.venue?.address?.formattedAddress || 'Ahmedabad, Gujarat'}
            </p>
          </div>

          {/* Booking Status Badge */}
          <div>
            {match.bookingStatus === 'CONFIRMED' ? (
              <Badge variant="success" className="text-sm py-1 px-3">
                Venue Confirmed
              </Badge>
            ) : match.bookingStatus === 'PENDING' ? (
              <Badge variant="warning" className="text-sm py-1 px-3">
                Venue Request Pending
              </Badge>
            ) : isFull ? (
              <Badge variant="primary" className="text-sm py-1 px-3">
                Squad Ready for Booking
              </Badge>
            ) : (
              <Badge variant="neutral" className="text-sm py-1 px-3">
                Recruiting Squad
              </Badge>
            )}
          </div>
        </div>

        {/* Date, Time & Cost Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-400 block font-medium">Date</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {match.date ? new Date(match.date).toLocaleDateString() : 'Today'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-400 block font-medium">Time Slot</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {match.startTime || '19:00'} - {match.endTime || '20:00'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 block font-medium">Est. Split Share</span>
            <span className="text-xs font-bold text-primary-700 block mt-0.5">
              ₹{Math.round((match.slot?.price || 1000) / targetCount)} / player
            </span>
          </div>
        </div>

        {/* Headcount Progress */}
        <div className="pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-600" />
              Squad Assembly ({currentCount} / {targetCount} Athletes)
            </span>
            <span className="font-bold text-slate-900">
              {isFull ? 'Target Met!' : `${targetCount - currentCount} spots left`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-primary-500' : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(100, Math.round((currentCount / targetCount) * 100))}%` }}
            />
          </div>
        </div>
      </Card>

      {/* QR PASS BANNER (If CONFIRMED) */}
      {isConfirmed && isParticipant && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Entry Pass Ready
            </p>
            <p className="text-sm font-extrabold">Tap to show your QR Pass at Venue Gate</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowQrModal(true)}
            className="shadow-md"
          >
            <QrCode className="w-4 h-4" />
            Show QR
          </Button>
        </div>
      )}

      {/* PARTICIPATION / JOIN ACTIONS */}
      {!isParticipant && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Join This Match
          </h2>

          {!meetsReliability ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Reliability Score Threshold Not Met
              </p>
              <p>
                This host requires a minimum reliability score of {minReliability}%. Your current score is {userReliability}%.
                Participate in open sessions with no minimum threshold to rebuild your score.
              </p>
            </div>
          ) : myRequestStatus === 'PENDING' ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>Your join request is awaiting host approval.</span>
              <Badge variant="warning">Request Pending</Badge>
            </div>
          ) : myRequestStatus === 'REJECTED' ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              Your request was not accepted by the host for this match.
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-md shadow-primary-600/20"
              onClick={handleRequestToJoin}
              loading={joining}
              disabled={isFull}
            >
              <Users className="w-4 h-4" />
              {isFull ? 'Squad is Full' : 'Request to Join Squad'}
            </Button>
          )}
        </Card>
      )}

      {/* HOST SPECIAL ACTIONS & INBOX */}
      {isHost && (
        <Card className="p-5 space-y-4 border-primary-200 bg-primary-50/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary-600" />
                Host Command Center
              </h2>
              <p className="text-xs text-slate-500">
                Manage squad approvals, ping nearby athletes, or trigger venue booking
              </p>
            </div>
          </div>

          {/* Quick Host Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePingNearby}
              loading={pinging}
              disabled={pingCooldown > 0}
            >
              <Radio className="w-4 h-4 text-primary-600" />
              {pingCooldown > 0
                ? `Cooldown (${Math.floor(pingCooldown / 60)}:${(pingCooldown % 60).toString().padStart(2, '0')})`
                : 'Ping Nearby Players'}
            </Button>

            {isFull && match.bookingStatus !== 'CONFIRMED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitBooking}
                loading={bookingLoading}
              >
                <CheckCircle className="w-4 h-4" />
                Submit Venue Booking Request
              </Button>
            )}
          </div>

          {/* Incoming Join Requests Inbox */}
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pending Join Requests ({joinRequests.filter((r) => r.status === 'PENDING').length})
            </h3>

            {joinRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending join requests.</p>
            ) : (
              <div className="space-y-2">
                {joinRequests
                  .filter((r) => r.status === 'PENDING')
                  .map((req) => (
                    <div
                      key={req._id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                          {req.player?.fullName?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {req.player?.fullName || req.player?.name || 'Athlete'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            @{req.player?.username || 'player'}
                          </p>
                        </div>
                        <ReliabilityBadge score={req.player?.reliabilityScore || 85} />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Accept Player"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req._id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Decline"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SQUAD ROSTER */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Squad Roster ({currentCount})
        </h2>

        <div className="divide-y divide-slate-100">
          {/* Host */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
                {match.host?.fullName?.[0] || 'H'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {match.host?.fullName || 'Host Athlete'}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary-100 text-primary-700 font-bold">
                    Host
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">@{match.host?.username || 'host'}</p>
              </div>
            </div>
            <ReliabilityBadge score={match.host?.reliabilityScore || 92} />
          </div>

          {/* Confirmed Participants */}
          {(match.participants || []).map((p, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                  {p.fullName?.[0] || 'P'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.fullName || 'Player'}</p>
                  <p className="text-[11px] text-slate-400">@{p.username || 'athlete'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ReliabilityBadge score={p.reliabilityScore || 88} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* MATCH CHAT (Only for accepted participants & host) */}
      {isParticipant ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              Squad Chat Room
            </h2>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Room
            </span>
          </div>

          {/* Messages list */}
          <div className="h-64 overflow-y-auto space-y-2.5 pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-10">
                No messages yet. Say hi to your squad!
              </p>
            ) : (
              messages.map((m, idx) => {
                const isMe = (m.sender?._id || m.sender) === user?._id;
                return (
                  <div
                    key={m._id || idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                      {isMe ? 'You' : m.sender?.fullName || 'Teammate'}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-medium shadow-xs ${
                        isMe
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {m.message || m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message your squad..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" variant="primary" size="sm" className="px-3">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      ) : (
        <div className="p-4 rounded-xl bg-slate-100 text-center text-xs text-slate-500">
          Match chat is locked. Request and get accepted into the squad to coordinate with teammates.
        </div>
      )}

      {/* QR PASS MODAL */}
      {showQrModal && (
        <Modal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Digital Turf Gate Pass"
        >
          <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-xl">
              <QRCodeSVG value={qrPassData} size={200} level="H" includeMargin />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {match.venueName || 'Sports Facility'}
              </p>
              <p className="text-xs text-slate-500">
                Holder: <span className="font-semibold text-slate-800">{user?.fullName || 'Athlete'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Pass Token: {match._id?.substring(0, 8)} • Single Participant Access
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(false)}
              className="w-full justify-center"
            >
              Close Pass
            </Button>
          </div>
        </Modal>
      )}

      {/* LEAVE / CANCEL WARNING MODAL */}
      {showLeaveModal && (
        <Modal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title={isHost ? 'Cancel Open Match?' : 'Leave Squad?'}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Reliability Score Penalty Warning
              </p>
              <p>
                Cancelling or leaving a match within 4 hours of kickoff results in an automatic
                <span className="font-bold"> -5% reliability score deduction</span> to maintain fair sportsmanship.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to proceed? Other squad members will be notified immediately.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(false)}>
                Stay in Match
              </Button>
              <Button variant="danger" size="sm" onClick={handleLeaveOrCancel}>
                Confirm {isHost ? 'Cancellation' : 'Departure'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REPORT USER MODAL */}
      {showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Report Misconduct or No-Show"
        >
          <form onSubmit={handleReportUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Report
              </label>
              <select
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="NO_SHOW">Player Did Not Show Up (No-Show)</option>
                <option value="UNSPORTSMANLIKE">Unsportsmanlike Behavior / Aggression</option>
                <option value="FAKE_PROFILE">Misrepresented Skill / Fake Details</option>
                <option value="HARASSMENT">Inappropriate Communication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Details
              </label>
              <textarea
                rows="3"
                value={reportForm.details}
                onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                placeholder="Describe what occurred during the session..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={submittingReport}>
                Submit Incident Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
