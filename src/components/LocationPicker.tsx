import { useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2F1c3RodWJobiIsImEiOiJjbTVvcG1yemYwZzFyMmlxNDNnazg4ampnIn0.ABCUdDdcg5Q6BRnSPPkkQg';

const UNCC_COORDS = {
  latitude: 35.3071,
  longitude: -80.7352
};

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLat || UNCC_COORDS.latitude,
    longitude: initialLng || UNCC_COORDS.longitude
  });

  const [viewState, setViewState] = useState({
    latitude: initialLat || UNCC_COORDS.latitude,
    longitude: initialLng || UNCC_COORDS.longitude,
    zoom: 14
  });

  // Only get current location on initial mount
  useEffect(() => {
    const getInitialLocation = () => {
      if (!initialLat && !initialLng && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setMarkerPosition(newPos);
            setViewState(prev => ({
              ...prev,
              ...newPos,
              zoom: 15
            }));
            onLocationSelect(newPos.latitude, newPos.longitude);
          },
          (error) => {
            console.log('Error getting location:', error);
            onLocationSelect(UNCC_COORDS.latitude, UNCC_COORDS.longitude);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }
    };

    getInitialLocation();
  }, []); // Empty dependency array - only runs once

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-gray-700">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={evt => {
          const newPos = {
            latitude: evt.lngLat.lat,
            longitude: evt.lngLat.lng
          };
          setMarkerPosition(newPos);
          onLocationSelect(newPos.latitude, newPos.longitude);
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Marker
          latitude={markerPosition.latitude}
          longitude={markerPosition.longitude}
          draggable
          onDragEnd={evt => {
            const newPos = {
              latitude: evt.lngLat.lat,
              longitude: evt.lngLat.lng
            };
            setMarkerPosition(newPos);
            onLocationSelect(newPos.latitude, newPos.longitude);
          }}
        >
          <div className="marker-pin">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              className="transition-transform hover:scale-125"
            >
              <path
                fill="#FF4B4B"
                d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 7 13s7-7.75 7-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
              />
            </svg>
          </div>
        </Marker>
      </Map>
      <div className="absolute bottom-2 left-2 bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs text-gray-300">
        Click to place marker or drag marker to select location
      </div>
      <div className="absolute top-2 right-2">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const newPos = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  };
                  setMarkerPosition(newPos);
                  setViewState(prev => ({
                    ...prev,
                    ...newPos,
                    zoom: 15
                  }));
                  onLocationSelect(newPos.latitude, newPos.longitude);
                }
              );
            }
          }}
          className="bg-gray-900/80 backdrop-blur-sm hover:bg-gray-800 text-gray-300 p-2 rounded-lg transition-colors"
          title="Use current location"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
} 