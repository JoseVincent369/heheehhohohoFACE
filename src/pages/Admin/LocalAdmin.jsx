import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs, updateDoc  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import { Tabs, Tab, Button } from 'react-bootstrap';
import { Table, Pagination } from 'antd';
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
    

    // Fetch Admin Events
    useEffect(() => {
        if (!user) return;

        const fetchAdminEvents = query(
            collection(db, 'events'),
            where('adminID', '==', user.uid)
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

    const columns = [
        { title: 'Event Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', render: (text) => new Date(text?.seconds * 1000).toLocaleString() },
        { title: 'End Date', dataIndex: 'endDate', key: 'endDate', render: (text) => new Date(text?.seconds * 1000).toLocaleString() },
        { title: 'Venue', dataIndex: 'venue', key: 'venue' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        {
            title: 'Action', key: 'action', render: (_, event) => (
                <Button onClick={() => handleEventClick(event)}>View Details</Button>
            ),
        },
    ];

    return (
        <div className="container">
            {error && <p className="error-message">{error}</p>}
            {/* Tabs for Event Categories */}
            <Tabs
                defaultActiveKey="pending"
                id="event-status-tabs"
                className="mb-3"
                style={{ width: '100%', padding: 0, margin: 0 }} // Ensure full width, no padding/margin
            >
                <Tab eventKey="pending" title="Pending Events">
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Table
                            columns={columns}
                            dataSource={pendingEvents}
                            rowKey="id"
                            size="small"
                            bordered
                            pagination={{ pageSize: 5 }}
                            style={{ tableLayout: 'auto', width: '70vw' }}
                        />
                    </div>
                </Tab>
    
                <Tab eventKey="accepted" title="Accepted Events">
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Table
                            columns={columns}
                            dataSource={approvedEvents}
                            rowKey="id"
                            size="small"
                            bordered
                            pagination={{ pageSize: 5 }}
                            style={{ tableLayout: 'auto', width: '70vw' }}
                        />

                    </div>
                </Tab>
    
                <Tab eventKey="rejected" title="Rejected Events">
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Table
                            columns={columns}
                            dataSource={rejectedEvents}
                            rowKey="id"
                            size="small"
                            bordered
                            pagination={{ pageSize: 5 }}
                            style={{ tableLayout: 'auto', width: '70vw' }}
                        />

                    </div>
                </Tab>
    
                <Tab eventKey="moderators" title="Moderators Events">
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Table
                            columns={columns}
                            dataSource={moderatorEvents}
                            rowKey="id"
                            size="small"
                            bordered
                            pagination={{ pageSize: 5 }}
                            style={{ tableLayout: 'auto', width: '70vw' }}
                        />

                    </div>
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