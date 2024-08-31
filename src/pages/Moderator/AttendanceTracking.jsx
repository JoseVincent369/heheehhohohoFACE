import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './ModeratorStyles.css';

const AttendanceTracking = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [user, setUser] = useState(null);

    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);

    useEffect(() => {
        // Fetch User Details
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [auth]);

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

        return () => unsubscribe();
    }, [db]);

    const handleLogout = () => {
        signOut(auth).catch((error) => {
            console.error('Error logging out: ', error);
        });
    };

    const handleStartAttendance = () => {
        setCameraEnabled(true);
    };

    const handleStopAttendance = () => {
        setCameraEnabled(false);
        // Add code to process attendance data and update Firestore
    };

    const handleEventChange = (e) => {
        const selectedEventId = e.target.value;
        const event = events.find(event => event.id === selectedEventId);
        setSelectedEvent(event);
    };

    return (
        <div className="attendance-tracking">
            <header className="navbar">
                <div className="logo">Attendance Tracking</div>
                <div className="user-info">
                    <div className="user">{user ? user.displayName : 'Moderator'}</div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar`}>
                    <ul>
                        <li><a href="/moderator/dashboard">Dashboard</a></li>
                        <li><a href="/moderator/events">Event Management</a></li>
                        <li><a href="/moderator/attendance">Attendance Tracking</a></li>
                        <li><a href="/">Settings</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <h2>Attendance Tracking</h2>
                    <select onChange={handleEventChange}>
                        <option value="">Select Event</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>

                    {selectedEvent && (
                        <div className="attendance-section">
                            <h3>Event: {selectedEvent.name}</h3>
                            {cameraEnabled ? (
                                <div>
                                    <p>Camera is active...</p>
                                    {/* Add camera and facial recognition integration here */}
                                    <button onClick={handleStopAttendance}>Stop Attendance</button>
                                </div>
                            ) : (
                                <button onClick={handleStartAttendance}>Start Attendance</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceTracking;
