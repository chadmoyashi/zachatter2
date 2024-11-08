// src/App.js
import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import { AiOutlinePlus } from 'react-icons/ai';
import Modal from 'react-modal';
import { db, storage } from './firebaseConfig';
import { collection, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './App.css';

Modal.setAppElement('#root');

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // Track upload status

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setMessage('');
    setUploadStatus(''); // Clear upload status
    setSelectedLocation(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus('Uploaded!'); // Set upload status when file is selected
    } else {
      console.error('No file selected');
      setUploadStatus('');
    }
  };

  const handleMessageChange = (e) => setMessage(e.target.value);

  const handlePost = async () => {
    const locationToPost = selectedLocation || previousLocation;
    console.log('Posting with location:', locationToPost);

    if (!file || !message || !locationToPost) {
      console.error('Missing file, message, or location');
      return;
    }

    try {
      const fileRef = ref(storage, `photos/${file.name}`);
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);

      await addDoc(collection(db, 'posts'), {
        message,
        photoURL,
        location: locationToPost,
        createdAt: Timestamp.now(),
      });

      closeModal();
    } catch (error) {
      console.error('Error posting:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const allPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllPosts(allPosts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userLocation || !allPosts.length) return;

    const now = Timestamp.now().toDate();
    const filtered = allPosts.filter((post) => {
      const postTime = post.createdAt?.toDate();
      const timeDiff = (now - postTime) / (1000 * 60);

      if (timeDiff > 30) return false;

      const distance = calculateDistance(
        userLocation[1],
        userLocation[0],
        post.location.latitude,
        post.location.longitude
      );

      return distance <= 0.2;
    });

    setFilteredPosts(filtered);
  }, [userLocation, allPosts]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon1 - lon2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="App">
      <div className="logo">Zachatter</div>
      <div className="map-container">
        <Map
          onLocationSelect={(location) => {
            console.log('Location Selected in App:', location);
            setSelectedLocation(location);
            setPreviousLocation(location);
          }}
          posts={filteredPosts}
          setUserLocation={(location) => {
            setUserLocation(location);
            if (location) setPreviousLocation({ latitude: location[1], longitude: location[0] });
          }}
        />
      </div>
      <button className="fab" onClick={openModal}>
        <AiOutlinePlus size={24} color="white" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Post Photo"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Post a Photo</h2>
        <label htmlFor="file-input" className="file-input-button">
          {file ? 'Upload a Different Photo' : 'Upload Photo'}
        </label>
        <input type="file" id="file-input" onChange={handleFileChange} />
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
        <textarea
          placeholder="Add a message..."
          value={message}
          onChange={handleMessageChange}
          rows="4"
          className="message-input"
        />
        <button onClick={handlePost} className="post-button">Post</button>
        <button onClick={closeModal} className="cancel-button">Cancel</button>
      </Modal>
    </div>
  );
}

export default App;
