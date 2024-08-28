import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../../firebaseutil/firebase_main';
import './styles.css';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [selectedOrg, setSelectedOrg] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [yearLevels, setYearLevels] = useState([]);
    const [user, setUser] = useState(null);

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
        // Fetch Existing Events
        const fetchEvents = () => {
            const q = query(collection(db, 'events'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const eventsData = [];
                querySnapshot.forEach((doc) => {
                    eventsData.push({ id: doc.id, ...doc.data() });
                });
                setEvents(eventsData);
            });

            return () => unsubscribe();
        };

        fetchEvents();
    }, [db]);

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
                attendees: []
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

    return (
        <div className="event-management">
            <header className="navbar">
                <div className="logo">Event Management</div>
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
                                <option key={index} value={org}>{org}</option>
                            ))}
                        </select>
                        <select value={selectedYearLevel} onChange={(e) => setSelectedYearLevel(e.target.value)} required>
                            <option value="">Select Year Level</option>
                            {yearLevels.map((level, index) => (
                                <option key={index} value={level}>{level}</option>
                            ))}
                        </select>
                        <button type="submit">Create Event</button>
                    </form>

                    <h2>Existing Events</h2>
                    <ul>
                        {events.map(event => (
                            <li key={event.id}>
                                <h3>{event.name}</h3>
                                <p>{event.description}</p>
                                <p><strong>Start Date:</strong> {new Date(event.startDate).toLocaleString()}</p>
                                <p><strong>End Date:</strong> {new Date(event.endDate).toLocaleString()}</p>
                                <p><strong>Organization:</strong> {event.organization}</p>
                                <p><strong>Year Level:</strong> {event.yearLevel}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EventManagement;
