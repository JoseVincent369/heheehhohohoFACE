import React, { useState, useEffect } from 'react';
import { collection, getDocs, where, query, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { Table, Button, Modal  } from 'antd';

const ModeratorsRecord = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(); // Firebase Auth instance
  const [visible, setVisible] = useState(false); // State for modal visibility
  const [selectedParticipants, setSelectedParticipants] = useState([]); 


  useEffect(() => {
    const fetchModeratorName = async (moderatorId) => {
      const moderatorDocs = await getDocs(query(collection(FIRESTORE_DB, 'users'), where('role', '==', 'moderator')));
      
      // Find the moderator with the specified ID
      const moderator = moderatorDocs.docs.find(doc => doc.id === moderatorId);
      return moderator ? moderator.data().fullName : 'Unknown Moderator';
    };

    const fetchEvents = async (moderatorId) => {
        try {
          // Query events where 'createdBy' matches the current moderator's UID
          const eventsQuery = query(
            collection(FIRESTORE_DB, 'events'),
            where('createdBy', '==', moderatorId),
            where('status', '==', 'accepted')
          );
  
          const eventsCollection = await getDocs(eventsQuery);
          const eventsData = [];
  
          for (const eventDoc of eventsCollection.docs) {
            const eventId = eventDoc.id;
            const eventData = eventDoc.data();
  
            // Fetch attendance for this event
            const attendanceCollection = await getDocs(collection(FIRESTORE_DB, `events/${eventId}/attendance`));
            const attendance = attendanceCollection.docs.map(doc => doc.data()).map(participant => ({
                lname: participant.studentInfo.lname, // Access lname from studentInfo map
                fname: participant.studentInfo.fname,
                course: participant.studentInfo.course,
                yearLevel: participant.studentInfo.yearLevel,
                schoolID: participant.schoolID,
                timeIn: participant.timeIn,
                timeOut: participant.timeOut,
              }));
              
              
  
            // Fetch the moderator's name based on the createdBy field
            const moderatorName = await fetchModeratorName(eventData.createdBy);
  
            // Extract emails from userInCharge
            const userEmails = eventData.userInCharge ? eventData.userInCharge.map(user => user.email).join(', ') : 'No emails';
  
            eventsData.push({
              ...eventData,
              id: eventId,
              attendance,
              attendeesCount: attendance.length, // Number of attendees
              moderatorName, // Store the moderator's name
              userEmails, // Add the emails to the event data
            });
          }
  
          console.log('Fetched Moderator Events:', eventsData);
          setEvents(eventsData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching moderator events:', error);
          setLoading(false);
        }
      };
  



    // Monitor authentication state to get the logged-in moderator's UID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Logged-in Moderator UID:', user.uid); // Log the current moderator's UID
        fetchEvents(user.uid); // Fetch events created by this moderator
      } else {
        setLoading(false); // Stop loading if no user is logged in
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [auth]);

  // Sorting function (by attendees count or any field)
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
      render: (endDate) => {
        return endDate ? new Date(endDate.seconds * 1000).toLocaleDateString() : 'N/A'; // Handle potential null/undefined value
      },
    },
    {
        title: 'User In-Charge', // New column for user emails
        dataIndex: 'userEmails',
        key: 'userEmails',
      },
    {
        title: 'Participants',
        dataIndex: 'attendance',
        key: 'attendance',
        render: (attendance) => (
          <>
            <Button onClick={() => showParticipants(attendance)}>View Participants</Button>
          </>
        ),
      },
    ];  
  

  return (
    <div className="main-content">
      <div>
        <h2>Moderators Record</h2>
        <Table
          loading={loading}
          columns={columns}
          dataSource={events}
          rowKey={(record) => record.id}
        />
      </div>

      {/* Modal for displaying participants */}
      <Modal
        title="Participants List"
        visible={visible}
        onCancel={handleCancel}
        footer={null} // Remove default footer
        width={800}
      >
        

<Table
  columns={[
    { title: 'First Name', dataIndex: 'fname', key: 'fname' },
    { title: 'Last Name', dataIndex: 'lname', key: 'lname' },
    { title: 'School ID', dataIndex: 'schoolID', key: 'schoolID' },
    { title: 'course', dataIndex: 'course', key: 'course' },
    { title: 'yearLevel', dataIndex: 'yearLevel', key: 'yearLevel' },
    { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn' },
    { title: 'Time Out', dataIndex: 'timeOut', key: 'timeOut' }
  ]}
  dataSource={selectedParticipants}
  rowKey={(record) => record.schoolID}
  pagination={false} // No pagination for modal list
/>


      </Modal>
    </div>
  );
};

export default ModeratorsRecord;
