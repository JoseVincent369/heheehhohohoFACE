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
    if (!selectedEvent) return;
  
    const startDate = new Date(selectedEvent.startDate.seconds * 1000).toLocaleString();
    const endDate = selectedEvent.endDate ? new Date(selectedEvent.endDate.seconds * 1000).toLocaleString() : 'N/A';
    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', // Day of the week
      year: 'numeric', // Full year
      month: 'long', // Full month name
      day: 'numeric', // Day of the month
    });
  
    const printContent = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          line-height: 0.5;
          margin-bottom: 10px;
        }
        .header img {
          width: 20px;
          height: auto;
          display: block;
          margin: 0 auto 10px;
        }
        .header-line {
          border-top: 2px solid black;
          margin: 10px 0;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 20px;
          text-align: center;
          color: #4169e1;
          margin: 20px 0;
          font-weight: bold;
        }
        .info-table, .attendance-sheet {
          width: 100%;
          border-collapse: collapse;
        }
        .info-table th, .info-table td, .attendance-sheet th, .attendance-sheet td {
          padding: 8px;
          font-size: 14px;
          border: 1px solid black;
        }
        .info-table th {
          text-align: left;
          font-weight: bold;
          width: 21%;
        }
        .attendance-sheet th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .footer {
          text-align: left;
          font-size: 6px;
        }
      </style>
  
      <div class="header">
        <img src="nbsc_logo.png" alt="NBSC Logo">
        <p>Republic of the Philippines</p>
        <p><strong>NORTHERN BUKIDNON STATE COLLEGE</strong></p>
        <p>(Formerly Northern Bukidnon Community College) RA11284</p>
        <p>Manolo Fortich, 8703 Bukidnon * 535-3873 * nbscadmin@nbsc.edu.ph</p>
        <p>Creando futura . Transformationis vitae . Ductae a Deo</p>
      </div>
      <div class="header-line"></div>
  
      <h2>ATTENDANCE SHEET</h2>
  
      <!-- Information Table for Name of Activity, Date and Time, Venue -->
      <table class="info-table">
        <tr>
          <th>Name of Activity:</th>
          <td>${selectedEvent.name || ''}</td>
        </tr>
        <tr>
          <th>Date and Time:</th>
          <td>${startDate} to ${endDate}</td>
        </tr>
        <tr>
          <th>Venue:</th>
          <td>${selectedEvent.venue || ''}</td>
        </tr>
      </table>
  
      <!-- Attendance Table -->
      <table class="attendance-sheet">
        <thead>
          <tr>
            <th>NO.</th>
            <th>NAME (Last, First, MI)</th>
            <th>IN</th>
            <th>OUT</th>
            <th>Picture and Video taking Consent</th>
            <th>Sex (M/F)</th>
            <th>Preferred Title (Mr., Ms., etc.)</th>
            <th>IP (Tribe)</th>
            <th>SIGNATURE</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceData.map((attendee, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${attendee.studentInfo.lname}, ${attendee.studentInfo.fname}</td>
              <td>${attendee.timeIn || 'N/A'}</td>
              <td>${attendee.timeOut || 'N/A'}</td>
              <td>${attendee.pictureConsent ? 'Yes' : 'No'}</td>
              <td>${attendee.studentInfo.gender}</td>
              <td>${attendee.studentInfo.title}</td>
              <td>${attendee.studentInfo.IP || 'N/A'}</td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
  
      <div class="footer">
        <p>Date Revised: ${currentDate}</p>
      </div>
    `;
  
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
      render: (text, record) => {
        const currentDate = new Date();
        const startDate = new Date(record.startDate.seconds * 1000);
        const endDate = record.endDate ? new Date(record.endDate.seconds * 1000) : null;
  
        if (endDate && currentDate > endDate) {
          return 'Ended'; // Event is in the past
        } else if (startDate && currentDate < startDate) {
          return 'Upcoming'; // Event has not started yet
        } else if (startDate && currentDate >= startDate && (!endDate || currentDate <= endDate)) {
          return 'Ongoing'; // Event is currently ongoing
        } else {
          return 'Pending'; // Default status if none of the above
        }
      },
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
    <div className="container">
      {/* Tabs for Event Categories */}
      <Tabs
  defaultActiveKey="admin"
  id="admin-moderator-events"
  className="mb-3"
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
