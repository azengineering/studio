import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Default to null/false
let app: FirebaseApp | null = null;
let firebaseEnabled = false;

// Only attempt initialization if keys are present
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    // Initialize Firebase
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseEnabled = true; // Set to true only on successful initialization
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // On error, ensure we remain in a disabled state
    app = null;
    firebaseEnabled = false;
  }
} else {
  console.warn(
    "Firebase environment variables are not set. Firebase features will be disabled."
  );
}

// Conditionally get auth if app was initialized successfully
const auth = app ? getAuth(app) : {};

export { app, auth, firebaseEnabled };
