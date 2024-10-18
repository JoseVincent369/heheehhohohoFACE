import React, { useState, useEffect } from 'react';
import { collection, getDocs, where, query, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { Table, Button, Modal } from 'antd';

const AttendanceRecord = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false); // State for modal visibility
  const [selectedParticipants, setSelectedParticipants] = useState([]); // State for selected event participants
  const auth = getAuth();

  useEffect(() => {
    const fetchModeratorName = async (moderatorId) => {
      const moderatorDoc = await getDoc(doc(FIRESTORE_DB, 'users', moderatorId));
      return moderatorDoc.exists() ? moderatorDoc.data().fullName : '';
    };

    const fetchEvents = async (adminID) => {
      try {
        // Query events where 'adminID' matches the current user's UID
        const eventsQuery = query(
          collection(FIRESTORE_DB, 'events'),
          where('adminID', '==', adminID),
          where('status', '==', 'accepted')
        );

        const eventsCollection = await getDocs(eventsQuery);
        const eventsData = [];

        for (const eventDoc of eventsCollection.docs) {
          const eventId = eventDoc.id;
          const eventData = eventDoc.data();

          // Fetch attendance for this event
          const attendanceCollection = await getDocs(collection(FIRESTORE_DB, `events/${eventId}/attendance`));
          const attendance = attendanceCollection.docs.map(doc => doc.data());

          // Fetch the moderator's name, or default to 'Created by Me' if event created by admin
          const moderatorName = eventData.createdBy === adminID
            ? 'Created by Me'
            : await fetchModeratorName(eventData.createdBy);

          eventsData.push({
            ...eventData,
            id: eventId,
            attendance,
            attendeesCount: attendance.length,
            moderatorName, // Add the moderator's name or 'Created by Me'
          });
        }

        console.log('Fetched Events:', eventsData);
        setEvents(eventsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Current User UID:', user.uid);
        fetchEvents(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [auth]);

  const sortEvents = (field) => {
    const sortedEvents = [...events].sort((a, b) => b[field] - a[field]);
    setEvents(sortedEvents);
  };

  // Function to open modal with participants
  const showParticipants = (attendance) => {
    setSelectedParticipants(attendance);
    setVisible(true);
  };

  // Close modal
  const handleCancel = () => {
    setVisible(false);
    setSelectedParticipants([]); // Clear participants when modal closes
  };

  // Print the details of an event
  // Print the details of an event
const handlePrint = (event) => {
  const printContent = `
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
      }
      h2 {
        font-size: 24px;
        margin-bottom: 10px;
      }
      p {
        font-size: 18px;
        margin: 5px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      table, th, td {
        border: 1px solid black;
      }
      th, td {
        padding: 10px;
        text-align: left;
      }
    </style>
    <h2>${event.name}</h2>
    <p><strong>Moderator:</strong> ${event.moderatorName}</p>
    <p><strong>Attendees Count:</strong> ${event.attendeesCount}</p>
    <p><strong>Start Date:</strong> ${new Date(event.startDate.seconds * 1000).toLocaleDateString()}</p>
    <p><strong>End Date:</strong> ${event.endDate ? new Date(event.endDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
    <h3>Participants:</h3>
    <table>
      <thead>
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>School ID</th>
          <th>Course</th>
          <th>Year Level</th>
        </tr>
      </thead>
      <tbody>
        ${event.attendance.map((participant) => `
          <tr>
            <td>${participant.studentInfo.fname}</td>
            <td>${participant.studentInfo.lname}</td>
            <td>${participant.schoolID}</td>
            <td>${participant.studentInfo.course}</td>
            <td>${participant.studentInfo.yearLevel}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const newWindow = window.open('', '', 'width=800,height=600');
  newWindow.document.write(printContent);
  newWindow.document.close();
  newWindow.focus();
  newWindow.print();
  newWindow.close();
};

  

  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Attendees Count',
      dataIndex: 'attendeesCount',
      key: 'attendeesCount',
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
      title: 'Moderator',
      dataIndex: 'moderatorName',
      key: 'moderatorName',
    },
    {
      title: 'Participants',
      dataIndex: 'attendance',
      key: 'attendance',
      render: (attendance) => (
        <Button onClick={() => showParticipants(attendance)}>View Participants</Button>
      ),
    },

    {
      title: 'Print',
      key: 'print',
      render: (text, record) => (
        <Button onClick={() => handlePrint(record)}>Print</Button>
      ),
    },
  ];

  return (
<div className="main-content">
<div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}> 
       
      <h2>Attendance Record</h2>
      <Button onClick={() => sortEvents('attendeesCount')}>Sort by Attendees</Button>
      <Table
        loading={loading}
        columns={columns}
        dataSource={events}
        rowKey={(record) => record.id}
      />

      {/* Modal for displaying participants */}
      <Modal
        title="Participants List"
        open={visible}
        onCancel={handleCancel}
        footer={null} // Remove default footer
        width={800}
      >
        <Table
          columns={[
            { title: 'First Name', dataIndex: ['studentInfo', 'fname'], key: 'fname' },
            { title: 'Last Name', dataIndex: ['studentInfo', 'lname'], key: 'lname' },
            { title: 'School ID', dataIndex: 'schoolID', key: 'schoolID' },
            { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn' },
            { title: 'Course', dataIndex: ['studentInfo', 'course'], key: 'course' },
            { title: 'Year Level', dataIndex: ['studentInfo', 'yearLevel'], key: 'yearLevel' },
            { title: 'Time Out', dataIndex: 'timeOut', key: 'timeOut' }
          ]}
          dataSource={selectedParticipants}
          rowKey={(record) => record.schoolID}
          pagination={false} // No pagination for modal list
        />
      </Modal>
    </div>
    </div>
  );
};

export default AttendanceRecord;
