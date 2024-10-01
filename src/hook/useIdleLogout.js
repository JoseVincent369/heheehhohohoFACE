// src/hooks/useIdleLogout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth'; // Import signOut from firebase/auth
import { FIREBASE_AUTH } from '../firebaseutil/firebase_main'; // Adjust import as necessary

const useIdleLogout = (timeout = 5 * 60 * 1000) => { // 5 minutes
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        signOut(FIREBASE_AUTH) // Sign out the user
          .then(() => {
            navigate('/'); // Redirect to the login page or any other page
          })
          .catch((error) => {
            console.error('Sign out error:', error.message);
          });
      }, timeout);
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Start the timer
    resetTimer();

    // Cleanup on component unmount
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [navigate, timeout]);
};

export default useIdleLogout;
