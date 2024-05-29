// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsqpOZG_DD7ySPGV-phfDHHI51HNY5hNs",
  authDomain: "mafiagame-1ed76.firebaseapp.com",
  projectId: "mafiagame-1ed76",
  storageBucket: "mafiagame-1ed76.appspot.com",
  messagingSenderId: "717696147204",
  appId: "1:717696147204:web:1e980bb497613b64f43a51",
  measurementId: "G-9CF45V79JS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

export { auth, db };
