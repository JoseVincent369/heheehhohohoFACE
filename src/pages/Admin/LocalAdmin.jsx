import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs, updateDoc  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import { Tabs, Tab, Table, Button } from 'react-bootstrap';
import { Pagination } from 'antd';
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
    const [currentPage, setCurrentPage] = useState(1);

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
    
                // Update local state to avoid duplicates
                setEvents((prevEvents) =>
                    prevEvents.map((event) =>
                        event.id === selectedEvent.id ? { ...event, status: newStatus } : event
                    )
                );
    
                // Check for existing events before adding to approved or rejected arrays
                if (newStatus === 'accepted') {
                    setApprovedEvents((prev) => {
                        // Only add if it doesn't already exist
                        if (!prev.some(event => event.id === selectedEvent.id)) {
                            return [...prev, { ...selectedEvent, status: newStatus }];
                        }
                        return prev;
                    });
                    setPendingEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
                } else if (newStatus === 'rejected') {
                    setRejectedEvents((prev) => {
                        // Only add if it doesn't already exist
                        if (!prev.some(event => event.id === selectedEvent.id)) {
                            return [...prev, { ...selectedEvent, status: newStatus }];
                        }
                        return prev;
                    });
                    setPendingEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
                }
    
                handleModalClose();
            } catch (error) {
                console.error('Error updating event status:', error);
            }
        }
    };

    const onPaginationChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="container">
            {error && <p className="error-message">{error}</p>}
            {/* Tabs for Event Categories */}
            <Tabs
                defaultActiveKey="pending"
                id="event-status-tabs"
                className="mb-3"
                style={{ width: '100%' }}
            >
                <Tab eventKey="pending" title="Pending Events">
                    <Table bordered striped hover responsive>
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Venue</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingEvents.map((event) => (
                                <tr key={event.id} onClick={() => handleEventClick(event)}>
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
                    </Table>
                    <Pagination
                        current={currentPage}
                        pageSize={5}
                        total={pendingEvents.length }
                        onChange={onPaginationChange}
                    />
                </Tab>

                <Tab eventKey="accepted" title="Accepted Events">
                    <Table bordered striped hover responsive>
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Venue</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedEvents.map((event) => (
                                <tr key={event.id} onClick={() => handleEventClick(event)}>
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
                    </Table>
                    <Pagination
                        current={currentPage}
                        pageSize={5}
                        total={approvedEvents.length }
                        onChange={onPaginationChange}
                    />
                </Tab>

                <Tab eventKey="rejected" title="Rejected Events">
                    <Table bordered striped hover responsive>
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Venue</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rejectedEvents.map((event) => (
                                <tr key={event.id} onClick={() => handleEventClick(event)}>
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
                    </Table>
                    <Pagination
                        current={currentPage}
                        pageSize={5}
                        total={rejectedEvents.length }
                        onChange={onPaginationChange}
                    />
                </Tab>

                <Tab eventKey="moderators" title="Moderators Events">
                    <Table bordered striped hover responsive >
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Venue</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moderatorEvents.map((event) => (
                                <tr key={event.id} onClick={() => handleEventClick(event)}>
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
                    </Table>
                    <Pagination
                        current={currentPage}
                        pageSize={5}
                        total={moderatorEvents.length }
                        onChange={onPaginationChange}
                    />
                </Tab>
            </Tabs>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                event={selectedEvent}
                onChangeStatus={handleChangeStatus}
            />
        </div>
    );
};

export default LocalAdminDashboard;

