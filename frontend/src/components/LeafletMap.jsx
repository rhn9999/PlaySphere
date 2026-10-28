import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons in React Vite builds
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Helper component to smoothly center map when coordinates change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

export const LeafletMap = ({
  center = [23.0225, 72.5714], // Default Ahmedabad [lat, lng]
  zoom = 13,
  venues = [],
  userLocation = null,
  radius = null,
  onSelectVenue,
  height = '400px',
  className = ''
}) => {
  // Leaflet expects [latitude, longitude]
  const validCenter =
    center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])
      ? center
      : [23.0225, 72.5714];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={validCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={validCenter} zoom={zoom} />

        {/* User's Current Location Marker & Proximity Circle */}
        {userLocation && userLocation[0] && userLocation[1] && (
          <>
            <Marker position={[userLocation[0], userLocation[1]]} icon={userIcon}>
              <Popup>
                <div className="font-semibold text-slate-800 text-xs">You are here</div>
              </Popup>
            </Marker>
            {radius && (
              <Circle
                center={[userLocation[0], userLocation[1]]}
                radius={radius}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
            )}
          </>
        )}

        {/* Venue Markers */}
        {venues.map((venue) => {
          // GeoJSON Point is [longitude, latitude] -> Leaflet requires [latitude, longitude]
          const coords = venue.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const lat = coords[1];
          const lng = coords[0];

          return (
            <Marker
              key={venue._id}
              position={[lat, lng]}
              icon={defaultIcon}
              eventHandlers={{
                click: () => onSelectVenue && onSelectVenue(venue)
              }}
            >
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{venue.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {venue.address?.fullAddress}
                  </p>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-amber-600">★ {venue.avgRating?.toFixed(1) || '4.5'}</span>
                    <span className="text-primary-600">
                      {venue.sport?.[0] || 'Multi-Sport'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
