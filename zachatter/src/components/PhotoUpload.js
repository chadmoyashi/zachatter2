// src/components/PhotoUpload.js
import React, { useState } from 'react';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PhotoUpload = ({ selectedLocation }) => {
  const [file, setFile] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedLocation) return;
    
    const storageRef = ref(storage, `photos/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Photo</button>
      {photoURL && <img src={photoURL} alt="Uploaded" style={{ width: "100px", height: "100px" }} />}
    </div>
  );
};

export default PhotoUpload;
