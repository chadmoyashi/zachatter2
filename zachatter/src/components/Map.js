// src/components/Map.js
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Modal from 'react-modal';
import './Map.css';

mapboxgl.accessToken = "pk.eyJ1Ijoia2Vucm9veWFtYSIsImEiOiJjbTM4M28wMG0wbTdtMmtwdDQ4dzZpb3owIn0.0nEczXcb67MlO0bRozHGRA";

Modal.setAppElement('#root');

const Map = ({ onLocationSelect, posts, setUserLocation }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const userMarkerRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    if (navigator.geolocation && mapContainerRef.current && !mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Initialize Mapbox map, centering on user's location
          mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [longitude, latitude],
            zoom: 18.5,
            pitch: 60,
            bearing: 0,
            dragPan: false,
            dragRotate: true,
            pitchWithRotate: false,
            scrollZoom: false,
            doubleClickZoom: false,
            touchZoomRotate: false // Disable pinch zoom and rotation gestures
          });

          // Keep user location at the center and prevent panning
          mapRef.current.on('drag', () => {
            mapRef.current.setCenter([longitude, latitude]);
          });

          // Add a marker at the user's current location
          userMarkerRef.current = new mapboxgl.Marker({ color: 'red' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          // Watch user location with 30-second interval for updates
          navigator.geolocation.watchPosition(
            (position) => {
              const currentTime = Date.now();
              if (currentTime - lastUpdateTimeRef.current >= 30000) { // 30 seconds
                const { latitude, longitude } = position.coords;
                setUserLocation([longitude, latitude]);
                mapRef.current.setCenter([longitude, latitude]);
                userMarkerRef.current.setLngLat([longitude, latitude]);
                lastUpdateTimeRef.current = currentTime;
              }
            },
            (error) => console.error("Error watching location:", error),
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 }
          );

          // Custom handling for single-finger rotation
          let startX = null;

          mapRef.current.on('touchstart', (e) => {
            if (e.originalEvent.touches.length === 1) {
              startX = e.originalEvent.touches[0].clientX;
            }
          });

          mapRef.current.on('touchmove', (e) => {
            if (startX !== null && e.originalEvent.touches.length === 1) {
              const currentX = e.originalEvent.touches[0].clientX;
              const rotationChange = (currentX - startX) * 0.3; // Increased sensitivity for quicker rotation
              mapRef.current.setBearing(mapRef.current.getBearing() - rotationChange);
              startX = currentX;
            }
          });

          mapRef.current.on('touchend', () => {
            startX = null;
          });

          // Map click event for selecting a location
          mapRef.current.on('click', (event) => {
            const { lng, lat } = event.lngLat;
            onLocationSelect({ longitude: lng, latitude: lat });
          });
        },
        (error) => console.error("Error getting initial location:", error)
      );
    }
  }, [onLocationSelect, setUserLocation]);

  // Add markers for posts
  useEffect(() => {
    if (mapRef.current && posts) {
      posts.forEach((post) => {
        if (post.location) {
          const { latitude, longitude } = post.location;

          const marker = new mapboxgl.Marker({ color: 'purple' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          marker.getElement().addEventListener('click', () => {
            setSelectedPost(post);
          });
        }
      });
    }
  }, [posts]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt.seconds * 1000);
    const diffMinutes = Math.floor((now - postTime) / (1000 * 60));
    return diffMinutes;
  };

  return (
    <div>
      <div ref={mapContainerRef} id="map" />

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
