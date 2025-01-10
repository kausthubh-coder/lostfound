import { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LostItem {
  id: string;
  title: string;
  description: string;
  lostlocation: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2F1c3RodWJobiIsImEiOiJjbTVvcG1yemYwZzFyMmlxNDNnazg4ampnIn0.ABCUdDdcg5Q6BRnSPPkkQg';

export default function MapView() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 35.3071,
    longitude: -80.7352, // UNCC coordinates
    zoom: 14,
    bearing: 0,
    pitch: 0
  });

  // Fetch items from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const itemsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LostItem[];
        setItems(itemsData);

        // Calculate bounds to fit all markers
        if (itemsData.length > 0) {
          const lats = itemsData.map(item => item.coordinates.latitude);
          const lngs = itemsData.map(item => item.coordinates.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          
          // Center the map on the markers
          setViewState(prev => ({
            ...prev,
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            zoom: 13
          }));
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  // Memoize markers to prevent unnecessary rerenders
  const markers = useMemo(() => items.map((item) => (
    <Marker
      key={item.id}
      latitude={item.coordinates.latitude}
      longitude={item.coordinates.longitude}
      anchor="bottom"
      onClick={e => {
        e.originalEvent.stopPropagation();
        setSelectedItem(item);
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
  )), [items]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900 p-4 pb-20">
      <div className="h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          reuseMaps
        >
          <NavigationControl position="top-right" />
          
          {markers}

          {selectedItem && (
            <Popup
              latitude={selectedItem.coordinates.latitude}
              longitude={selectedItem.coordinates.longitude}
              anchor="bottom"
              onClose={() => setSelectedItem(null)}
              closeOnClick={false}
              offset={25}
            >
              <div className="p-2 max-w-xs">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title} 
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                <p className="text-sm">{selectedItem.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Location: {selectedItem.lostlocation}
                </p>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <style>
        {`
          .marker-pin {
            cursor: pointer;
            animation: bounce 0.5s ease infinite alternate;
            filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));
          }

          @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-10px); }
          }

          .mapboxgl-popup-content {
            padding: 0;
            border-radius: 0.75rem;
            overflow: hidden;
            max-width: 300px;
            background: rgb(31 41 55);
            color: white;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          }

          .mapboxgl-popup-close-button {
            font-size: 16px;
            padding: 5px 10px;
            color: white;
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
            margin: 8px;
            z-index: 1;
            transition: all 0.2s;
          }

          .mapboxgl-popup-close-button:hover {
            background: rgba(0,0,0,0.7);
          }
        `}
      </style>
    </div>
  );
} 