import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { venuesApi } from '../../api/venues.api.js';
import { playersApi } from '../../api/players.api.js';
import { LeafletMap } from '../../components/LeafletMap.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { StarRating } from '../../components/StarRating.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Navigation,
  List,
  Map as MapIcon,
  Star,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VenueDiscovery = () => {
  const navigate = useNavigate();

  // State
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Coordinates
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedRadius, setSelectedRadius] = useState(10); // km
  const [userCoords, setUserCoords] = useState(null); // [lat, lng]
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  const sportsList = ['ALL', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball'];

  // 1. Initial Load: Try Geolocation
  useEffect(() => {
    detectLocationAndFetch();
  }, []);

  const detectLocationAndFetch = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Using city search.');
      setLocationDenied(true);
      fetchVenuesBySearch('Ahmedabad');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords([latitude, longitude]);
        setLocationDenied(false);

        // Update player's location on backend
        try {
          await playersApi.updateLocation(latitude, longitude);
        } catch (e) {
          console.warn('Could not sync player location to server:', e.message);
        }

        // Fetch nearby venues
        fetchNearby(latitude, longitude, selectedRadius);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setLocationDenied(true);
        setLocating(false);
        toast('Location access denied. Enter your city or area to find venues.', {
          icon: '📍'
        });
        // Fallback default city search
        fetchVenuesBySearch('Ahmedabad');
      },
      { timeout: 7000 }
    );
  };

  const fetchNearby = async (lat, lng, radiusKm) => {
    setLoading(true);
    setError(null);
    try {
      const data = await venuesApi.searchNearby(lat, lng, radiusKm * 1000, selectedSport === 'ALL' ? undefined : selectedSport);
      setVenues(data.venues || data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load nearby venues. Try searching by city name.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenuesBySearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await venuesApi.searchByName(query.trim(), selectedSport === 'ALL' ? undefined : selectedSport);
      setVenues(data.venues || data || []);
    } catch (err) {
      console.error(err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchVenuesBySearch(searchQuery);
    } else if (userCoords) {
      fetchNearby(userCoords[0], userCoords[1], selectedRadius);
    }
  };

  const handleRadiusChange = (radius) => {
    setSelectedRadius(radius);
    if (userCoords) {
      fetchNearby(userCoords[0], userCoords[1], radius);
    }
  };

  // Filtered in-memory list (if sport is toggled)
  const filteredVenues = venues.filter((v) => {
    if (selectedSport === 'ALL') return true;
    const sports = v.sports || (v.grounds ? v.grounds.map((g) => g.sportType) : []);
    return sports.some((s) => s.toLowerCase() === selectedSport.toLowerCase());
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locationDenied ? "Search area or city (e.g. Ahmedabad, Mumbai)..." : "Search venues or location..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={detectLocationAndFetch}
            disabled={locating}
            title="Use Current GPS"
            className="px-3"
          >
            <Navigation className={`w-4 h-4 text-primary-600 ${locating ? 'animate-spin' : ''}`} />
          </Button>
        </form>

        {/* Location status alert if denied */}
        {locationDenied && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Location permission denied. Showing city search results.</span>
            </div>
            <button
              onClick={detectLocationAndFetch}
              className="text-primary-700 font-semibold hover:underline"
            >
              Retry GPS
            </button>
          </div>
        )}

        {/* Sport Pills & Radius Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Sports Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {sportsList.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>

          {/* Radius & View Mode Toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {userCoords && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                {[5, 10, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusChange(r)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      selectedRadius === r
                        ? 'bg-white font-bold text-primary-700 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Map View"
                aria-label="Map View"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm font-medium text-slate-500">Discovering verified sports venues...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center">
          <p className="text-sm text-rose-600 font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchVenuesBySearch('Ahmedabad')}>
            Load Recommended Venues
          </Button>
        </div>
      ) : filteredVenues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues found"
          description="Try increasing your search radius or searching for a different city."
          actionText="Show All Ahmedebad Venues"
          onAction={() => {
            setSelectedSport('ALL');
            fetchVenuesBySearch('Ahmedabad');
          }}
        />
      ) : viewMode === 'map' ? (
        /* Map View */
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <LeafletMap
              userLocation={userCoords}
              radiusKm={selectedRadius}
              venues={filteredVenues}
              onVenueSelect={(venue) => navigate(`/app/venues/${venue._id}`)}
              height="480px"
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            Tap on any venue marker to preview and view available slots.
          </p>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVenues.map((venue) => {
            const primaryPhoto =
              venue.photos?.find((p) => p.isPrimary)?.url ||
              venue.photos?.[0]?.url ||
              venue.photos?.[0] ||
              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';

            const rating = venue.rating || venue.averageRating || 4.7;
            const reviewCount = venue.reviewCount || 18;
            const startingPrice = venue.pricing?.offPeak || venue.pricing?.baseRate || 800;

            const sports = venue.sports || (venue.grounds ? venue.grounds.map((g) => g.sportType) : ['Football']);

            return (
              <Card
                key={venue._id}
                interactive
                onClick={() => navigate(`/app/venues/${venue._id}`)}
                className="overflow-hidden flex flex-col group hover:border-primary-400 transition-all"
              >
                {/* Photo Header */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={primaryPhoto}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Rating Tag */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{typeof rating === 'number' ? rating.toFixed(1) : '4.8'}</span>
                    <span className="text-slate-400 font-normal">({reviewCount})</span>
                  </div>

                  {/* Sport Badges */}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                    {sports.slice(0, 3).map((sp) => (
                      <span
                        key={sp}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900/80 backdrop-blur-xs text-white border border-white/20"
                      >
                        {sp}
                      </span>
                    ))}
                    {sports.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-900/80 text-white border border-white/20">
                        +{sports.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-primary-600 transition-colors">
                      {venue.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{venue.address?.formattedAddress || venue.address?.city || 'Ahmedabad, Gujarat'}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold block">Starts from</span>
                      <span className="text-sm font-bold text-slate-900">
                        ₹{startingPrice}
                        <span className="text-xs font-normal text-slate-500"> / hr</span>
                      </span>
                    </div>

                    <Button variant="primary" size="sm">
                      View Slots
                    </Button>
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
