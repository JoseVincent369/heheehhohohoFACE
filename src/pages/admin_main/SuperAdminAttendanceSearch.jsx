// SuperAdminAttendanceSearch.jsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where  } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { Table, Input, Modal, Button } from 'antd';
import jsPDF from 'jspdf';

const { Search } = Input;

const SuperAdminAttendanceSearch = () => {
  const [studentEvents, setStudentEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEventList, setStudentEventList] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Super admins do not need to fetch departments
        console.log('Super admin logged in:', user.uid);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSearch = async (studentName) => {
    setLoading(true);
    setStudentEvents([]);

    try {
      // Step 1: Fetch students by role 'user'
      const studentsQuery = query(
        collection(FIRESTORE_DB, 'users'),
        where('role', '==', 'user')
      );
      const studentsSnapshot = await getDocs(studentsQuery);

      // Log fetched students
      console.log("Fetched Students:", studentsSnapshot.docs.map(doc => doc.data()));

      // Filter students by name
      const matchedStudents = studentsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const fullName = `${data.fname} ${data.lname}`.toLowerCase();
        return fullName.includes(studentName.toLowerCase());
      });

      console.log("Matched Students:", matchedStudents.map(doc => doc.data())); // Log matched students

      // Step 2: For each matched student, fetch their attendance
      const allStudentEvents = [];

      for (const student of matchedStudents) {
        const studentId = student.data().schoolID; // Fetch student ID based on schoolID field in attendance
        const studentData = student.data();

        // Fetch events where the student has attended
        const eventsQuery = collection(FIRESTORE_DB, 'events');
        const eventsSnapshot = await getDocs(eventsQuery);

        for (const eventDoc of eventsSnapshot.docs) {
          const eventId = eventDoc.id;
          const attendanceRef = collection(FIRESTORE_DB, `events/${eventId}/attendance`);
          const attendanceQuery = query(attendanceRef, where('schoolID', '==', studentId));
          const attendanceSnapshot = await getDocs(attendanceQuery);

          if (!attendanceSnapshot.empty) {
            attendanceSnapshot.docs.forEach(attendanceDoc => {
                const attendanceData = attendanceDoc.data();
                allStudentEvents.push({
                    ...eventDoc.data(),
                    eventName: eventDoc.data().name,
                    attendanceDate: attendanceData.timeIn ? attendanceData.timeIn : null, // Use timeIn directly
                    timeOut: attendanceData.timeOut ? attendanceData.timeOut : null, // Use timeOut directly
                    studentName: `${studentData.fname} ${studentData.lname}`,
                    studentDepartment: studentData.department,
                });
            });
        }
        
        }
      }

      setStudentEvents(allStudentEvents);
    } catch (error) {
      console.error('Error fetching student events:', error);
    }

    setLoading(false);
  };

  const handleRowClick = (record) => {
    setModalVisible(true);
    setSelectedStudent(record.studentName);

    // Fetch events for the selected student
    const eventsForSelectedStudent = studentEvents.filter(event => event.studentName === record.studentName);
    setStudentEventList(eventsForSelectedStudent);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Events attended by ${selectedStudent}`, 10, 10);

    // Add a table header
    const headers = ['Event Name', 'Start Date', 'End Date'];
    const startX = 10;
    const startY = 20;
    const rowHeight = 10;

    headers.forEach((header, index) => {
      doc.text(header, startX + index * 60, startY); // Adjust column width
    });

    // Add a line below headers
    doc.line(startX, startY + 2, startX + 180, startY + 2); // Draw line below header

    // Populate data
    studentEventList.forEach((event, index) => {
      const yPosition = startY + (index + 1) * rowHeight + 5; // Adjust for header and spacing
      doc.text(`• ${event.eventName}`, startX, yPosition);
      doc.text(new Date(event.startDate.seconds * 1000).toLocaleString(), startX + 60, yPosition);
      doc.text(new Date(event.endDate.seconds * 1000).toLocaleString(), startX + 120, yPosition);
    });

    doc.save(`Attendance_Report_${selectedStudent}.pdf`);
  };

  const columns = [
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Department', dataIndex: 'studentDepartment', key: 'studentDepartment' },
    { title: 'Event Name', dataIndex: 'eventName', key: 'eventName' },
    {
        title: 'Time In',
        dataIndex: 'startDate',
        key: 'startDate',
        render: (timestamp) => (timestamp && timestamp.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Invalid Date'),
      },
      {
        title: 'Time Out',
        dataIndex: 'endDate',
        key: 'endDate',
        render: (timestamp) => (timestamp && timestamp.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Invalid Date'),
      },
    
  ];
  

  const handleModalClose = () => {
    setModalVisible(false);
    setStudentEventList([]);
    setSelectedStudent(null);
  };

  return (
    <div className="main-content">
      <div className="student-attendance-search">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Search Student Attendance</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Search
            placeholder="Search the student name you want to Search"
            onSearch={handleSearch}
            enterButton
            style={{ width: 400 }}
          />
        </div>
        <Table
          loading={loading}
          columns={columns}
          dataSource={studentEvents}
          rowKey={(record) => `${record.studentName}-${record.eventName}`}
          onRow={(record) => ({
            onClick: () => handleRowClick(record), // Click on row to open modal
          })}
        />

        <Modal
          title={<span style={{ color: '#ff5733' }}>Events for {selectedStudent}</span>}
          open={modalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="print" onClick={generatePDF}>
              Print as PDF
            </Button>
          ]}
        >
          <Table
            dataSource={studentEventList}
            rowKey="eventName"
            columns={[
              { title: 'Event Name', dataIndex: 'eventName', key: 'eventName' },
              {
                title: 'Start Date',
                dataIndex: 'startDate',
                key: 'startDate',
                render: (timestamp) => (timestamp && timestamp.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Invalid Date'),
              },
              {
                title: 'End Date',
                dataIndex: 'endDate',
                key: 'endDate',
                render: (timestamp) => (timestamp && timestamp.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Invalid Date'),
              },
            ]}
          />
        </Modal>
      </div>
    </div>
  );
};

export default SuperAdminAttendanceSearch;
