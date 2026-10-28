import React, { useState, useEffect } from 'react';
import { venuesApi } from '../../api/venues.api.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import {
  Building2,
  Clock,
  MapPin,
  Camera,
  Trash2,
  Star,
  Plus,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OwnerListings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: { formattedAddress: '', city: 'Ahmedabad' },
    operatingHours: { open: '06:00', close: '23:00' },
    amenities: []
  });

  const [grounds, setGrounds] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Add Ground Modal
  const [showGroundModal, setShowGroundModal] = useState(false);
  const [newGround, setNewGround] = useState({ name: '', sportType: 'Football', surface: 'Artificial Turf' });

  // Photo URL input
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const allAmenities = [
    'Floodlights',
    'Changing Rooms',
    'Showers',
    'Drinking Water',
    'Free Parking',
    'Cafeteria',
    'First Aid Kit',
    'Dugout Seating'
  ];

  useEffect(() => {
    fetchVenueProfile();
  }, []);

  const fetchVenueProfile = async () => {
    setLoading(true);
    try {
      const data = await venuesApi.getMyVenue();
      const v = data.venue || data;
      setVenue(v);
      setForm({
        name: v.name || '',
        description: v.description || '',
        address: v.address || { formattedAddress: '', city: 'Ahmedabad' },
        operatingHours: v.operatingHours || { open: '06:00', close: '23:00' },
        amenities: v.amenities || ['Floodlights', 'Changing Rooms']
      });
      setGrounds(v.grounds || []);
      setPhotos(v.photos || []);
    } catch (err) {
      console.warn('Fallback venue profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVenueDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await venuesApi.updateVenue(venue?._id, {
        ...form,
        grounds
      });
      toast.success('Facility details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update venue');
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity) => {
    const exists = form.amenities.includes(amenity);
    if (exists) {
      setForm({ ...form, amenities: form.amenities.filter((a) => a !== amenity) });
    } else {
      setForm({ ...form, amenities: [...form.amenities, amenity] });
    }
  };

  const handleAddGround = (e) => {
    e.preventDefault();
    if (!newGround.name.trim()) return;
    setGrounds([...grounds, { ...newGround, _id: `g_${Date.now()}` }]);
    setNewGround({ name: '', sportType: 'Football', surface: 'Artificial Turf' });
    setShowGroundModal(false);
    toast.success('Playing ground added!');
  };

  const handleRemoveGround = (idx) => {
    setGrounds(grounds.filter((_, i) => i !== idx));
  };

  // Photo handlers
  const handleAddPhotoUrl = async (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    try {
      const newPic = {
        _id: `photo_${Date.now()}`,
        url: newPhotoUrl.trim(),
        isPrimary: photos.length === 0
      };
      const updated = [...photos, newPic];
      setPhotos(updated);
      await venuesApi.uploadPhotos(venue?._id, [newPhotoUrl.trim()]);
      toast.success('Photo added to gallery!');
      setNewPhotoUrl('');
    } catch (err) {
      toast.error('Failed to add photo');
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await venuesApi.setPrimaryPhoto(venue?._id, photoId);
      setPhotos(
        photos.map((p) => ({
          ...p,
          isPrimary: (p._id || p) === photoId
        }))
      );
      toast.success('Cover photo updated!');
    } catch (err) {
      toast.error('Failed to set cover photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await venuesApi.deletePhoto(venue?._id, photoId);
      setPhotos(photos.filter((p) => (p._id || p) !== photoId));
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Failed to remove photo');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading venue configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Facility Listing & Grounds Manager
          </h1>
          <p className="text-xs text-slate-500">
            Keep your grounds, operating hours, amenities, and photo gallery up-to-date
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={saving}
          onClick={handleSaveVenueDetails}
        >
          <Save className="w-4 h-4" />
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Basic Details & Operating Hours */}
        <Card className="p-5 lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            General Information
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Facility Description
              </label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Physical Address
              </label>
              <input
                type="text"
                value={form.address?.formattedAddress || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, formattedAddress: e.target.value }
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={form.operatingHours?.open || '06:00'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingHours: { ...form.operatingHours, open: e.target.value }
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={form.operatingHours?.close || '23:00'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingHours: { ...form.operatingHours, close: e.target.value }
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-2">
                Available Amenities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allAmenities.map((amenity) => {
                  const checked = form.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-colors ${
                        checked
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{amenity}</span>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Grounds Management */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary-600" />
              Playing Grounds
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroundModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {grounds.map((g, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{g.name}</p>
                  <p className="text-[11px] text-slate-500">{g.surface || 'Pro Turf'}</p>
                  <Badge variant="primary" className="mt-1">{g.sportType}</Badge>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveGround(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Remove ground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Photo Gallery Manager */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-primary-600" />
              Photo Gallery & Primary Cover
            </h2>
            <p className="text-xs text-slate-500">
              The primary cover photo is shown first on search results and athlete discovery feeds
            </p>
          </div>
        </div>

        {/* Add photo url */}
        <form onSubmit={handleAddPhotoUrl} className="flex gap-2">
          <input
            type="url"
            value={newPhotoUrl}
            onChange={(e) => setNewPhotoUrl(e.target.value)}
            placeholder="Paste high-res image URL (Unsplash or direct URL)..."
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <Button type="submit" variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Add Photo
          </Button>
        </form>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((p, idx) => {
            const isPrimary = p.isPrimary;
            const photoUrl = p.url || p;
            const photoId = p._id || p;

            return (
              <div
                key={idx}
                className="relative h-40 rounded-xl overflow-hidden border-2 bg-slate-900 group"
              >
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2" />

                {/* Primary Badge */}
                {isPrimary ? (
                  <span className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                    Primary Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryPhoto(photoId)}
                    className="absolute top-2 left-2 bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Set as Cover
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photoId)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Ground Modal */}
      {showGroundModal && (
        <Modal
          isOpen={showGroundModal}
          onClose={() => setShowGroundModal(false)}
          title="Add Playing Ground"
        >
          <form onSubmit={handleAddGround} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ground Name / Identifier
              </label>
              <input
                type="text"
                required
                value={newGround.name}
                onChange={(e) => setNewGround({ ...newGround, name: e.target.value })}
                placeholder="e.g. Ground 1 (Turf B)"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sport Type
              </label>
              <select
                value={newGround.sportType}
                onChange={(e) => setNewGround({ ...newGround, sportType: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Badminton">Badminton</option>
                <option value="Tennis">Tennis</option>
                <option value="Basketball">Basketball</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turf / Court Surface
              </label>
              <input
                type="text"
                value={newGround.surface}
                onChange={(e) => setNewGround({ ...newGround, surface: e.target.value })}
                placeholder="e.g. 50mm Monofilament Synthetic Turf"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowGroundModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Ground
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
