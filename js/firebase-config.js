// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDN0Jm9LjaQjyZBVEInPhI0zrgkzbqNgmM",
  authDomain: "prescription-verifier-app.firebaseapp.com",
  projectId: "prescription-verifier-app",
  storageBucket: "prescription-verifier-app.firebasestorage.app",
  messagingSenderId: "553152124901",
  appId: "1:553152124901:web:7fc586193f0edcf0cac10c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
