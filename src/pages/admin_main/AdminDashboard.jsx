import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import Logout from '../Admin/Logout'; // Import Logout component
import './styles.css'; // Ensure your styles are correctly set up

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAllOngoing, setShowAllOngoing] = useState(false);
  const [showAllToday, setShowAllToday] = useState(false);
  const [showAllFuture, setShowAllFuture] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
    // Fetch Events
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    // Fetch User Details
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // Real-Time Count for Students and Admins
    const fetchCounts = () => {
      // Query for Students
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
        setStudentsCount(querySnapshot.size);
      });

      // Query for Admins
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const unsubscribeAdmins = onSnapshot(adminsQuery, (querySnapshot) => {
        setAdminsCount(querySnapshot.size);
      });

      return () => {
        unsubscribeStudents();
        unsubscribeAdmins();
      };
    };

    fetchCounts();
  }, [db]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEventClick = (event) => {
    console.log('Selected Event:', event); // Check event structure
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setShowAllOngoing(false);
    setShowAllToday(false);
    setShowAllFuture(false);
    setShowAllEvents(false);
  };

  const showAllOngoingEvents = () => {
    setShowAllOngoing(true);
  };

  const showAllTodayEvents = () => {
    setShowAllToday(true);
  };

  const showAllFutureEvents = () => {
    setShowAllFuture(true);
  };

  const showAllEventsModal = () => {
    setShowAllEvents(true);
  };

  // Time-based filtering
  const now = new Date();

  // Filter Ongoing Events
  const ongoingEvents = events.filter(
    (event) => new Date(event.startDate) <= now && new Date(event.endDate) >= now
  ).slice(0, 2); // Limit the number of displayed ongoing events

  // Filter Today's Events
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));
  const todaysEvents = events.filter(
    (event) =>
      new Date(event.startDate) >= todayStart && new Date(event.startDate) <= todayEnd
  ).slice(0, 2); // Limit the number of displayed today's events

  // Filter Future Events
  const futureEvents = events.filter((event) => new Date(event.startDate) > now).slice(0, 2); // Limit the number of displayed future events

  // All Current Events
  const currentEvents = events; // Fetch all current events without filtering based on time.

  return (
    <div className="admin-dashboard">
      <header className="navbar">
        <div className="logo-container">
          <img
            src="src/assets/images/nbsc logo.png" // Replace with your actual logo path
            alt="Logo"
            className="header-logo" // Add styles for the logo
          />
          <div className="logo-text">E-Attend Attendance System</div>
        </div>
        <div className="user-info">
          <div className="superadmin">{user ? user.displayName : 'SuperAdmin'}</div>
          <Logout />
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar and content sections */}
        <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <ul>
            <li><a href="/superadmin">Dashboard</a></li>
            <li><a href="/admin/events">Event Registration</a></li>
            <li><a href="/admin/admins">Admin Management</a></li>
            <li><a href="/signup">Student Registration</a></li>
            <li><a href="/admin/addOrg">Organization Register</a></li>
            <li><a href="admin/department">Department</a></li>
            <li><a href="/admin/StudentManage">Student Manage</a></li>
          </ul>
        </nav>

        <div className="content">
          <div className="event-stats">
            <div className="stat">
              <span>Total Events</span>
              <div className="badge">{events.length}</div>
            </div>
            <div className="stat">
              <span>Ongoing Events</span>
              <div className="badge">{ongoingEvents.length}</div>
            </div>
            <div className="stat">
              <span>Today's Events</span>
              <div className="badge">{todaysEvents.length}</div>
            </div>
            <div className="stat">
              <span>Future Events</span>
              <div className="badge">{futureEvents.length}</div>
            </div>
            <div className="stat">
              <span>Students Registered</span>
              <div className="badge">{studentsCount}</div>
            </div>
            <div className="stat">
              <span>Admins</span>
              <div className="badge">{adminsCount}</div>
            </div>
          </div>

          <div className="events-section">
            <h4>Activities Overview</h4>
            <div className="event-categories">
              <div className="event-category">
                <h5>Ongoing Events</h5>
                <ul>
                  {ongoingEvents.map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                  {ongoingEvents.length > 2 && (
                    <button onClick={showAllOngoingEvents}>View All</button>
                  )}
                </ul>
              </div>
              <div className="event-category">
                <h5>Today's Events</h5>
                <ul>
                  {todaysEvents.map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                  {todaysEvents.length > 2 && (
                    <button onClick={showAllTodayEvents}>View All</button>
                  )}
                </ul>
              </div>
              <div className="event-category">
                <h5>Future Events</h5>
                <ul>
                  {futureEvents.map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                  {futureEvents.length > 2 && (
                    <button onClick={showAllFutureEvents}>View All</button>
                  )}
                </ul>
              </div>
              <div className="event-category">
                <h5>All Current Events</h5>
                <ul>
                  {currentEvents.slice(0, 2).map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                  {currentEvents.length > 2 && (
                    <button onClick={showAllEventsModal}>View All</button>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Modals for event details */}
          {showAllOngoing && (
            <div className="event-modal">
              <div className="modal-content">
                <span className="close-button" onClick={handleCloseModal}>&times;</span>
                <h4>All Ongoing Events</h4>
                <ul>
                  {events.filter(
                    (event) => new Date(event.startDate) <= now && new Date(event.endDate) >= now
                  ).map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showAllToday && (
            <div className="event-modal">
              <div className="modal-content">
                <span className="close-button" onClick={handleCloseModal}>&times;</span>
                <h4>All Today's Events</h4>
                <ul>
                  {events.filter(
                    (event) =>
                      new Date(event.startDate) >= todayStart && new Date(event.startDate) <= todayEnd
                  ).map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showAllFuture && (
            <div className="event-modal">
              <div className="modal-content">
                <span className="close-button" onClick={handleCloseModal}>&times;</span>
                <h4>All Future Events</h4>
                <ul>
                  {events.filter((event) => new Date(event.startDate) > now).map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showAllEvents && (
            <div className="event-modal">
              <div className="modal-content">
                <span className="close-button" onClick={handleCloseModal}>&times;</span>
                <h4>All Current Events</h4>
                <ul>
                  {currentEvents.map(event => (
                    <li key={event.id} onClick={() => handleEventClick(event)}>
                      {event.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {selectedEvent && (
            <div className="event-modal">
              <div className="modal-content">
                <span className="close-button" onClick={handleCloseModal}>&times;</span>
                <h4>Event Details</h4>
                <p><strong>Name:</strong> {selectedEvent.name}</p>
                <p><strong>Description:</strong> {selectedEvent.description}</p>
                <p><strong>Start Date:</strong> {new Date(selectedEvent.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(selectedEvent.endDate).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                <p><strong>Organizations:</strong> {selectedEvent.organizations.join(', ')}</p>
                <p><strong>Year Levels:</strong> {selectedEvent.year.join(', ')}</p>
                <p><strong>Departments:</strong> {Object.keys(selectedEvent.selectedDepartments).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
