import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import LoadingScreen from '../components/LoadingScreen';
import './moderatorStyles.css';

const ModeratorDashboard = () => {
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [rejectedEvents, setRejectedEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);

    // Authentication
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                setUser(null); // Handle logged out state
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    setPersistence(auth, browserSessionPersistence)
        .then(() => {
            // Now any authentication state will persist only for the session
        })
        .catch((error) => {
            console.error("Error setting persistence:", error);
        });

    // Fetch Approved, Rejected, and Pending Events
    useEffect(() => {
        if (!user) return;

        const fetchEvents = query(
            collection(db, 'events'),
            where('createdBy', '==', user.uid) // Fetch events created by the current moderator
        );

        const unsubscribeEvents = onSnapshot(
            fetchEvents,
            (querySnapshot) => {
                const eventsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                console.log("Fetched Events Data:", eventsData); // Debugging line
                setApprovedEvents(eventsData.filter((event) => event.status === 'accepted'));
                setRejectedEvents(eventsData.filter((event) => event.status === 'rejected'));
                setPendingEvents(eventsData.filter((event) => event.status === 'pending'));
                setEventsLoading(false);
            },
            (error) => {
                console.error('Error fetching events:', error);
                setError('Error fetching events.');
                setEventsLoading(false);
            }
        );

        return () => unsubscribeEvents();
    }, [db, user]);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    if (loading) {
        return <LoadingScreen />; // Show loading screen for authentication
    }

    if (eventsLoading) {
        return <LoadingScreen />; // Show loading screen for events
    }

    return (
        <div className="moderator-dashboard">
            <div className="main-content">
                <div className="content">
                    {error && <p className="error-message">{error}</p>}

                    {/* Approved Events Table */}
                    <h5>Approved Events</h5>
                    {approvedEvents.length === 0 ? (
                        <p>No approved events at the moment.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                    <th>View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedEvents.map((event, index) => (
                                    <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                                        <td>{event.name}</td>
                                        <td>{event.description || 'N/A'}</td>
                                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{event.venue || 'N/A'}</td>
                                        <td>{event.status || 'N/A'}</td>
                                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Rejected Events Table */}
                    <h5>Rejected Events</h5>
                    {rejectedEvents.length === 0 ? (
                        <p>No rejected events at the moment.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                    <th>View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rejectedEvents.map((event, index) => (
                                    <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                                        <td>{event.name}</td>
                                        <td>{event.description || 'N/A'}</td>
                                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{event.venue || 'N/A'}</td>
                                        <td>{event.status || 'N/A'}</td>
                                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pending Events Table */}
                    <h5>Pending Events</h5>
                    {pendingEvents.length === 0 ? (
                        <p>No pending events at the moment.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                    <th>View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingEvents.map((event, index) => (
                                    <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                                        <td>{event.name}</td>
                                        <td>{event.description || 'N/A'}</td>
                                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                                        <td>{event.venue || 'N/A'}</td>
                                        <td>{event.status || 'N/A'}</td>
                                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Modal for Event Details */}
                    {isModalOpen && selectedEvent && (
                        <div className="modal">
                            <div className="modal-content">
                                <h3>{selectedEvent.name}</h3>
                                <p><strong>Description:</strong> {selectedEvent.description || 'N/A'}</p>
                                <p><strong>Start Date:</strong> {new Date(selectedEvent.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</p>
                                <p><strong>End Date:</strong> {new Date(selectedEvent.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</p>
                                <p><strong>Venue:</strong> {selectedEvent.venue || 'N/A'}</p>
                                <p><strong>Status:</strong> {selectedEvent.status || 'N/A'}</p>
                                <button onClick={handleModalClose}>Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModeratorDashboard;
