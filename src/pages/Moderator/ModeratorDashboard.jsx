import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, addDoc, setDoc, doc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../../firebaseutil/firebase_main';
import './styles.css';

const ModeratorDashboard = () => {
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [yearLevels, setYearLevels] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [cameraEnabled, setCameraEnabled] = useState(false);

    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    useEffect(() => {
        // Fetch User Details
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        // Fetch Organizations and Year Levels
        const fetchOrganizationsAndYearLevels = async () => {
            const orgsSnapshot = await getDocs(collection(db, 'organizations'));
            const orgs = orgsSnapshot.docs.map(doc => doc.data().name);
            setOrganizations(orgs);

            const yearLevelsSnapshot = await getDocs(collection(db, 'yearLevels'));
            const years = yearLevelsSnapshot.docs.map(doc => doc.data().level);
            setYearLevels(years);
        };

        fetchOrganizationsAndYearLevels();
    }, [db]);

    const handleLogout = () => {
        signOut(auth).catch((error) => {
            console.error('Error logging out: ', error);
        });
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const eventData = {
                name: eventName,
                description: eventDescription,
                startDate: eventStartDate,
                endDate: eventEndDate,
                organization: selectedOrg,
                yearLevel: selectedYearLevel,
                createdBy: user.uid,
                attendees: [] // Initialize an empty array for attendees
            };

            const eventRef = await addDoc(collection(db, 'events'), eventData);
            console.log('Event created with ID:', eventRef.id);

            // Fetch users for attendance
            const usersQuery = query(
                collection(db, 'users'),
                where('organization', '==', selectedOrg),
                where('yearLevel', '==', selectedYearLevel)
            );

            const usersSnapshot = await getDocs(usersQuery);
            const attendees = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Store the users for attendance tracking
            await setDoc(doc(db, 'events', eventRef.id), { attendees }, { merge: true });

            alert('Event created and attendees are set!');
        } catch (error) {
            console.error('Error creating event:', error);
            alert(`Failed to create event: ${error.message}`);
        }
    };

    const handleStartAttendance = () => {
        setCameraEnabled(true);
    };

    const handleStopAttendance = () => {
        setCameraEnabled(false);
        // Add code to process attendance data
    };

    return (
        <div className="moderator-dashboard">
            <header className="navbar">
                <div className="logo">Moderator Dashboard</div>
                <div className="user-info">
                    <div className="user">{user ? user.displayName : 'Moderator'}</div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar`}>
                    <ul>
                        <li><a href="/moderator/dashboard">Dashboard</a></li>
                        <li><a href="/moderator/events">Event Management</a></li>
                        <li><a href="/moderator/attendance">Attendance Tracking</a></li>
                        <li><a href="/">Settings</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="stats">
                        <div className="stat">
                            <h4>Total Events</h4>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat">
                            <h4>Events Today</h4>
                            <div className="badge">{events.filter(event => new Date(event.startDate).toDateString() === new Date().toDateString()).length}</div>
                        </div>
                    </div>

                    <div className="event-creation">
                        <h2>Create Event</h2>
                        <form onSubmit={handleCreateEvent}>
                            <input
                                type="text"
                                placeholder="Event Name"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                required
                            />
                            <textarea
                                placeholder="Event Description"
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                required
                            />
                            <input
                                type="datetime-local"
                                value={eventStartDate}
                                onChange={(e) => setEventStartDate(e.target.value)}
                                required
                            />
                            <input
                                type="datetime-local"
                                value={eventEndDate}
                                onChange={(e) => setEventEndDate(e.target.value)}
                                required
                            />
                            <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} required>
                                <option value="">Select Organization</option>
                                {organizations.map((org, index) => (
                                    <option key={index} value={org}>
                                        {org}
                                    </option>
                                ))}
                            </select>
                            <select value={selectedYearLevel} onChange={(e) => setSelectedYearLevel(e.target.value)} required>
                                <option value="">Select Year Level</option>
                                {yearLevels.map((level, index) => (
                                    <option key={index} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                            <button type="submit">Create Event</button>
                        </form>
                    </div>

                    <div className="attendance-section">
                        <h2>Attendance</h2>
                        {cameraEnabled ? (
                            <div>
                                <button onClick={handleStopAttendance}>Stop Attendance</button>
                                {/* Add camera setup and facial recognition components here */}
                            </div>
                        ) : (
                            <button onClick={handleStartAttendance}>Start Attendance</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModeratorDashboard;
