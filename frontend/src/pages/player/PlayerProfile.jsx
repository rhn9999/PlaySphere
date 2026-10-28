import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { playersApi } from '../../api/players.api.js';
import { reviewsApi } from '../../api/reviews.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge, ReliabilityBadge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { StarRating } from '../../components/StarRating.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  User,
  AtSign,
  Award,
  Trophy,
  Star,
  Plus,
  ThumbsUp,
  Edit3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PlayerProfile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    bio: '',
    preferredSports: []
  });

  // Skill Tags
  const [newSkillTag, setNewSkillTag] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  // Peer Reviews & Post-Match Review Modal
  const [peerReviews, setPeerReviews] = useState([]);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [peerReviewForm, setPeerReviewForm] = useState({
    targetPlayerId: '',
    sportsmanship: 5,
    skillRating: 5,
    comment: ''
  });
  const [submittingPeerReview, setSubmittingPeerReview] = useState(false);

  const availableSports = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Pickleball'];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const data = await playersApi.getMyProfile();
      const p = data.player || data.user || data;
      setProfile(p);
      setEditForm({
        fullName: p.fullName || user?.fullName || '',
        username: p.username || user?.username || '',
        bio: p.bio || '',
        preferredSports: p.preferredSports || ['Football']
      });

      // Fetch reviews
      if (p._id) {
        const revs = await reviewsApi.getPlayerReviews(p._id);
        setPeerReviews(revs.reviews || revs || []);
      }
    } catch (err) {
      console.warn('Fallback fetching profile:', err.message);
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await playersApi.updateProfile(editForm);
      const newUserData = updated.player || updated.user || updated;
      updateUser(newUserData);
      setProfile(newUserData);
      toast.success('Athlete profile updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkillTag = async (e) => {
    e.preventDefault();
    if (!newSkillTag.trim()) return;
    setAddingSkill(true);
    try {
      const skillName = newSkillTag.trim();
      await playersApi.addSkillTag(profile?._id || user?._id, skillName);
      toast.success(`Skill tag "${skillName}" added!`);
      setNewSkillTag('');
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add skill');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleEndorseSkill = async (skillName) => {
    try {
      await playersApi.endorseSkill(profile?._id || user?._id, skillName);
      toast.success(`Endorsed skill "${skillName}"!`);
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not endorse skill');
    }
  };

  const handleSubmitPeerReview = async (e) => {
    e.preventDefault();
    setSubmittingPeerReview(true);
    try {
      await reviewsApi.submitPlayerReview(profile?._id || user?._id, peerReviewForm);
      toast.success('Sportsmanship review submitted!');
      setShowPeerReviewModal(false);
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit peer review');
    } finally {
      setSubmittingPeerReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading athlete profile...</p>
      </div>
    );
  }

  const activeUser = profile || user || {};
  const reliability = activeUser.reliabilityScore || 92;
  const gamesPlayed = activeUser.gamesPlayed || activeUser.stats?.gamesPlayed || 24;

  const skillTags = activeUser.skillTags || [
    { name: 'Playmaker', endorsements: 12 },
    { name: 'Sprint Speed', endorsements: 8 },
    { name: 'Defense', endorsements: 15 },
    { name: 'Team Captain', endorsements: 9 }
  ];

  return (
    <div className="space-y-4 pb-28 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Avatar with status */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              {activeUser.fullName?.[0] || 'A'}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Info & Badges */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {activeUser.fullName || 'Athlete Name'}
                </h1>
                <p className="text-xs text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <AtSign className="w-3.5 h-3.5" />
                  {activeUser.username || 'athlete'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-600 pt-1">
              {activeUser.bio || 'Passionate amateur footballer and badminton enthusiast. Always looking for competitive weekend turf matches in the city.'}
            </p>

            {/* Preferred Sports */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
              {(activeUser.preferredSports || ['Football', 'Cricket']).map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200/60"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Games Played
            </span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {gamesPlayed}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Reliability
            </span>
            <div className="mt-1 flex justify-center">
              <ReliabilityBadge score={reliability} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Peer Endorsements
            </span>
            <span className="text-lg font-black text-primary-700 mt-0.5 block flex items-center justify-center gap-1">
              <ThumbsUp className="w-4 h-4 text-primary-600" />
              {skillTags.reduce((acc, s) => acc + (s.endorsements || 0), 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Skills & Endorsements */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary-600" />
              Skills & Peer Endorsements
            </h2>
            <p className="text-xs text-slate-500">
              Verified skills endorsed by squad teammates following matches
            </p>
          </div>
        </div>

        {/* Skill tags list */}
        <div className="flex flex-wrap gap-2">
          {skillTags.map((skill, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-xs group"
            >
              <span className="text-xs font-bold text-slate-800">{skill.name}</span>
              <button
                type="button"
                onClick={() => handleEndorseSkill(skill.name)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
                title="Endorse this skill"
              >
                <ThumbsUp className="w-3 h-3 text-primary-600" />
                <span>{skill.endorsements || 0}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Add Skill Tag Input */}
        <form onSubmit={handleAddSkillTag} className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={newSkillTag}
            onChange={(e) => setNewSkillTag(e.target.value)}
            placeholder="Add new athletic skill (e.g. Penalty Specialist, High Stamina)..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          <Button type="submit" variant="primary" size="sm" loading={addingSkill}>
            <Plus className="w-4 h-4" />
            Add Tag
          </Button>
        </form>
      </Card>

      {/* Peer Reviews & Sportsmanship History */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Post-Match Sportsmanship Reviews
            </h2>
            <p className="text-xs text-slate-500">
              Feedback must be provided within the 24-hour post-match window
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPeerReviewModal(true)}
          >
            Review Teammate
          </Button>
        </div>

        {/* 24h Window Notice */}
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Only matches completed in the last 24 hours are eligible for sportsmanship and skill ratings.
          </span>
        </div>

        {peerReviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No peer reviews received yet. Complete matches to build your reputation!</p>
        ) : (
          <div className="space-y-2.5">
            {peerReviews.map((rev, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {rev.reviewer?.fullName?.[0] || 'T'}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {rev.reviewer?.fullName || 'Teammate'}
                    </span>
                  </div>
                  <StarRating rating={rev.sportsmanship || 5} readonly size="sm" />
                </div>
                {rev.comment && <p className="text-xs text-slate-600">{rev.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Athlete Profile"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bio / Athletic Playing Style
              </label>
              <textarea
                rows="3"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Positions you play, playstyle, and favorite sports..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Sports
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableSports.map((sp) => {
                  const active = editForm.preferredSports?.includes(sp);
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? editForm.preferredSports.filter((s) => s !== sp)
                          : [...(editForm.preferredSports || []), sp];
                        setEditForm({ ...editForm, preferredSports: next });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        active
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Post Match Peer Review Modal */}
      {showPeerReviewModal && (
        <Modal
          isOpen={showPeerReviewModal}
          onClose={() => setShowPeerReviewModal(false)}
          title="Rate Teammate Post-Match"
        >
          <form onSubmit={handleSubmitPeerReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sportsmanship (1 - 5 stars)
              </label>
              <StarRating
                rating={peerReviewForm.sportsmanship}
                onChange={(v) => setPeerReviewForm({ ...peerReviewForm, sportsmanship: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skill Level (1 - 5 stars)
              </label>
              <StarRating
                rating={peerReviewForm.skillRating}
                onChange={(v) => setPeerReviewForm({ ...peerReviewForm, skillRating: v })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Comment
              </label>
              <textarea
                rows="3"
                value={peerReviewForm.comment}
                onChange={(e) => setPeerReviewForm({ ...peerReviewForm, comment: e.target.value })}
                placeholder="Great passing, arrived punctually on the turf, positive squad attitude..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              Note: Reviews are only accepted for matches completed within the past 24 hours.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPeerReviewModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submittingPeerReview}>
                Submit Review
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
