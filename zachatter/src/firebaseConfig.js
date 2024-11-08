// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAbR9L9MfDf-qfmwWNCIGlwTWBeEgrz_BU",
    authDomain: "zachatter2.firebaseapp.com",
    projectId: "zachatter2",
    storageBucket: "zachatter2.firebasestorage.app",
    messagingSenderId: "291058749422",
    appId: "1:291058749422:web:6b64a391d33e2625cd48ff",
    measurementId: "G-MCVMXC0KM3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const db = getFirestore(app); // Export Firestore instance