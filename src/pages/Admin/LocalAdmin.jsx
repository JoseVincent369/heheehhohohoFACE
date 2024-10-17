import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs, updateDoc  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import LoadingScreen from '../components/LoadingScreen';
import Modal from '../components/Modal'; 
import './localstyles.css';

const LocalAdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [moderatorEvents, setModeratorEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rejectedEvents, setRejectedEvents] = useState([]);
    const [moderators, setModerators] = useState([]);

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
    
    setPersistence(auth, browserSessionPersistence).then(() => {
        // Now any authentication state will persist only for the session
    }).catch((error) => {
        console.error("Error setting persistence:", error);
    });
    // Fetch Admin Events
    useEffect(() => {
        if (!user) return;

        const fetchAdminEvents = query(
            collection(db, 'events'),
            where('createdBy', '==', user.uid)
        );

        const unsubscribeAdminEvents = onSnapshot(
            fetchAdminEvents,
            (querySnapshot) => {
                const adminEventsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setEvents(adminEventsData);
                setPendingEvents(adminEventsData.filter((event) => event.status === 'pending'));
                setApprovedEvents(adminEventsData.filter((event) => event.status === 'accepted'));
                setRejectedEvents(adminEventsData.filter((event) => event.status === 'rejected'));
                setEventsLoading(false);
            },
            (error) => {
                console.error('Error fetching admin events:', error);
                setError('Error fetching admin events.');
                setEventsLoading(false);
            }
        );

        return () => unsubscribeAdminEvents();
    }, [db, user]);

    // Fetch Moderators created by the current Admin
    useEffect(() => {
        if (!user) return;

        const fetchModeratorsAndEvents = async () => {
            try {
                // Fetch Moderators created by the current admin
                const moderatorsQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'moderator'),
                    where('createdBy', '==', user.uid) // Only fetch moderators created by the current admin
                );
                const moderatorsSnapshot = await getDocs(moderatorsQuery);
                const moderatorData = moderatorsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Fetch events for each moderator
                const allModeratorEventsPromises = moderatorData.map(async (moderator) => {
                    const eventsQuery = query(
                        collection(db, 'events'),
                        where('createdBy', '==', moderator.id)
                    );
                    const eventsSnapshot = await getDocs(eventsQuery);
                    return eventsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        moderatorName: moderator.fullName, // Assuming fullName is the field for the moderator's name
                        moderatorEmail: moderator.email
                    }));
                });

                const allModeratorEvents = await Promise.all(allModeratorEventsPromises);
                const flattenedModeratorEvents = allModeratorEvents.flat();

                // Set the moderator events
                setModeratorEvents(flattenedModeratorEvents);
                setPendingEvents((prev) => prev.concat(flattenedModeratorEvents.filter(event => event.status === 'pending')));
                setApprovedEvents((prev) => prev.concat(flattenedModeratorEvents.filter(event => event.status === 'accepted')));
                setRejectedEvents((prev) => prev.concat(flattenedModeratorEvents.filter(event => event.status === 'rejected')));
            } catch (error) {
                console.error('Error fetching moderators and their events:', error);
                setError('Failed to fetch moderators and their events.');
            }
            setEventsLoading(false);
        };

        fetchModeratorsAndEvents();
    }, [db, user]);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };


    const getUserEmailsForEvent = async (event) => {
        const emails = [];
        try {
            const userQuery = query(
                collection(db, 'users'), // Adjust 'users' to your collection name
                where('organization', 'in', event.organizations),
                where('course', 'in', event.courses),
                where('major', 'in', event.majors),
                where('yearLevel', 'in', event.yearLevels)
            );
    
            const querySnapshot = await getDocs(userQuery);
            querySnapshot.forEach((doc) => {
                emails.push(doc.data().email);
            });
        } catch (error) {
            console.error('Error fetching user emails:', error);
        }
        return emails;
    };
    

    const handleChangeStatus = async (newStatus) => {
        if (selectedEvent) {
            const eventDoc = doc(db, 'events', selectedEvent.id);

            try {
                // Update the status in Firestore
                await updateDoc(eventDoc, { status: newStatus });

                // Update local state
                setEvents((prevEvents) =>
                    prevEvents.map((event) =>
                        event.id === selectedEvent.id ? { ...event, status: newStatus } : event
                    )
                );

                if (newStatus === 'accepted') {
                    setApprovedEvents((prev) => [...prev, { ...selectedEvent, status: newStatus }]);
                    setPendingEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
                } else if (newStatus === 'rejected') {
                    setRejectedEvents((prev) => [...prev, { ...selectedEvent, status: newStatus }]);
                    setPendingEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
                }

                handleModalClose();
            } catch (error) {
                console.error('Error updating event status:', error);
            }
        }
    };

    if (loading) {
        return <LoadingScreen />; // Show loading screen for authentication
    }
    
    if (eventsLoading) {
        return <LoadingScreen />; // Show loading screen for events
    }


    return (
        <div className="admin-dashboard">
            <div className="main-content">
                <div className="content">
                    {error && <p className="error-message">{error}</p>}

                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Total Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat pending-events">
                            <span>Pending Events</span>
                            <div className="badge">{pendingEvents.length}</div>
                        </div>
                        <div className="stat approved-events">
                            <span>Approved Events</span>
                            <div className="badge">{approvedEvents.length}</div>
                        </div>
                    </div>

                    {/* Pending Events Table */}
<h5>Pending Events</h5>
{eventsLoading ? (
    <p>Loading Pending events...</p>
) : pendingEvents.length === 0 ? (
    <p>No Pending events at the moment.</p>
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
                <th>Event Action Phase</th>
                <th>View Details</th>
            </tr>
        </thead>
        <tbody>
    {pendingEvents.map((event) => {
        const currentTime = Date.now();
        const startTime = new Date(event.startDate?.seconds * 1000).getTime();
        const endTime = new Date(event.endDate?.seconds * 1000).getTime();
        const eventPhase = (currentTime >= startTime && currentTime <= endTime) ? 'Ongoing' : 'Ended';

        return (
            <tr key={event.id} onClick={() => handleEventClick(event)}>
                <td>{event.name}</td>
                <td>{event.description || 'N/A'}</td>
                <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                <td>{event.venue || 'N/A'}</td>
                <td>{event.status || 'N/A'}</td>
                <td>{eventPhase}</td>
                <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
            </tr>
        );
    })}
</tbody>

    </table>
)}






                    {/* Moderator Events */}

<h5>Moderator Events</h5>
{eventsLoading ? (
    <p>Loading Moderator events...</p>
) : moderatorEvents.length === 0 ? (
    <p>No Moderator events at the moment.</p>
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
                <th>Event Action Phase</th>
                <th>View Details</th>
            </tr>
        </thead>
        <tbody>
            {moderatorEvents.map((event, index) => {
                const currentTime = Date.now();
                const startTime = new Date(event.startDate?.seconds * 1000).getTime();
                const endTime = new Date(event.endDate?.seconds * 1000).getTime();
                const eventPhase = (currentTime >= startTime && currentTime <= endTime) ? 'Ongoing' : 'Ended';

                return (
                    <tr key={`${event.id}-${index}`} onClick={() => handleEventClick(event)}>
                        <td>{event.name}</td>
                        <td>{event.description || 'N/A'}</td>
                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{event.venue || 'N/A'}</td>
                        <td>{event.status || 'N/A'}</td>
                        <td>{eventPhase}</td>
                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                    </tr>
                );
            })}
        </tbody>
    </table>
)}


{/* Approved Events Table */}
<h5>Approved Events</h5>
{eventsLoading ? (
    <p>Loading approved events...</p>
) : approvedEvents.length === 0 ? (
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
                <th>Event Action Phase</th>
                <th>View Details</th>
            </tr>
        </thead>
        <tbody>
            {approvedEvents.map((event, index) => {
                const currentTime = Date.now();
                const startTime = new Date(event.startDate?.seconds * 1000).getTime();
                const endTime = new Date(event.endDate?.seconds * 1000).getTime();
                const eventPhase = (currentTime >= startTime && currentTime <= endTime) ? 'Ongoing' : 'Ended';

                return (
                    <tr key={`${event.id}-${index}`} onClick={() => handleEventClick(event)}>
                        <td>{event.name}</td>
                        <td>{event.description || 'N/A'}</td>
                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{event.venue || 'N/A'}</td>
                        <td>{event.status || 'N/A'}</td>
                        <td>{eventPhase}</td>
                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                    </tr>
                );
            })}
        </tbody>
    </table>
)}




{/* Rejected Events Table */}
<h5>Rejected Events</h5>
{eventsLoading ? (
    <p>Loading Rejected events...</p>
) : rejectedEvents.length === 0 ? (
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
                <th>Event Action Phase</th>
                <th>View Details</th>
            </tr>
        </thead>
        <tbody>
            {rejectedEvents.map((event, index) => {
                const currentTime = Date.now();
                const startTime = new Date(event.startDate?.seconds * 1000).getTime();
                const endTime = new Date(event.endDate?.seconds * 1000).getTime();
                const eventPhase = (currentTime >= startTime && currentTime <= endTime) ? 'Ongoing' : 'Ended';

                return (
                    <tr key={`${event.id}-${index}`} onClick={() => handleEventClick(event)}>
                        <td>{event.name}</td>
                        <td>{event.description || 'N/A'}</td>
                        <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</td>
                        <td>{event.venue || 'N/A'}</td>
                        <td>{event.status || 'N/A'}</td>
                        <td>{eventPhase}</td>
                        <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                    </tr>
                );
            })}
        </tbody>
    </table>
)}


                    <Modal 
                        isOpen={isModalOpen} 
                        onClose={handleModalClose} 
                        event={selectedEvent} 
                        onChangeStatus={handleChangeStatus} 
                        
                    />
                </div>
            </div>
        </div>
    );
};

export default LocalAdminDashboard;
