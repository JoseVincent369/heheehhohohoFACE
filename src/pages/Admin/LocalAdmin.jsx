import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { Tabs, Tab } from 'react-bootstrap';
import { Pagination } from "antd";
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
  const [doneEvents, setDoneEvents] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [pageSize, setPageSize] = useState(5); // Items per page

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        setUser(null); // Handle logged out state
        setEvents([]); // Clear events
        setPendingEvents([]);
        setApprovedEvents([]);
        setRejectedEvents([]);
        setDoneEvents([]); 
        setModeratorEvents([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);
  

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return; // Exit if user is not logged in
  
      try {
        // Step 1: Fetch moderators created by the admin
        const moderatorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'moderator'),
          where('createdBy', '==', user.uid)
        );
        const moderatorsSnapshot = await getDocs(moderatorsQuery);
  
        // Collect all moderator IDs
        const moderatorIDs = moderatorsSnapshot.docs.map((doc) => doc.id);
  
        // Step 2: Fetch events where the user is the admin
        const adminEventsQuery = query(
          collection(db, 'events'),
          where('adminID', '==', user.uid)
        );
        const adminEventsSnapshot = await getDocs(adminEventsQuery);
  
        const adminEvents = adminEventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Step 3: Fetch events created by moderators
        const moderatorEventsQuery = query(
          collection(db, 'events'),
          where('createdBy', 'in', moderatorIDs)
        );
        const moderatorEventsSnapshot = await getDocs(moderatorEventsQuery);
  
        const moderatorEvents = moderatorEventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Combine and deduplicate events
        const combinedEvents = [...adminEvents, ...moderatorEvents];
        const uniqueEvents = combinedEvents.reduce((acc, event) => {
          if (!acc.some((e) => e.id === event.id)) {
            acc.push(event);
          }
          return acc;
        }, []);
  
        // Categorize events
        setEvents(uniqueEvents);
        setPendingEvents(uniqueEvents.filter((event) => event.status === 'pending'));
        setApprovedEvents(uniqueEvents.filter((event) => event.status === 'accepted'));
        setRejectedEvents(uniqueEvents.filter((event) => event.status === 'rejected'));
        setDoneEvents(uniqueEvents.filter((event) => event.status === 'done'));
        setEventsLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        
      }
    };
  
    fetchEvents();
  }, [user]);

  // Fetch Moderators created by the current Admin
  useEffect(() => {
    if (!user) return;
  
    const fetchModeratorsAndEvents = async () => {
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
  
        const allModeratorEventsPromises = moderatorData.map(async (moderator) => {
          const eventsQuery = query(
            collection(db, 'events'),
            where('createdBy', '==', moderator.id)
          );
          const eventsSnapshot = await getDocs(eventsQuery);
          return eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            moderatorName: moderator.fullName,
            moderatorEmail: moderator.email,
          }));
        });
  
        const allModeratorEvents = await Promise.all(allModeratorEventsPromises);
        const flattenedModeratorEvents = allModeratorEvents.flat();
  
        // Filter to ensure only unique events are added
        const uniqueModeratorEvents = flattenedModeratorEvents.filter((event) =>
          !moderatorEvents.some((existingEvent) => existingEvent.id === event.id)
        );
  
        setModeratorEvents((prev) => {
          const uniqueEvents = uniqueModeratorEvents.filter((event) =>
            !prev.some((existingEvent) => existingEvent.id === event.id)
          );
          return [...prev, ...uniqueEvents];
        });
  
        setPendingEvents((prev) => prev.concat(uniqueModeratorEvents.filter((event) => event.status === 'pending')));
        setApprovedEvents((prev) => prev.concat(uniqueModeratorEvents.filter((event) => event.status === 'accepted')));
        setRejectedEvents((prev) => prev.concat(uniqueModeratorEvents.filter((event) => event.status === 'rejected')));
      } catch (error) {
        console.error('Error fetching moderators and their events:', error);
        setError('Failed to fetch moderators and their events.');
      }
      setEventsLoading(false);
    };
  
    fetchModeratorsAndEvents();
  }, [db, user, moderatorEvents]);
  

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleChangeStatus = async (newStatus) => {
    if (selectedEvent) {
      const eventDoc = doc(db, 'events', selectedEvent.id);
  
      try {
        await updateDoc(eventDoc, { status: newStatus });
  
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id ? { ...event, status: newStatus } : event
          )
        );
  
        if (newStatus === 'accepted') {
          setApprovedEvents((prev) => {
            if (!prev.some(event => event.id === selectedEvent.id)) {
              return [...prev, { ...selectedEvent, status: newStatus }];
            }
            return prev;
          });
          setPendingEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
        } else if (newStatus === 'rejected') {
          setRejectedEvents((prev) => {
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


  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };
    // Fetch approved, rejected, and pending events logic goes here
    useEffect(() => {
      // Assuming you have the logic to fetch the events, for example:
      setApprovedEvents([
        /* Array of approved events */
      ]);
      setRejectedEvents([
        /* Array of rejected events */
      ]);
      setPendingEvents([
        /* Array of pending events */
      ]);
    }, []);

    

  return (
    <div className="container">
      {error && <p className="error-message">{error}</p>}
      {/* Tabs for Event Categories */}
      <Tabs defaultActiveKey="pending" id="event-tabs" className="mb-3">
        {/* Pending Events Tab */}
        <Tab eventKey="pending" title="Pending Events">
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
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
              <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={pendingEvents.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={["5", "10", "20"]}
                />

            </table>
          )}
        </Tab>

        {/* Approved Events Tab */}
        <Tab eventKey="approved" title="Approved Events">
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
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
              <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={approvedEvents.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={["5", "10", "20"]}
                />
            </table>
          )}
        </Tab>

        {/* Rejected Events Tab */}
        <Tab eventKey="rejected" title="Rejected Events">
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
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
              <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={rejectedEvents.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={["5", "10", "20"]}
                />
            </table>
          )}
        </Tab>

        {/* Moderator Events Tab */}
        <Tab eventKey="moderators" title="Moderators Events">
          {moderatorEvents.length === 0 ? (
            <p>No events created by moderators at the moment.</p>
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
                {moderatorEvents.map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
              <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={moderatorEvents.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={["5", "10", "20"]}
                />
            </table>
          )}
        </Tab>

        <Tab eventKey="done" title="Done Events">
          {doneEvents.length === 0 ? (
            <p>No done events at the moment.</p>
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
                {doneEvents.map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
