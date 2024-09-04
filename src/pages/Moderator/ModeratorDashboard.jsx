import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './moderatorstyles.css';
import logo from '../../assets/images/nbsc logo.png'; // Ensure correct image path
import Logout from '../Admin/Logout'; // Import Logout component
import ProfileEdit from '../components/ProfileEdit';

const ModeratorDashboard = () => {
    const [events, setEvents] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [todaysEvents, setTodaysEvents] = useState([]);
    const [adminAssignedEvents, setAdminAssignedEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (!user || !user.organization) return;

        const fetchEvents = query(collection(db, 'events'), where('organizations', 'array-contains', user.organization));
        const unsubscribeEvents = onSnapshot(fetchEvents, (querySnapshot) => {
            const eventsData = [];
            querySnapshot.forEach((doc) => {
                eventsData.push({ id: doc.id, ...doc.data() });
            });
            setEvents(eventsData);
        }, (error) => {
            console.error('Error fetching events: ', error);
        });

        return () => unsubscribeEvents();
    }, [db, user]);

    useEffect(() => {
        if (!user || !user.organization) return;

        const fetchPendingApprovals = query(collection(db, 'events'), where('organizations', 'array-contains', user.organization), where('status', '==', 'pending'));
        const unsubscribePendingApprovals = onSnapshot(fetchPendingApprovals, (querySnapshot) => {
            const pendingApprovalsData = [];
            querySnapshot.forEach((doc) => {
                pendingApprovalsData.push({ id: doc.id, ...doc.data() });
            });
            setPendingApprovals(pendingApprovalsData);
        }, (error) => {
            console.error('Error fetching pending approvals: ', error);
        });

        return () => unsubscribePendingApprovals();
    }, [db, user]);

    useEffect(() => {
        if (!user || !user.organization) return;

        const fetchOfficers = query(collection(db, 'users'), where('role', '==', 'officer'), where('organization', '==', user.organization));
        const unsubscribeOfficers = onSnapshot(fetchOfficers, (querySnapshot) => {
            const officersData = [];
            querySnapshot.forEach((doc) => {
                officersData.push({ id: doc.id, ...doc.data() });
            });
            setOfficers(officersData);
        }, (error) => {
            console.error('Error fetching officers: ', error);
        });

        return () => unsubscribeOfficers();
    }, [db, user]);

    useEffect(() => {
        if (!user || !user.organization) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const fetchTodaysEvents = query(collection(db, 'events'), where('organizations', 'array-contains', user.organization), where('startDate', '<=', today), where('endDate', '>=', today));
        const unsubscribeTodaysEvents = onSnapshot(fetchTodaysEvents, (querySnapshot) => {
            const todaysEventsData = [];
            querySnapshot.forEach((doc) => {
                todaysEventsData.push({ id: doc.id, ...doc.data() });
            });
            setTodaysEvents(todaysEventsData);
        }, (error) => {
            console.error('Error fetching today\'s events: ', error);
        });

        return () => unsubscribeTodaysEvents();
    }, [db, user]);

    useEffect(() => {
        if (!user || !user.organization) return;

        // Fetch admin-assigned events based on the organization
        const fetchAdminAssignedEvents = query(collection(db, 'events'), where('organizations', 'array-contains', user.organization), where('createdByRole', '==', 'admin'));
        const unsubscribeAdminAssignedEvents = onSnapshot(fetchAdminAssignedEvents, (querySnapshot) => {
            const adminAssignedEventsData = [];
            querySnapshot.forEach((doc) => {
                adminAssignedEventsData.push({ id: doc.id, ...doc.data() });
            });
            setAdminAssignedEvents(adminAssignedEventsData);
        }, (error) => {
            console.error('Error fetching admin assigned events: ', error);
        });

        return () => unsubscribeAdminAssignedEvents();
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

    const handleProfileEdit = () => {
        setShowProfileEdit(true);
    };

    const handleProfileEditClose = () => {
        setShowProfileEdit(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="moderator-dashboard">
            <header className="navbar">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="header-logo" />
                    <div className="logo-text">E-Attend Attendance System</div>
                </div>
                <div className="user-info">
                    <div className="profile-icon" onClick={handleProfileEdit}>
                        <img
                            src={user?.photoURL || 'path/to/default/profile-icon.png'}
                            alt="Profile"
                            className="profile-icon-image"
                        />
                    </div>
                    <div className="moderator">{user ? user.displayName : 'Moderator'}</div>
                    <Logout />
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <ul>
                        <li><a href="/moderator">Dashboard</a></li>
                        <li><a href="/moderator/create">Create Event</a></li>
                        <li><a href="/moderator/track">Track Attendance</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="event-stats">
                        <div className="stat upcoming-events">
                            <span>Upcoming Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat pending-approvals">
                            <span>Pending Approvals</span>
                            <div className="badge">{pendingApprovals.length}</div>
                        </div>
                        <div className="stat active-officers">
                            <span>Active Officers</span>
                            <div className="badge">{officers.length}</div>
                        </div>
                        <div className="stat todays-events">
                            <span>Today's Events</span>
                            <div className="badge">{todaysEvents.length}</div>
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
                                <h5>Admin-Assigned Events</h5>
                                <ul className="event-list">
                                    {adminAssignedEvents.map((event) => (
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
                                <span className="close" onClick={handleCloseModal}>&times;</span>
                                <h2>{selectedEvent.name}</h2>
                                <p>{selectedEvent.description}</p>
                                <p><strong>Start Date:</strong> {selectedEvent.startDate}</p>
                                <p><strong>End Date:</strong> {selectedEvent.endDate}</p>
                                <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                                <p><strong>Status:</strong> {selectedEvent.status}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showProfileEdit && <ProfileEdit onClose={handleProfileEditClose} />}
        </div>
    );
};

export default ModeratorDashboard;
