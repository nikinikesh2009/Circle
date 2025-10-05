import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAEapCrpDGGMiuDcZEu70T3c2AeZfVear8",
  authDomain: "circle-classroom.firebaseapp.com",
  databaseURL: "https://circle-classroom-default-rtdb.firebaseio.com",
  projectId: "circle-classroom",
  storageBucket: "circle-classroom.firebasestorage.app",
  messagingSenderId: "704930090713",
  appId: "1:704930090713:web:47a0d25c5a42ed18b6f8c8"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export default app;
