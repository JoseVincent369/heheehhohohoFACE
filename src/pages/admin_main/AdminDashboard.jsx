import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../../firebaseutil/firebase_main';
import './styles.css';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [studentsCount, setStudentsCount] = useState(0);
    const [moderatorsCount, setModeratorsCount] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState(null); // State to track selected event

    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

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

    useEffect(() => {
        // Fetch User Details
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        // Fetch Students Count
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'user'));
        const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
            setStudentsCount(querySnapshot.size);
        });

        // Fetch Moderators Count
        const moderatorsQuery = query(collection(db, 'users'), where('role', '==', 'moderator'));
        const unsubscribeModerators = onSnapshot(moderatorsQuery, (querySnapshot) => {
            setModeratorsCount(querySnapshot.size);
        });

        return () => {
            unsubscribeStudents();
            unsubscribeModerators();
        };
    }, [db]);

    const handleLogout = () => {
        signOut(auth).catch((error) => {
            console.error('Error logging out: ', error);
        });
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    return (
        <div className="admin-dashboard">
            <header className="navbar">
                <div className="logo">Admin Panel</div>
                <div className="user-info">
                    <div className="admin">{user ? user.displayName : 'Admin'}</div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <ul>
                        <li><a href="/Admin">Dashboard</a></li>
                        <li><a href="/admin/events">Event Registration</a></li>
                        <li><a href="/admin/moderators">Moderator Management</a></li>
                        <li><a href="/signup">Student Registration</a></li>
                        <li><a href="/admin/StudentManage">Student Manage</a></li>
                        <li><a href="/">Settings</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Ongoing Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat students-attended">
                            <span>Students Attended</span>
                            <div className="badge">{studentsCount}</div>
                        </div>
                        <div className="stat moderators">
                            <span>Moderators</span>
                            <div className="badge">{moderatorsCount}</div>
                        </div>
                    </div>

                    <div className="events-section">
                        <h2>Overview</h2>
                        <ul className="event-list">
                            {events.map((event) => (
                                <li 
                                    className="event-item" 
                                    key={event.id} 
                                    onClick={() => handleEventClick(event)}
                                >
                                    {event.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {selectedEvent && (
                        <div className="event-modal">
                            <div className="modal-content">
                                <span className="close" onClick={handleCloseModal}>&times;</span>
                                <h2>{selectedEvent.name}</h2>
                                <p><strong>Description:</strong> {selectedEvent.description || 'N/A'}</p>
                                <p><strong>Start Date:</strong> {selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleString() : 'N/A'}</p>
                                <p><strong>End Date:</strong> {selectedEvent.endDate ? new Date(selectedEvent.endDate).toLocaleString() : 'N/A'}</p>
                                <p><strong>Venue:</strong> {selectedEvent.venue || 'N/A'}</p>
                                <p><strong>Organizations:</strong></p>
                                <ul>
                                    {(selectedEvent.organizations && selectedEvent.organizations.length > 0)
                                        ? selectedEvent.organizations.map((org, index) => (
                                            <li key={index}>{org}</li>
                                          ))
                                        : <li>N/A</li>
                                    }
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
