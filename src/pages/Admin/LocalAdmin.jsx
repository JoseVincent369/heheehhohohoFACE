import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './localstyles.css';
import logo from '../../assets/images/nbsc logo.png'; // Correct image import
import Logout from '../Admin/Logout'; // Import Logout component

const LocalAdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);

    useEffect(() => {
        // Fetch User Details
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false); // Set loading to false after user is fetched
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (!user) return; // Exit if no user is logged in

        // Fetch Events
        const q = query(collection(db, 'events'), where('createdBy', '==', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const eventsData = [];
            querySnapshot.forEach((doc) => {
                eventsData.push({ id: doc.id, ...doc.data() });
            });
            setEvents(eventsData);
        }, (error) => {
            console.error('Error fetching events: ', error);
        });

        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        if (!user) return; // Exit if no user is logged in

        // Fetch Students related to events
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const studentsData = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ id: doc.id, ...doc.data() });
            });
            setStudents(studentsData);
        }, (error) => {
            console.error('Error fetching students: ', error);
        });

        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        if (!user) return; // Exit if no user is logged in

        // Fetch Organizations related to events
        const q = query(collection(db, 'users'), where('organization', '!=', ''));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const organizationsData = new Set();
            querySnapshot.forEach((doc) => {
                organizationsData.add(doc.data().organization);
            });
            setOrganizations(Array.from(organizationsData));
        }, (error) => {
            console.error('Error fetching organizations: ', error);
        });

        return () => unsubscribe();
    }, [db, user]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    // Display a loading message while user data is being fetched
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            <header className="navbar">
                <div className="logo-container">
                    <img
                        src={logo} // Use the imported image
                        alt="Logo"
                        className="header-logo"
                    />
                    <div className="logo-text">E-Attend Attendance System</div>
                </div>
                <div className="user-info">
                    <div className="admin">{user ? user.displayName : 'Admin'}</div>
                    {/* Use the Logout component */}
                    <Logout />
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <ul>
                        <li><a href="/localadmin">Dashboard</a></li>
                        <li><a href="/local/create">Manage Events</a></li>
                        <li><a href="/local/students">Manage Students</a></li>
                        <li><a href="/local/organizations">Manage Organizations</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat students-registered">
                            <span>Students Registered</span>
                            <div className="badge">{students.length}</div>
                        </div>
                        <div className="stat organizations">
                            <span>Organizations</span>
                            <div className="badge">{organizations.length}</div>
                        </div>
                    </div>

                    <div className="events-section">
                        <h4>Events Overview</h4>
                        <div className="event-categories">
                            <div className="event-category">
                                <h5>Your Events</h5>
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
                        </div>
                    </div>

                    {selectedEvent && (
                        <div className="event-modal">
                            <div className="modal-content">
                                <span className="close" onClick={handleCloseModal}>
                                    &times;
                                </span>
                                <h2>{selectedEvent.name}</h2>
                                <p>
                                    <strong>Description:</strong>{' '}
                                    {selectedEvent.description || 'N/A'}
                                </p>
                                <p>
                                    <strong>Start Date:</strong>{' '}
                                    {selectedEvent.startDate
                                        ? new Date(selectedEvent.startDate.toDate()).toLocaleString()
                                        : 'N/A'}
                                </p>
                                <p>
                                    <strong>End Date:</strong>{' '}
                                    {selectedEvent.endDate
                                        ? new Date(selectedEvent.endDate.toDate()).toLocaleString()
                                        : 'N/A'}
                                </p>
                                <p>
                                    <strong>Venue:</strong>{' '}
                                    {selectedEvent.venue || 'N/A'}
                                </p>
                                <p><strong>Organizations:</strong></p>
                                <ul>
                                    {selectedEvent.organizations &&
                                        selectedEvent.organizations.length > 0
                                        ? selectedEvent.organizations.map((org, index) => (
                                              <li key={index}>{org}</li>
                                          ))
                                        : 'N/A'}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocalAdminDashboard;
