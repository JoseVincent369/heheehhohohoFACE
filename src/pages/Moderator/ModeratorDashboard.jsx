import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, 
    where, getDoc, doc, getDocs, updateDoc  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import LoadingScreen from '../components/LoadingScreen';
import Select from 'react-select';
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
    const [adminId, setAdminId] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    const [selectedOfficers, setSelectedOfficers] = useState([]);
    
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
            where('moderators', 'array-contains', user.uid) // Check if the moderator's ID is in the 'moderators' array
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
    


    
    useEffect(() => {
        const fetchOfficers = async (adminId) => {
            try {
                const officersQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'officer'), // Assuming 'role' field identifies officers
                    where('adminId', '==', adminId)
                );
                const officersSnapshot = await getDocs(officersQuery);
                const officersList = officersSnapshot.docs.map((doc) => ({
                    value: doc.id, // Use officer's ID as the value
                    label: doc.data().fullName || 'Unnamed Officer', // Use officer's full name or a fallback label
                    ...doc.data(),
                }));
                setOfficers(officersList);
            } catch (error) {
                console.error('Error fetching officers:', error);
                setError('Error fetching officers.');
            }
        };
    
        if (adminId) {
            fetchOfficers(adminId); // Fetch officers based on the adminId
        }
    }, [db, adminId]);
    


    const handleOfficerChange = (event) => {
        setSelectedOfficerId(event.target.value);
    };
    
    const assignOfficer = async () => {
        if (selectedEvent && selectedOfficerId) {
            try {
                await updateDoc(doc(db, 'events', selectedEvent.id), {
                    officerId: selectedOfficerId,
                });
                alert('Officer assigned successfully!');
                handleModalClose(); // Close modal after assignment
            } catch (error) {
                console.error('Error assigning officer:', error);
                alert('Error assigning officer.');
            }
        }
    };
    
    const handleOfficerSelect = (selectedOptions) => {
        setSelectedOfficers(selectedOptions);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const saveOfficersToEvent = () => {
        // Save selected officers to the event in the database
        if (selectedEvent && selectedOfficers.length > 0) {
            const eventRef = doc(db, 'events', selectedEvent.id);
            const officerIds = selectedOfficers.map(officer => officer.value);
            updateDoc(eventRef, {
                officers: officerIds
            }).then(() => {
                alert('Officers assigned successfully.');
                setIsModalOpen(false);
            }).catch((error) => {
                console.error('Error assigning officers:', error);
                setError('Error assigning officers.');
            });
        }
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

                                {/* Multi-select dropdown for officers */}
                                <label htmlFor="officerSelect">Select Officers:</label>
                                <Select
                                    id="officerSelect"
                                    isMulti
                                    options={officers}
                                    value={selectedOfficers}
                                    onChange={handleOfficerSelect}
                                />
                                
                                <button onClick={saveOfficersToEvent}>Assign Officers</button>
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
