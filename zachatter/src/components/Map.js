import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Modal from 'react-modal';
import './Map.css';

mapboxgl.accessToken = "pk.eyJ1Ijoia2Vucm9veWFtYSIsImEiOiJjbTM4M28wMG0wbTdtMmtwdDQ4dzZpb3owIn0.0nEczXcb67MlO0bRozHGRA";

Modal.setAppElement('#root');

const Map = ({ onLocationSelect, posts, setUserLocation }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null); // To track the clicked post
  const userMarkerRef = useRef(null); // Store the user's marker for updating position

  useEffect(() => {
    if (navigator.geolocation && mapContainerRef.current && !mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Initialize Mapbox map
          mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [longitude, latitude],
            zoom: 18.5,
            pitch: 60,
            bearing: 0,
            dragPan: false,
            pitchWithRotate: false,
          });

          // Disable zooming
          mapRef.current.scrollZoom.disable();
          mapRef.current.doubleClickZoom.disable();
          mapRef.current.boxZoom.disable();
          mapRef.current.touchZoomRotate.disable();

          // Add a red marker for the user's location
          userMarkerRef.current = new mapboxgl.Marker({ color: 'red' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          // Listen for map clicks to select a location
          mapRef.current.on('click', (event) => {
            const { lng, lat } = event.lngLat;
            onLocationSelect({ longitude: lng, latitude: lat });
          });

          // Watch user's movement and keep map centered
          navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation([longitude, latitude]);

              if (mapRef.current) {
                mapRef.current.setCenter([longitude, latitude]);
              }
              if (userMarkerRef.current) {
                userMarkerRef.current.setLngLat([longitude, latitude]);
              }
            },
            (error) => {
              console.error("Error watching user location:", error);
            },
            { enableHighAccuracy: true }
          );
        },
        (error) => {
          console.error("Error getting initial location:", error);
        }
      );
    }
  }, [onLocationSelect, setUserLocation]);

  // Add markers for posts
  useEffect(() => {
    if (mapRef.current && posts) {
      posts.forEach((post) => {
        if (post.location) {
          const { latitude, longitude } = post.location;

          const marker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          marker.getElement().addEventListener('click', () => {
            setSelectedPost(post); // Open modal with post details
          });
        }
      });
    }
  }, [posts]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt.seconds * 1000); // Convert Firestore timestamp to Date
    const diffMinutes = Math.floor((now - postTime) / (1000 * 60)); // Difference in minutes
    return diffMinutes;
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />

      {/* Modal for displaying post details */}
      {selectedPost && (
        <Modal
          isOpen={!!selectedPost}
          onRequestClose={() => setSelectedPost(null)}
          contentLabel="View Post"
          className="modal"
          overlayClassName="overlay"
        >
          <h2>Posted {calculateTimeAgo(selectedPost.createdAt)} Minutes Ago</h2>
          <p><strong>Message:</strong> {selectedPost.message}</p>
          <img
            src={selectedPost.photoURL}
            alt="Post"
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
          />
          <button onClick={() => setSelectedPost(null)} className="close-button">
            Close
          </button>
        </Modal>
      )}
    </div>
  );
};

export default Map;
