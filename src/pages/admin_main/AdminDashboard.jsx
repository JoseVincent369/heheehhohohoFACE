import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { Modal, Table, Button } from 'antd';
import './styles.css';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [usersMap, setUsersMap] = useState({});

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

  useEffect(() => {
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
        const usersData = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usersData[doc.id] = data;
        });
        setUsersMap(usersData);
      });

      return () => unsubscribeUsers();
    };

    fetchUsers();
  }, [db]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Status',
      render: (text, record) => (
        new Date(record.startDate) <= new Date() && new Date(record.endDate) >= new Date() ? 'Ongoing' : 'Upcoming'
      ),
    },
    {
      title: 'Action',
      render: (text, record) => (
        <Button type="primary" onClick={() => handleEventClick(record)}>Details</Button>
      ),
    },
  ];

  const getFormattedDetails = (event) => {
    const userInCharge = usersMap[event.userInCharge] || {};

    // Ensure users is an array before mapping
    const formattedUsers = Array.isArray(event.users) 
        ? event.users.map((uid) => {
            const user = usersMap[uid] || {};
            return user.role === 'user' ? `${user.fname} ${user.lname}` : user.fullName;
        }).join(', ')
        : '';

    // Ensure selectedDepartments is an array before mapping
    const formattedDepartments = Array.isArray(event.selectedDepartments) 
        ? event.selectedDepartments.map(dep => dep.name).join(', ') 
        : '';

    // Ensure organizations is an array before mapping
    const formattedOrganizations = Array.isArray(event.organizations) 
        ? event.organizations.map(org => org.name).join(', ') 
        : '';

    // Get admin details using the adminID
    const admin = usersMap[event.adminID] || {};

    return {
        adminID: event.adminID,
        adminName: `${admin.fname || ''} ${admin.lname || ''}`, // Get admin name
        courses: event.courses.join(', '),
        createdBy: usersMap[event.createdBy]?.fullName || '',
        description: event.description,
        endDate: new Date(event.endDate).toLocaleString(),
        name: event.name,
        startDate: new Date(event.startDate).toLocaleString(),
        status: event.status,
        userInCharge: `${userInCharge.fname || ''} ${userInCharge.lname || ''}`,
        users: formattedUsers,
        venue: event.venue,
        yearLevels: event.yearLevels.join(', '),
        selectedDepartments: formattedDepartments,
        organizations: formattedOrganizations,
    };
};

return (
    <div className="admin-dashboard">
        <h2>Admin Dashboard</h2>
        <div className="stats">
            <Stat title="Events" count={events.length} />
            <Stat title="Students Registered" count={studentsCount} />
            <Stat title="Admins" count={adminsCount} />
        </div>

        <h4>Activities Overview</h4>
        <Table columns={columns} dataSource={events} rowKey="id" />

        {/* Modal to show event details */}
        {selectedEvent && (
            <Modal
                title={selectedEvent.name}
                open={!!selectedEvent}
                onCancel={handleCloseModal}
                footer={null}
            >
                <p><strong>Start Date:</strong> {new Date(selectedEvent.startDate).toLocaleString()}</p>
                <p><strong>End Date:</strong> {new Date(selectedEvent.endDate).toLocaleString()}</p>
                <p><strong>Description:</strong> {selectedEvent.description}</p>
                <p><strong>Created By:</strong> {usersMap[selectedEvent.createdBy]?.fullName || ''}</p>
                <p><strong>Admin Name:</strong> {getFormattedDetails(selectedEvent).adminName}</p> {/* Display Admin Name */}
                <p><strong>User in Charge:</strong> {getFormattedDetails(selectedEvent).userInCharge}</p>
                <p><strong>Users:</strong> {getFormattedDetails(selectedEvent).users}</p>
                <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                <p><strong>Year Levels:</strong> {getFormattedDetails(selectedEvent).yearLevels}</p>
                <p><strong>Departments:</strong> {getFormattedDetails(selectedEvent).selectedDepartments}</p>
                <p><strong>Organizations:</strong> {getFormattedDetails(selectedEvent).organizations}</p>
                <p><strong>Status:</strong> {getFormattedDetails(selectedEvent).status}</p>
            </Modal>
        )}
    </div>
);
 

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stats">
        <Stat title="Events" count={events.length} />
        <Stat title="Students Registered" count={studentsCount} />
        <Stat title="Admins" count={adminsCount} />
      </div>

      <h4>Activities Overview</h4>
      <Table columns={columns} dataSource={events} rowKey="id" />

      {/* Modal to show event details */}
      {selectedEvent && (
        <Modal
          title={selectedEvent.name}
          open={!!selectedEvent}
          onCancel={handleCloseModal}
          footer={null}
        >
          <p><strong>Start Date:</strong> {new Date(selectedEvent.startDate).toLocaleString()}</p>
          <p><strong>End Date:</strong> {new Date(selectedEvent.endDate).toLocaleString()}</p>
          <p><strong>Description:</strong> {selectedEvent.description}</p>
          <p><strong>Created By:</strong> {usersMap[selectedEvent.createdBy]?.fullName || ''}</p>
          <p><strong>Admin ID:</strong> {selectedEvent.adminID}</p>
          <p><strong>User in Charge:</strong> {getFormattedDetails(selectedEvent).userInCharge}</p>
          <p><strong>Users:</strong> {getFormattedDetails(selectedEvent).users}</p>
          <p><strong>Venue:</strong> {selectedEvent.venue}</p>
          <p><strong>Year Levels:</strong> {getFormattedDetails(selectedEvent).yearLevels}</p>
          <p><strong>Departments:</strong> {getFormattedDetails(selectedEvent).selectedDepartments}</p>
          <p><strong>Organizations:</strong> {getFormattedDetails(selectedEvent).organizations}</p>
          <p><strong>Status:</strong> {getFormattedDetails(selectedEvent).status}</p>
        </Modal>
      )}
    </div>
  );
};

// Separate stat component for better modularity
const Stat = ({ title, count }) => (
  <div className="stat">
    <h4>{title}</h4>
    <span className="badge">{count}</span>
  </div>
);

export default AdminDashboard;
