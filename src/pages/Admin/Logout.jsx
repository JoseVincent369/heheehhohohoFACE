import React, { useEffect, useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FIREBASE_AUTH } from '../../firebaseutil/firebase_main'; // Adjust the import path as needed
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './localstyles.css';

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if there is an authenticated user
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setAuthUser(user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!authUser) {
      alert('No user is currently authenticated');
      navigate('/');
      return;
    }

    try {
      await signOut(FIREBASE_AUTH);
      navigate('/'); // Redirect to the home/login page or any other page
      if (onLogout) onLogout(); // Call the onLogout function passed as a prop
    } catch (error) {
      console.error('Sign out error:', error.message);
      setError('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="logout-container">
      {error && <Alert variant="danger">{error}</Alert>}
      <Button variant="danger" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
};

export default Logout;
