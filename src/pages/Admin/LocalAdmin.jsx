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
        const fetchOrganizations = async () => {
            const organizationsQuery = collection(db, 'organizations');
            const querySnapshot = await getDocs(organizationsQuery);
            const organizationsData = [];
            querySnapshot.forEach((doc) => {
                organizationsData.push({ id: doc.id, ...doc.data() });
            });
            setOrganizations(organizationsData);
        };

        fetchOrganizations();
    }, [db]);

    useEffect(() => {
        const fetchDepartments = async () => {
            const departmentsQuery = collection(db, 'departments');
            const querySnapshot = await getDocs(departmentsQuery);
            const departmentsData = [];
            querySnapshot.forEach((doc) => {
                departmentsData.push({ id: doc.id, name: doc.data().name }); // Fetch the 'name' field
            });
            setDepartments(departmentsData);
        };
    
        fetchDepartments();
    }, [db]);

    useEffect(() => {
        // Ensure that the selected event has departments and fetch courses accordingly
        if (!selectedEvent || !selectedEvent.selectedDepartments || selectedEvent.selectedDepartments.length === 0) return;

        const fetchCourses = async () => {
            try {
                // Fetch courses from the first selected department (for simplicity, you can extend this)
                const departmentId = selectedEvent.selectedDepartments[0];
                const departmentRef = doc(db, 'departments', departmentId);
                const coursesQuery = collection(departmentRef, 'courses');
                const querySnapshot = await getDocs(coursesQuery);
                const coursesData = [];
                querySnapshot.forEach((doc) => {
                    coursesData.push({ id: doc.id, ...doc.data() });
                });
                setCourses(coursesData);
            } catch (error) {
                console.error('Error fetching courses: ', error);
            }
        };

        fetchCourses();
    }, [db, selectedEvent]);

    useEffect(() => {
        // Ensure that the selected event has selectedDepartments to fetch majors accordingly
        if (!selectedEvent || !selectedEvent.selectedDepartments || selectedEvent.selectedDepartments.length === 0) {
            console.log("No departments found in the selected event.");
            return;
        }
    
        const fetchMajors = async () => {
            try {
                const majorsData = [];
    
                // Iterate over each selected department to fetch majors
                for (const departmentId of selectedEvent.selectedDepartments) {
                    const departmentRef = doc(db, 'departments', departmentId);
                    const coursesQuery = collection(departmentRef, 'courses');
                    const coursesSnapshot = await getDocs(coursesQuery);
    
                    // For each course in the department, fetch majors
                    for (const courseDoc of coursesSnapshot.docs) {
                        const courseRef = doc(departmentRef, 'courses', courseDoc.id);
                        const majorsQuery = collection(courseRef, 'majors');
                        const majorsSnapshot = await getDocs(majorsQuery);
    
                        majorsSnapshot.forEach((doc) => {
                            majorsData.push({ id: doc.id, name: doc.data().name || 'Unknown Major' });
                        });
                    }
                }
    
                if (majorsData.length === 0) {
                    console.log('No majors found for the selected departments.');
                }
    
                setMajors(majorsData);
            } catch (error) {
                console.error('Error fetching majors: ', error);
            }
        };
    
        fetchMajors();
    }, [db, selectedEvent]);
    
    


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        if (event.courseId) {
            // Trigger fetching majors if courseId exists
            fetchMajorsForEvent(event.courseId);
        }
    };
    
    const fetchMajorsForEvent = async (courseId) => {
        try {
            const departmentId = selectedEvent.selectedDepartments[0];
            const courseRef = doc(db, 'departments', departmentId, 'courses', courseId);
            const majorsQuery = collection(courseRef, 'majors');
            const querySnapshot = await getDocs(majorsQuery);
            const majorsData = [];
            querySnapshot.forEach((doc) => {
                majorsData.push({ id: doc.id, name: doc.data().name });
            });
            setMajors(majorsData);
        } catch (error) {
            console.error('Error fetching majors:', error);
        }
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
                        <li><a href="/local/createMod">Create Moderator</a></li>
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
    {selectedEvent.organizations && selectedEvent.organizations.length > 0 ? (
        selectedEvent.organizations.map((orgId) => {
            const org = organizations.find(o => o.id === orgId);
            return <li key={orgId}>{org?.name || 'Unknown Organization'}</li>;
        })
    ) : (
        <li>No Organizations</li>
    )}
</ul>

                                
                                <h4>Selected Department</h4>
<p>{selectedEvent.selectedDepartments?.map(departmentId => 
    departments.find(dept => dept.id === departmentId)?.name || 'N/A'
).join(', ') || 'N/A'}</p>

<h4>Courses</h4>
<ul>
    {courses.map((course) => (
        <li key={course.id}>{course.name}</li>
    ))}
</ul>

<h4>Majors</h4>
<ul>
    {majors.map((major) => (
        <li key={major.id}>{major.name}</li>
    ))}
</ul>

                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showProfileEdit && <ProfileEdit handleClose={handleProfileEditClose} />}
        </div>
    );
};

export default LocalAdminDashboard;
