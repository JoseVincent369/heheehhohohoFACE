import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './localstyles.css';
import logo from '../../assets/images/nbsc logo.png'; // Ensure correct image path
import Logout from '../Admin/Logout'; // Import Logout component
import ProfileEdit from '../components/ProfileEdit';

const LocalAdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [majors, setMajors] = useState([]);
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
        if (!user) return;

        const fetchEvents = query(collection(db, 'events'), where('createdBy', '==', user.uid));
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
        if (!user) return;

        const fetchStudents = query(collection(db, 'users'), where('role', '==', 'student'));
        const unsubscribeStudents = onSnapshot(fetchStudents, (querySnapshot) => {
            const studentsData = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ id: doc.id, ...doc.data() });
            });
            setStudents(studentsData);
        }, (error) => {
            console.error('Error fetching students: ', error);
        });

        return () => unsubscribeStudents();
    }, [db, user]);

    useEffect(() => {
        if (!user) return;

        const fetchOrganizations = query(collection(db, 'users'), where('organization', '!=', ''));
        const unsubscribeOrganizations = onSnapshot(fetchOrganizations, (querySnapshot) => {
            const organizationsData = new Set();
            querySnapshot.forEach((doc) => {
                organizationsData.add(doc.data().organization);
            });
            setOrganizations(Array.from(organizationsData));
        }, (error) => {
            console.error('Error fetching organizations: ', error);
        });

        return () => unsubscribeOrganizations();
    }, [db, user]);

    useEffect(() => {
        const fetchDepartments = async () => {
            const departmentsQuery = collection(db, 'departments');
            const querySnapshot = await getDocs(departmentsQuery);
            const departmentsData = [];
            querySnapshot.forEach((doc) => {
                departmentsData.push({ id: doc.id, ...doc.data() });
            });
            setDepartments(departmentsData);
        };

        fetchDepartments();
    }, [db]);

    useEffect(() => {
        if (!selectedEvent) return;

        const fetchCourses = async () => {
            const departmentRef = doc(db, 'departments', selectedEvent.departmentId);
            const coursesQuery = collection(departmentRef, 'courses');
            const querySnapshot = await getDocs(coursesQuery);
            const coursesData = [];
            querySnapshot.forEach((doc) => {
                coursesData.push({ id: doc.id, ...doc.data() });
            });
            setCourses(coursesData);
        };

        fetchCourses();
    }, [db, selectedEvent]);

    useEffect(() => {
        if (!selectedEvent) return;

        const fetchMajors = async () => {
            const courseRef = doc(db, 'departments', selectedEvent.departmentId, 'courses', selectedEvent.courseId);
            const majorsQuery = collection(courseRef, 'majors');
            const querySnapshot = await getDocs(majorsQuery);
            const majorsData = [];
            querySnapshot.forEach((doc) => {
                majorsData.push({ id: doc.id, ...doc.data() });
            });
            setMajors(majorsData);
        };

        fetchMajors();
    }, [db, selectedEvent]);

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
        <div className="admin-dashboard">
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
                    <div className="admin">{user ? user.displayName : 'Admin'}</div>
                    <Logout />
                </div>
            </header>

            <div className="main-content">
                <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <ul>
                        <li><a href="/localadmin">Dashboard</a></li>
                        <li><a href="/local/create">Manage Events</a></li>
                        <li><a href="/local/createMod">Create Moderator </a></li>
                        <li><a href="/local/organizations">Manage Organizations</a></li>
                    </ul>
                </nav>

                <div className="content">
                    <div className="event-stats">
                        <div className="stat ongoing-events">
                            <span>Events</span>
                            <div className="badge">{events.length}</div>
                        </div>
                        <div className="stat students-registered">
                            <span>Students Registered</span>
                            <div className="badge">{students.length}</div>
                        </div>
                        <div className="stat organizations">
                            <span>Organizations</span>
                            <div className="badge">{organizations.length}</div>
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
                        </div>
                    </div>

                    {selectedEvent && (
                        <div className="event-modal">
                            <div className="event-modal-content">
                                <span className="event-modal-close" onClick={handleCloseModal}>
                                    &times;
                                </span>
                                <h2>{selectedEvent.name}</h2>
                                <p><strong>Description:</strong> {selectedEvent.description || 'N/A'}</p>
                                <p><strong>Start Date:</strong> {selectedEvent.startDate
                                    ? new Date(selectedEvent.startDate.toDate()).toLocaleString()
                                    : 'N/A'}
                                </p>
                                <p><strong>End Date:</strong> {selectedEvent.endDate
                                    ? new Date(selectedEvent.endDate.toDate()).toLocaleString()
                                    : 'N/A'}
                                </p>
                                <p><strong>Venue:</strong> {selectedEvent.venue || 'N/A'}</p>
                                <p><strong>Organizations:</strong></p>
                                <ul>
                                    {selectedEvent.organizations && selectedEvent.organizations.length > 0
                                        ? selectedEvent.organizations.map((org, index) => (
                                            <li key={index}>{org}</li>
                                        ))
                                        : 'N/A'}
                                </ul>
                                <p><strong>Department:</strong> {departments.find(dep => dep.id === selectedEvent.departmentId)?.name || 'N/A'}</p>
                                <p><strong>Courses:</strong></p>
                                <ul>
                                    {courses.map((course) => (
                                        <li key={course.id}>{course.name}</li>
                                    ))}
                                </ul>
                                <p><strong>Majors:</strong></p>
                                <ul>
                                    {majors.map((major) => (
                                        <li key={major.id}>{major.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {showProfileEdit && (
                        <ProfileEdit
                            user={user}
                            onClose={handleProfileEditClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocalAdminDashboard;
