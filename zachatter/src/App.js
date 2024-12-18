// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import Map from './components/Map';
import { AiOutlinePlus } from 'react-icons/ai';
import { MdHelpOutline } from 'react-icons/md';
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpPage, setHelpPage] = useState(0);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [isEventBooth, setIsEventBooth] = useState(false);
  const mapRef = useRef(null);
  const fixedZoomLevel = 18.5;

  const openModal = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(fixedZoomLevel);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setMessage('');
    setUploadStatus('');
    setSelectedLocation(null);
    setIsEventBooth(false);
    resetMap();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus('アップロード完了!');
    } else {
      setUploadStatus('');
    }
  };

  const handleMessageChange = (e) => setMessage(e.target.value);

  const handlePost = async () => {
    const locationToPost = selectedLocation || previousLocation;
    if (!message || !locationToPost) {
      console.error('Missing message or location');
      return;
    }

    try {
      let photoURL = null;

      if (file) {
        const fileRef = ref(storage, `photos/${file.name}-${Date.now()}`);
        await uploadBytes(fileRef, file);
        photoURL = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'posts'), {
        message,
        photoURL,
        location: locationToPost,
        createdAt: Timestamp.now(),
        isEventBooth,
      });

      closeModal();
      resetMap();
    } catch (error) {
      console.error('Error posting:', error);
    }
  };

  const resetMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setZoom(fixedZoomLevel);
      mapRef.current.setCenter(userLocation);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userLocation || !allPosts.length) return;

    const now = Timestamp.now().toDate();
    const updatedFilteredPosts = allPosts.filter((post) => {
      const postTime = post.createdAt?.toDate();
      const timeDiff = (now - postTime) / (1000 * 60);

      if (timeDiff > 150) return false;

      const distance = calculateDistance(
        userLocation[1],
        userLocation[0],
        post.location.latitude,
        post.location.longitude
      );

      return distance <= 0.2;
    });

    setFilteredPosts(updatedFilteredPosts);
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

  const handleHelpClose = () => {
    setHelpPage(0);
    setIsHelpModalOpen(false);
  };

  const goToNextHelpPage = () => {
    setHelpPage((prev) => (prev + 1) % 2);
  };

  return (
    <div className="App">
      <div className="logo">Zachatter</div>
      <div className="map-container">
        <Map
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            setPreviousLocation(location);
          }}
          posts={filteredPosts}
          setUserLocation={(location) => {
            setUserLocation(location);
            if (location) setPreviousLocation({ latitude: location[1], longitude: location[0] });
          }}
          mapRef={mapRef}
        />
      </div>
      <button className="fab" onClick={openModal}>
        <AiOutlinePlus size={30} color="white" />
      </button>

      {/* Help Button */}
      <button
        className="help-button"
        onClick={() => setIsHelpModalOpen(true)}
      >
        <MdHelpOutline size={60} color="white" />
      </button>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <Modal
          isOpen={isHelpModalOpen}
          onRequestClose={handleHelpClose}
          contentLabel="Help"
          className="help-modal"
          overlayClassName="overlay"
        >
          {helpPage === 0 ? (
            <h2>投稿の仕方</h2>
          ) : (
            <h2>投稿完了</h2>
          )}
          <img
            src={helpPage === 0 ? 'images/img1.png' : 'images/img2.png'}
            alt="Tutorial"
            className="help-image"
          />
          <button
            className="intro-close-button"
            onClick={goToNextHelpPage}
          >
            次へ
          </button>
          <button
            className="intro-close-button"
            onClick={handleHelpClose}
          >
            閉じる
          </button>
        </Modal>
      )}

      {/* Intro Modal */}
      {showIntroModal && (
        <Modal
          isOpen={showIntroModal}
          onRequestClose={() => setShowIntroModal(false)}
          contentLabel="Introduction"
          className="intro-modal"
          overlayClassName="overlay"
        >
          <h2>NFマップは</h2>
          <p>
            現在地に関する情報を投稿、閲覧できるマップです
            <br />
            1時間おきに投稿が消えるので、リアルタイムの情報を知ることができます
          </p>
          <p>
            端にある店舗やパフォーマンスなど、見つけにくい情報により一層スポットライトがあたるので、告知に最適です
          </p>
          <p>
            NF期間中、公式Instagramで
            <br />
            ・各日、合計10投稿してくれた店舗を全力で告知します
            <br />
            ・毎日、その日上がったユニークな写真を３枚選んで発表します
            <br />
            お楽しみに！
          </p>
          <p>
            私たちはもっと人間味ある社会を目指しています。
            <br />
            他者への配慮と温かい心をもって投稿してください！
          </p>
          <button
            className="intro-close-button"
            onClick={() => setShowIntroModal(false)}
          >
            Let's Start!
          </button>
        </Modal>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Post Photo"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>メッセージを投稿する</h2>
        <label htmlFor="file-input" className="file-input-button">
          {file ? '別の写真をアップロード' : '写真をアップロード'}
        </label>
        <input type="file" id="file-input" onChange={handleFileChange} />
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
        <textarea
          placeholder="メッセージを入力してください"
          value={message}
          onChange={handleMessageChange}
          rows="4"
          className="message-input"
        />
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="event-booth-checkbox"
            checked={isEventBooth}
            onChange={(e) => setIsEventBooth(e.target.checked)}
          />
          <label htmlFor="event-booth-checkbox">運営者が投稿する場合はここにチェック</label>
        </div>
        <button onClick={handlePost} className="post-button">投稿</button>
        <button onClick={closeModal} className="cancel-button">戻る</button>
      </Modal>
    </div>
  );
}

export default App;
