import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
const firebaseEnabled = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (firebaseEnabled) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // @ts-ignore
    app = {};
    // @ts-ignore
    auth = {};
  }
} else {
  console.warn(
    "Firebase environment variables are not set. Firebase features will be disabled."
  );
  // @ts-ignore
  app = {};
  // @ts-ignore
  auth = {};
}

export { app, auth, firebaseEnabled };
