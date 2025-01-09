import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// Your Firebase configuration
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
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Set dark mode based on user preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="pb-16"> {/* Padding for navbar */}
          <Routes>
            <Route path="/" element={
              user ? <Navigate to="/dashboard" /> : <Login />
            } />
            <Route path="/dashboard" element={
              user ? <Dashboard /> : <Navigate to="/" />
            } />
            <Route path="/map" element={
              user ? <Map /> : <Navigate to="/" />
            } />
            <Route path="/messages" element={
              user ? <Messages /> : <Navigate to="/" />
            } />
            <Route path="/profile" element={
              user ? <Profile /> : <Navigate to="/" />
            } />
          </Routes>
          {user && <Navbar />}
        </div>
      </div>
    </Router>
  );
}

export default App;
