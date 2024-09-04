// OfficerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './moderatorstyles.css';

const OfficerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
    // Fetch Events
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    });

    // Fetch User Details
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, [db, auth]);

  const handleScanAttendance = (event) => {
    // Add facial recognition and attendance scanning logic here
    // Update `attendanceRecords` based on scanned data
  };

  return (
    <div className="officer-dashboard">
      <header className="navbar">
        <div className="logo-container">
          <img src="src/assets/images/nbsc_logo.png" alt="Logo" className="header-logo" />
          <div className="logo-text">Attendance Management</div>
        </div>
        <div className="user-info">
          <div className="officer">{user ? user.displayName : 'Officer'}</div>
          {/* Add Logout Component Here */}
        </div>
      </header>

      <div className="main-content">
        {/* Officer functionality, including scanning and managing attendance */}
        <h4>Events</h4>
        <ul>
          {events.map(event => (
            <li key={event.id}>
              {event.name}
              <button onClick={() => handleScanAttendance(event)}>Scan Attendance</button>
            </li>
          ))}
        </ul>

        {/* Display attendance records */}
      </div>
    </div>
  );
};

export default OfficerDashboard;
