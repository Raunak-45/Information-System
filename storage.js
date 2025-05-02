import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Paste your Firebase config here
const firebaseConfig = {
    apiKey: "AIzaSyAikWODdUaS4Tx3WtPpKqQ5T83Nkts1PHw",
    authDomain: "information-system-589c6.firebaseapp.com",
    projectId: "information-system-589c6",
    storageBucket: "information-system-589c6.firebasestorage.app",
    messagingSenderId: "501852663760",
    appId: "1:501852663760:web:bcc81ea2f43c8aae9253d5",
    measurementId: "G-SY51HZX959"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();

const STORAGE_KEY = 'classVIII_cards';

// Generate or retrieve user ID
function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'guest_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// Save to both localStorage and Firebase
export async function saveCards(cards) {
  try {
    // Local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    
    // Firebase
    await set(ref(db, `users/${getUserId()}/cards`), cards);
    return true;
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}

// Load with Firebase sync
export function loadCards(callback) {
  // First try localStorage
  const localData = localStorage.getItem(STORAGE_KEY);
  
  // Then sync from Firebase
  const cardsRef = ref(db, `users/${getUserId()}/cards`);
  onValue(cardsRef, (snapshot) => {
    const cloudCards = snapshot.val();
    
    if (cloudCards) {
      // Update localStorage with cloud data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudCards));
      callback(cloudCards);
    } else if (localData) {
      // No cloud data, use local
      callback(JSON.parse(localData));
    } else {
      // No data anywhere
      callback(null);
    }
  });
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  // Optional: Also clear from Firebase if needed
}