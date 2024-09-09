import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './localstyles.css';
import logo from '../../assets/images/nbsc logo.png'; // Ensure correct image path
import Logout from '../Admin/Logout'; // Import Logout component
import ProfileEdit from '../components/ProfileEdit';
//import EventModal from '../components/EventModal';
//import { changeEventStatus } from '../components/EventModal';


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
    const [moderators, setModerators] = useState([]);
    const [moderatorEvents, setModeratorEvents] = useState([]);


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
            try {
                const organizationsQuery = collection(db, 'organizations');
                const querySnapshot = await getDocs(organizationsQuery);
                const organizationsData = [];
                querySnapshot.forEach((doc) => {
                    organizationsData.push({ id: doc.id, ...doc.data() });
                });
                setOrganizations(organizationsData);
            } catch (error) {
                console.error('Error fetching organizations: ', error);
            }
        };

        fetchOrganizations();
    }, [db]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const departmentsQuery = collection(db, 'departments');
                const querySnapshot = await getDocs(departmentsQuery);
                const departmentsData = [];
                querySnapshot.forEach((doc) => {
                    departmentsData.push({ id: doc.id, name: doc.data().name }); // Fetch the 'name' field
                });
                setDepartments(departmentsData);
            } catch (error) {
                console.error('Error fetching departments: ', error);
            }
        };
    
        fetchDepartments();
    }, [db]);

    useEffect(() => {
        if (!selectedEvent || !selectedEvent.selectedDepartments || selectedEvent.selectedDepartments.length === 0) return;

        const fetchCourses = async () => {
            try {
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
        if (!selectedEvent || !selectedEvent.selectedDepartments || selectedEvent.selectedDepartments.length === 0) {
            console.log("No departments found in the selected event.");
            return;
        }
    
        const fetchMajors = async () => {
            try {
                const majorsData = [];
    
                for (const departmentId of selectedEvent.selectedDepartments) {
                    const departmentRef = doc(db, 'departments', departmentId);
                    const coursesQuery = collection(departmentRef, 'courses');
                    const coursesSnapshot = await getDocs(coursesQuery);
    
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

    useEffect(() => {
        if (!user) return;
    
        const fetchAdminEvents = query(
            collection(db, 'events'),
            where('createdBy', '==', user.uid)
        );
    
        const unsubscribeAdminEvents = onSnapshot(fetchAdminEvents, (querySnapshot) => {
            const adminEventsData = [];
            querySnapshot.forEach((doc) => {
                adminEventsData.push({ id: doc.id, ...doc.data() });
            });
            setEvents(adminEventsData);
        }, (error) => {
            console.error('Error fetching admin events: ', error);
        });
    
        return () => unsubscribeAdminEvents();
    }, [db, user]);

    useEffect(() => {
        if (!user) return;
    
        const fetchModerators = async () => {
            try {
                const moderatorsQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'moderator'),
                    where('createdBy', '==', user.uid)
                );
                const moderatorsSnapshot = await getDocs(moderatorsQuery);
                const moderatorData = moderatorsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setModerators(moderatorData);
            } catch (error) {
                console.error('Error fetching moderators:', error);
                alert('Failed to fetch moderators.');
            }
        };
    
        fetchModerators();
    }, [db, user]);

    
    useEffect(() => {
        const fetchModeratorEvents = async () => {
            if (moderators.length === 0) return;
    
            setLoading(true);
            try {
                // Fetch events for each moderator
                const eventsPromises = moderators.map(async (moderator) => {
                    console.log(`Fetching events for moderator ID: ${moderator.id}`);
                    const eventsQuery = query(
                        collection(db, 'events'),
                        where('createdBy', '==', moderator.id)
                    );
                    const eventsSnapshot = await getDocs(eventsQuery);
                    console.log(`Events snapshot for moderator ID ${moderator.id}:`, eventsSnapshot);
                    
                    const eventsData = eventsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    
                    console.log(`Events for Moderator ${moderator.id}:`, eventsData); // Check this output
                    return eventsData;
                });
    
                // Wait for all promises to resolve and flatten the results
                const allModeratorEvents = await Promise.all(eventsPromises);
                const flattenedModeratorEvents = allModeratorEvents.flat();
                console.log('All Moderator Events:', flattenedModeratorEvents); // Check this output
                setModeratorEvents(flattenedModeratorEvents);
            } catch (error) {
                console.error('Error fetching moderator events:', error);
                alert('Failed to fetch moderator events.');
            } finally {
                setLoading(false);
            }
        };
    
        fetchModeratorEvents();
    }, [db, moderators]);
    
    console.log('Fetched Moderators:', moderators);


    const approvedEvents = events.filter((event) => event.status === 'accepted');
    const pendingEvents = events.filter((event) => event.status === 'pending');





 /*   const toggleSidebar = () => {
   setIsSidebarOpen(!isSidebarOpen);
    };*/




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
                            <div className="event-category">
                                <h5>Moderator Events</h5>
                                <ul className="event-list">
                                    {moderatorEvents.map((event) => (
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
                            <div className="event-category">
                                <h5>Pending Events</h5>
                                <ul className="event-list">
                                    {pendingEvents.map((event) => (
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
                            <div className="event-category">
                                <h5>Approved Events</h5>
                                <ul className="event-list">
                                    {approvedEvents.map((event) => (
                                        <li
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
                                <p>
  <strong>Start Date:</strong> 
  {selectedEvent.startDate 
    ? (selectedEvent.startDate.toDate 
        ? new Date(selectedEvent.startDate.toDate()).toLocaleString() 
        : new Date(selectedEvent.startDate).toLocaleString())
    : 'N/A'}
</p>
<p>
  <strong>End Date:</strong> 
  {selectedEvent.endDate 
    ? (selectedEvent.endDate.toDate 
        ? new Date(selectedEvent.endDate.toDate()).toLocaleString() 
        : new Date(selectedEvent.endDate).toLocaleString())
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
             
            {selectedEvent && (
                <EventModal
                    selectedEvent={selectedEvent}
                    handleCloseModal={handleCloseModal}
                    changeEventStatus={changeEventStatus}
                />
            )}
            {showProfileEdit && <ProfileEdit handleClose={handleProfileEditClose} />}
        </div>
    );
};

export default LocalAdminDashboard;
