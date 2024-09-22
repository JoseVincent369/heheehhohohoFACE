import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './styles.css';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
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
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchCounts = () => {
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
        setStudentsCount(querySnapshot.size);
      });

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

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setShowAllEvents(false);
  };

  const showAllEventsModal = () => {
    setShowAllEvents(true);
  };

  return (
    <div className="admin-dashboard">
      <div className="main-content">
        <div className="">
          <div className="event-stats">
            <div className="stat ongoing-events">
              <span>Events</span>
              <div className="badge">{events.length}</div>
            </div>
            <div className="stat students-attended">
              <span>Students Registered</span>
              <div className="badge">{studentsCount}</div>
            </div>
            <div className="stat admins">
              <span>Admins</span>
              <div className="badge">{adminsCount}</div>
            </div>
          </div>

          <div className="events-section">
            <h4>Activities Overview</h4>
            <button onClick={showAllEventsModal}>View All Events</button>

            {/* Event Table */}
            <table className="event-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{new Date(event.startDate).toLocaleDateString()}</td>
                    <td>{new Date(event.endDate).toLocaleDateString()}</td>
                    <td>{new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? 'Ongoing' : 'Upcoming'}</td>
                    <td><button onClick={() => handleEventClick(event)}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Modal to show event details */}
            {selectedEvent && (
              <div className="event-modal">
                <div className="modal-content">
                  <span className="close" onClick={handleCloseModal}>&times;</span>
                  <h2>{selectedEvent.name}</h2>
                  <p><strong>Start Date:</strong> {new Date(selectedEvent.startDate).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {new Date(selectedEvent.endDate).toLocaleDateString()}</p>
                  <p><strong>Description:</strong> {selectedEvent.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
