import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, doc, getDocs  } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP,   } from '../../firebaseutil/firebase_main';
import { Modal, Table, Button,  } from 'antd';
import {  Tabs, Tab } from 'react-bootstrap';
import './styles.css';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [adminEvents, setAdminEvents] = useState([]);
  const [moderatorEvents, setModeratorEvents] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [attendanceData, setAttendanceData] = useState([]); 

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
      setAdminEvents(eventsData.filter(event => event.status === 'accepted')); // Admin Events
      setModeratorEvents(eventsData.filter(event => event.status === 'pending')); // Moderator Events
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
        
      });

      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const unsubscribeAdmins = onSnapshot(adminsQuery, (querySnapshot) => {
        
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

  useEffect(() => {
    const fetchDepartments = async () => {
      const departmentsRef = collection(db, 'departments');
      const unsubscribeDepartments = onSnapshot(departmentsRef, (querySnapshot) => {
        const departmentsData = {};
        querySnapshot.forEach((doc) => {
          departmentsData[doc.id] = doc.data().name; // Assuming each department doc has a 'name' field
        });
        setDepartmentsMap(departmentsData);
      });

      return () => unsubscribeDepartments();
    };

    fetchDepartments();
  }, [db]);


  const handleEventClick = async (event) => {
    setSelectedEvent(event);

    // Fetch attendance for the selected event
    const attendanceCollection = await getDocs(collection(db, `events/${event.id}/attendance`));
    const attendance = attendanceCollection.docs.map(doc => doc.data());
    console.log('Fetched Attendance:', attendance);
    setAttendanceData(attendance); // Store attendance data for later printing
  };
  
  const handleCloseModal = () => {
    setSelectedEvent(null);
    setAttendanceData([]); // Clear attendance data when closing the modal
  };


  const printEvent = () => {
    if (!selectedEvent || attendanceData.length === 0) return; // Ensure event and attendance data are available

    console.log('Printing event:', selectedEvent);
    console.log('Attendance Data:', attendanceData);  // Debugging line

    const details = getFormattedDetails(selectedEvent);
    const printWindow = window.open('', '', 'height=600,width=800');

    // Add styles for better presentation
    printWindow.document.write(`
      <html>
        <head>
          <title>Event Details</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #4CAF50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Event Details: ${selectedEvent.name}</h1>
          <h2>Event Information</h2>
          <p><strong>Description:</strong> ${details.description || 'N/A'}</p>
          <p><strong>Start Date:</strong> ${details.startDate || 'N/A'}</p>
          <p><strong>End Date:</strong> ${details.endDate || 'N/A'}</p>
          <p><strong>Status:</strong> ${details.status || 'N/A'}</p>
          <p><strong>Venue:</strong> ${details.venue || 'N/A'}</p>

          <h2>Attendees:</h2>
    `);

    if (attendanceData && attendanceData.length > 0) {
      printWindow.document.write('<table><tr><th>First Name</th><th>Last Name</th><th>School ID</th><th>Time In</th><th>Time Out</th></tr>');
      
      attendanceData.forEach((attendee) => {
        printWindow.document.write('<tr>');
        printWindow.document.write(`<td>${attendee.studentInfo?.fname || 'N/A'}</td>`);
        printWindow.document.write(`<td>${attendee.studentInfo?.lname || 'N/A'}</td>`);
        printWindow.document.write(`<td>${attendee.schoolID || 'N/A'}</td>`);
        printWindow.document.write(`<td>${attendee.timeIn || 'N/A'}</td>`);
        printWindow.document.write(`<td>${attendee.timeOut || 'N/A'}</td>`);
        printWindow.document.write('</tr>');
      });
      
      printWindow.document.write('</table>');
    } else {
      printWindow.document.write('<p>No attendees registered for this event.</p>');
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Wait for the window to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  };



  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (startDate) => new Date(startDate.seconds * 1000).toLocaleDateString(), // Convert Firestore timestamp to date
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (endDate) => endDate ? new Date(endDate.seconds * 1000).toLocaleDateString() : 'N/A', // Convert Firestore timestamp to date or handle null
    },
    {
      title: 'Status',
      render: (text, record) => (
        new Date(record.startDate) <= new Date() && new Date(record.endDate) >= new Date() ? 'Ongoing' : 'Upcoming'
      ),
    },
    {
      title: 'More Details',
      render: (text, record) => (
        <Button type="primary" onClick={() => handleEventClick(record)}>Details</Button>
      ),
    },

  ];


  const getFormattedDetails = (event) => {
    const userInChargeNames = Array.isArray(event.userInCharge)
        ? event.userInCharge.map((userId) => {
            const user = usersMap[userId] || {};
            return `${user.fname || ''} ${user.lname || ''}`;
        }).join(', ')
        : '';

        const formattedDepartments = Array.isArray(event.selectedDepartments)
        ? event.selectedDepartments.map(depId => departmentsMap[depId] || depId).join(', ')
        : '';

    const formattedOrganizations = Array.isArray(event.organizations)
        ? event.organizations.map(orgId => orgId).join(', ') // assuming orgId is a string or modify as necessary
        : '';

    return {
        adminID: event.adminID,
        adminName: `${(usersMap[event.adminID]?.fname || '')} ${(usersMap[event.adminID]?.lname || '')}`,
        createdBy: usersMap[event.createdBy]?.fullName || 'N/A',
        description: event.description || 'N/A',
        endDate: event.endDate ? new Date(event.endDate.seconds * 1000).toLocaleString() : 'N/A',
        name: event.name || 'N/A',
        startDate: event.startDate ? new Date(event.startDate.seconds * 1000).toLocaleString() : 'N/A',
        status: event.status || 'N/A',
        userInCharge: userInChargeNames,
        users: event.users ? event.users.map(uid => `${usersMap[uid]?.fname || ''} ${usersMap[uid]?.lname || ''}`).join(', ') : '',
        venue: event.venue || 'N/A',
        yearLevels: Array.isArray(event.yearLevels) ? event.yearLevels.join(', ') : '',
        selectedDepartments: formattedDepartments,
        organizations: formattedOrganizations,
    };
};


const attendanceColumns = [
  { title: 'First Name', dataIndex: ['studentInfo', 'fname'], key: 'fname' },
  { title: 'Last Name', dataIndex: ['studentInfo', 'lname'], key: 'lname' },
  { title: 'School ID', dataIndex: 'schoolID' },
  { title: 'Time In', dataIndex: 'timeIn' },
  { title: 'Time Out', dataIndex: 'timeOut' },
];


  return (
    <div className="admin-dashboard">
      {/* Tabs for Event Categories */}
      <Tabs
  defaultActiveKey="admin"
  id="admin-moderator-events"
  className="mb-3 custom-tabs"
  style={{ width: '100%', padding: 0, margin: 0 }} // Ensure full width, no padding/margin
>
  <Tab eventKey="admin" title="Admin Events">
    <Table
      columns={columns}
      dataSource={adminEvents}
      rowKey="id"
      size="small"
      bordered
      pagination={{ pageSize: 5 }}
      style={{ tableLayout: 'auto', width: '70vw' }}

      
    />
  </Tab>
  <Tab eventKey="moderator" title="Moderator Events">
    <Table
      columns={columns}
      dataSource={moderatorEvents}
      rowKey="id"
      size="small"
      bordered
      pagination={{ pageSize: 5 }}
      style={{ tableLayout: 'auto', width: '70vw' }}
    />
  </Tab>
</Tabs>



      {/* Modal to show event details */}
      {selectedEvent && (
        <Modal
  title={<div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>Details for Event: {selectedEvent.name}</div>}
  open={!!selectedEvent}
  onCancel={handleCloseModal}
  footer={
    <Button type="primary" onClick={printEvent}>Print Event</Button>
  }
  width={800}
>


<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
  {/* Event Status */}
  <div style={boxStyle}>
    <p style={labelStyle}>Event Status:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).status || 'N/A'}</p>
  </div>

  {/* Event Description */}
  <div style={boxStyle}>
    <p style={labelStyle}>Description:</p>
    <p style={valueStyle}>{selectedEvent.description || 'N/A'}</p>
  </div>

  {/* Venue */}
  <div style={boxStyle}>
    <p style={labelStyle}>Venue:</p>
    <p style={valueStyle}>{selectedEvent.venue || 'N/A'}</p>
  </div>

  {/* Start Date */}
  <div style={boxStyle}>
    <p style={labelStyle}>Start Date:</p>
    <p style={valueStyle}>{selectedEvent.startDate ? new Date(selectedEvent.startDate.seconds * 1000).toLocaleString() : 'N/A'}</p>
  </div>

  {/* End Date */}
  <div style={boxStyle}>
    <p style={labelStyle}>End Date:</p>
    <p style={valueStyle}>{selectedEvent.endDate ? new Date(selectedEvent.endDate.seconds * 1000).toLocaleString() : 'N/A'}</p>
  </div>

  {/* Year Levels */}
  <div style={boxStyle}>
    <p style={labelStyle}>Year Levels:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).yearLevels || 'N/A'}</p>
  </div>

  {/* Departments */}
  <div style={boxStyle}>
    <p style={labelStyle}>Departments:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).selectedDepartments || 'N/A'}</p>
  </div>

  {/* Created By */}
  <div style={boxStyle}>
    <p style={labelStyle}>Created By:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).createdBy || 'N/A'}</p>
  </div>

  {/* Admin Name */}
  <div style={boxStyle}>
    <p style={labelStyle}>Admin Name:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).adminName || 'N/A'}</p>
  </div>

  {/* User in Charge */}
  <div style={boxStyle}>
    <p style={labelStyle}>User in Charge:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).userInCharge || 'N/A'}</p>
  </div>

  {/* Organizations */}
  <div style={boxStyle}>
    <p style={labelStyle}>Organizations:</p>
    <p style={valueStyle}>{getFormattedDetails(selectedEvent).organizations || 'N/A'}</p>
  </div>
</div>

  <h3>Attendance Records</h3>

  <Table 
      columns={attendanceColumns} 
      dataSource={attendanceData} 
      rowKey="schoolID" 
      pagination={false} 
  />
        </Modal>

      )}
    </div>
  );
  

};
const boxStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: '8px',
  borderTop: '1px solid #ddd', 
};

const labelStyle = {
  fontWeight: 'bold',
  width: '40%',
};

const valueStyle = {
  width: '60%',
};


export default AdminDashboard;
