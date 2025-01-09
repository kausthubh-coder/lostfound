import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCM065SgkHHsU-j5N6ZEx2UjrmIJ-PWSlY",
  authDomain: "lostandfound-uncc.firebaseapp.com",
  projectId: "lostandfound-uncc",
  storageBucket: "lostandfound-uncc.firebasestorage.app",
  messagingSenderId: "203154415815",
  appId: "1:203154415815:web:31c7203aa6da7a1f595ee2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 