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
    const [adminsCount, setAdminsCount] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState(null);

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
        // Real-Time Count for Students and Admins
        const fetchCounts = () => {
            // Query for Students
            const studentsQuery = query(collection(db, 'users'), where('role', '==', 'user'));
            const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
                setStudentsCount(querySnapshot.size);
            });

            // Query for Admins
            const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
            const unsubscribeAdmins = onSnapshot(adminsQuery, (querySnapshot) => {
                setAdminsCount(querySnapshot.size);
            });

            return () => {
                unsubscribeStudents();
                unsubscribeAdmins();
            };
        };

        fetchCounts();
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

    // Filter Events
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const ongoingEvents = events.filter(
        (event) =>
            new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );

    const todaysEvents = events.filter(
        (event) =>
            new Date(event.startDate) >= todayStart && new Date(event.startDate) <= todayEnd
    );

    const futureEvents = events.filter(
        (event) => new Date(event.startDate) > now
    );

    const currentEvents = events.filter(
        (event) => new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );

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
                        <li><a href="/admin/admins">Admin Management</a></li>
                        <li><a href="/signup">Student Registration</a></li>
                        <li><a href="/admin/StudentManage">Student Manage</a></li>
                        <li><a href="/admin/addOrg">Organization Register</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat students-attended">
                            <span>Students Registered</span>
                            <div className="badge">{studentsCount}</div>
                        </div>
                        <div className="stat admins">
                            <span>Admins</span>
                            <div className="badge">{adminsCount}</div>
                        </div>
                    </div>

                    <div className="events-section">
                        <h4>Activities Overview</h4>
                        <div className="event-categories">
                            <div className="event-category">
                                <h5>Ongoing Events</h5>
                                <ul className="event-list">
                                    {ongoingEvents.map((event) => (
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

                            <div className="event-category">
                                <h5>Today's Events</h5>
                                <ul className="event-list">
                                    {todaysEvents.map((event) => (
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

                            <div className="event-category">
                                <h5>Future Events</h5>
                                <ul className="event-list">
                                    {futureEvents.map((event) => (
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

                            <div className="event-category">
                                <h5>All Current Events</h5>
                                <ul className="event-list">
                                    {currentEvents.map((event) => (
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
                                        ? new Date(selectedEvent.startDate).toLocaleString()
                                        : 'N/A'}
                                </p>
                                <p>
                                    <strong>End Date:</strong>{' '}
                                    {selectedEvent.endDate
                                        ? new Date(selectedEvent.endDate).toLocaleString()
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

export default AdminDashboard;
