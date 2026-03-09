// Firebase core
import { initializeApp } from "firebase/app";

// Firebase services you are using
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// OPTIONAL: Analytics (only works on production domains)
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQlqu-ksKqDYTpaKvcSE7ukIY2Vtml1uc",
  authDomain: "startuparena-e436a.firebaseapp.com",
  projectId: "startuparena-e436a",
  storageBucket: "startuparena-e436a.appspot.com", // 🔴 FIXED
  messagingSenderId: "746804780192",
  appId: "1:746804780192:web:2c217f6b5e4f2fd6383dc5",
  measurementId: "G-HHEQ9MWJ28",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (optional)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;
