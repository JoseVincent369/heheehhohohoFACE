import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";


// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const {
  VITE_REACT_API_KEY,
  VITE_REACT_AUTH_DOMAIN,
  VITE_REACT_PROJECTID,
  VITE_REACT_STORAGE_BUCKET,
  VITE_REACT_MESSAGING_SENDER_ID,
  VITE_REACT_APP_ID,
  VITE_REACT_MEASUREMENT_ID,
} = import.meta.env;
const firebaseConfig = {
  apiKey: VITE_REACT_API_KEY,
  authDomain: VITE_REACT_AUTH_DOMAIN,
  projectId: VITE_REACT_PROJECTID,
  storageBucket: VITE_REACT_STORAGE_BUCKET,
  messagingSenderId: VITE_REACT_MESSAGING_SENDER_ID,
  appId: VITE_REACT_APP_ID,
    measurementId: VITE_REACT_MEASUREMENT_ID,
    databaseURL: "https://face-bdf67-default-rtdb.asia-southeast1.firebasedatabase.app",
};


// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);

export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const STORAGE = getStorage(FIREBASE_APP);
export const REALDB = getDatabase(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
// Change this line if needed
export const FIREBASE_DB = getFirestore(FIREBASE_APP);