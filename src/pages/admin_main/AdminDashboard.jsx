import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../../firebaseutil/firebase_main';
import './styles.css';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);

    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    useEffect(() => {
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

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [auth]);

    const handleLogout = () => {
        signOut(auth).catch((error) => {
            console.error('Error logging out: ', error);
        });
    };

    return (
        <div className="admin-dashboard">
            <header className="navbar">
                <div className="logo">LOGO</div>
                <div className="user-info">
                    <div className="admin">{user ? user.displayName : 'Admin'}</div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            
            <div className="main-content">
                {/* Sidebar Navigation */}
                <nav className="sidebar">
                    <ul>
                        <li><a href="/Admin">AdminDashboard</a></li>
                        <li><a href="/admin/events">Event Registration</a></li>
                        <li><a href="/admin/moderators">Moderators Registration</a></li>
                        <li><a href="/signup">Student Registration</a></li>
                        <li><a href="/reports">Reports daot pa</a></li>
                        <li><a href="/">Settings daot pa</a></li>
                    </ul>
                </nav>

                {/* Main Dashboard Content */}
                <div className="content">
                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Ongoing Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat students-attended">
                            <span>Students Attended</span>
                            <div className="badge">■</div>
                        </div>
                        <div className="stat moderators">
                            <span>Moderators</span>
                            <div className="badge">■</div>
                        </div>
                    </div>

                    <div className="events-section">
                        <h2>Events</h2>
                        <button className="add-event-btn">+ Add Event</button>
                        <ul className="event-list">
                            {events.map((event) => (
                                <li className="event-item" key={event.id}>
                                    {event.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button className="back-btn">Back</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
