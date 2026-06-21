import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCHeOoBSnfbuOdtp7FCsmd_spOpMuvfwg",
  authDomain: "spendsmart-b8c50.firebaseapp.com",
  projectId: "spendsmart-b8c50",
  storageBucket: "spendsmart-b8c50.firebasestorage.app",
  messagingSenderId: "658867680914",
  appId: "1:658867680914:web:a34bcf83c8cafacef4984b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;