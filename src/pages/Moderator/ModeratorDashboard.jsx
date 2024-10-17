import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, 
    where, getDoc, doc, getDocs, updateDoc  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import LoadingScreen from '../components/LoadingScreen';
import './moderatorStyles.css';

import { Select } from 'antd';
const { Option } = Select; // Destructure Option from Select


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
    const [usersInCharge, setUsersInCharge] = useState([]);
    const [selectedUserInChargeId, setSelectedUserInChargeId] = useState('');
    const [selectedUsersInCharge, setSelectedUsersInCharge] = useState([]);
    const [userInCharge, setUserInCharge] = useState(null); 
    
    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);
    

    // Authentication
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser); // Set the logged-in user
                setLoading(false);
            } else {
                setUser(null); // Handle logged-out state
                setLoading(false);
            }
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
            where('createdBy', '==', user.uid)  // Check if the event was created by the current user
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
    

    const fetchEligibleUsers = async () => {
        try {
            // Ensure user is authenticated and available
            if (!user) {
                console.error("No user is logged in.");
                return; // Exit if no user is authenticated
            }
    
            // Get the current moderator's information
            const moderatorRef = doc(db, "users", user.uid);
            const moderatorSnapshot = await getDoc(moderatorRef);
    
            // Check if moderator data exists
            if (!moderatorSnapshot.exists()) {
                console.error("Moderator data not found");
                return; // Exit if moderator data is not found
            }
    
            const moderatorData = moderatorSnapshot.data();
            console.log("Moderator's data:", moderatorData); // Optional: Log moderator's data for debugging
    
            // Define the base query to filter by 'user' role
            const q = query(collection(db, "users"), where("role", "==", "user"));
    
            // Fetch matching users
            const snapshot = await getDocs(q);
            const eligibleUsers = snapshot.docs.map(doc => ({
                value: doc.id, // Set the value to user ID
                label: `${doc.data().fname} ${doc.data().lname}`, // Full name for the dropdown label
                ...doc.data()
            }));
    
            // Set eligible users to the state
            setUsersInCharge(eligibleUsers);
    
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };
    
    
    
    
    

    
// Fetch users based on userInCharge criteria
useEffect(() => {
    const fetchUsersInCharge = async () => {
        if (!user) return;

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const filteredUsers = usersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => 
                    user.role === 'user' &&
                    user.department === userInCharge.department &&
                    user.organization && 
                    user.organization.some(org => userInCharge.organization.includes(org))
                );

            setUsersInCharge(filteredUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users. Please try again later.');
        }
    };

    fetchUsersInCharge();
}, [userInCharge]); 
  
    
    
    const assignUserInCharge = async () => {
    // Check if both selectedEvent and selectedUserInChargeId are defined
    if (selectedEvent && selectedUsersInCharge) {
        try {
            console.log("Assigning user in charge:", selectedUsersInCharge, "to event:", selectedEvent.id); // Debugging line
            
            // Update the event document in Firestore
            await updateDoc(doc(db, 'events', selectedEvent.id), {
                userInCharge: selectedUsersInCharge, // Assuming this is where the user in charge should be stored
            });
    
            alert('User in charge assigned successfully!');
            handleModalClose(); // Close modal after assignment
        } catch (error) {
            console.error('Error assigning user in charge:', error);
            alert('Error assigning user in charge.');
        }
    } else {
        console.error("Either selectedEvent or selectedUserInChargeId is not defined.");
        alert('Please select an event and a user to assign.');
    }
};

    

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        fetchEligibleUsers();
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedUsersInCharge([]);
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

            <h4>Assign User in Charge</h4>
            <Select
                style={{ width: '100%' }}
                mode="multiple"
                showSearch
                allowClear
                placeholder="Select User(s) in Charge"
                value={selectedUsersInCharge.map(userId => usersInCharge.find(user => user.value === userId))}
                onChange={(selectedValues) => {
                    setSelectedUsersInCharge(selectedValues);
                }}
                filterOption={(input, option) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                }
            >
                {usersInCharge.map(user => (
                    <Option key={user.value} value={user.value}>
                        {user.label}
                    </Option>
                ))}
            </Select>

            {/* Conditionally render the assign button */}
            {selectedEvent.status === 'accepted' && (
                <button onClick={assignUserInCharge}>Assign</button>
            )}

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
