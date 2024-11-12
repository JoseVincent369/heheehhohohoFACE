import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseutil/firebase_main';
import { Toast, ToastContainer } from 'react-bootstrap';
import './homestyles.css';


function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const [events, setEvents] = useState([]); // State for events
  const [selectedEvent, setSelectedEvent] = useState(''); // State for selected event
  const [eventConfirmed, setEventConfirmed] = useState(false); // State for event confirmation
  const [showPopup, setShowPopup] = useState(true); // State for popup visibility
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [manualSchoolID, setManualSchoolID] = useState(''); // State for manual School ID
  const [attendanceRecords, setAttendanceRecords] = useState([]); // Attendance data state
  const [attendanceType, setAttendanceType] = useState('timeIn');
  const [attendingUser, setAttendingUser] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const tempAttendance = useRef(new Set());
  const faceapi = window.faceapi;
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      const currentUser = FIREBASE_AUTH.currentUser;

      if (currentUser) {
        const eventsCollection = collection(FIRESTORE_DB, 'events');
        // Query for events where 'userInCharge' matches current user ID and 'status' is 'accepted'
        const eventsQuery = query(
          eventsCollection,
          where('userInCharge', 'array-contains', currentUser.uid),
          where('status', '==', 'accepted')
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsList);
      } else {
        console.log("No user is logged in.");
      }
    };

    loadEvents();
  }, []);


  const fetchAttendanceRecords = async () => {
    try {
      const attendanceRef = collection(FIRESTORE_DB, 'events', selectedEvent, 'attendance');
      const attendanceSnapshot = await getDocs(attendanceRef);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return attendanceList;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
  };

  // Video and face detection setup
  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      ]);
      startVideo();
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

      alert('Loaded!');

      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      document.body.append(canvas);
      canvasRef.current = canvas;

      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvas, displaySize);

      const detectFaces = async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas for new detections

        const results = resizedDetections.map(d =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        results.forEach((result, i) => {
          if (result._label !== 'unknown') {
            attendance(result._label);
          }

          const box = resizedDetections[i].detection.box;

          // Flip the box horizontally
          const invertedBox = {
            x: canvas.width - (box.x + box.width), // Invert the x-coordinate
            y: box.y,
            width: box.width,
            height: box.height
          };

          const drawBox = new faceapi.draw.DrawBox(invertedBox, {
            label: result.toString(),
          });
          drawBox.draw(canvas);
        });
      };

      const interval = setInterval(detectFaces, 500); // Adjust the interval as needed

      return () => {
        clearInterval(interval);
        if (videoRef.current) {
          const stream = videoRef.current.srcObject;
          if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
          }
        }
      };
    };

    if (selectedEvent && eventConfirmed) {
      loadModelsAndStartVideo();
      videoRef.current?.addEventListener('play', handleVideoPlay);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, [selectedEvent, eventConfirmed]);

  // Load labeled images for face recognition
  const loadLabeledImages = async () => {
    try {
      const users = await fetchUsersWithRole('user');
      const labeledFaceDescriptors = [];

      for (const user of users) {
        const descriptors = [];
        for (const imageType of ['front', 'left', 'right']) {
          const imageUrl = await fetchImageUrl(user.id, imageType);
          if (imageUrl) {
            const img = await faceapi.fetchImage(imageUrl);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (detections) {
              descriptors.push(detections.descriptor);
            }
          }
        }
        if (descriptors.length > 0) {
          const faceDescriptor = new faceapi.LabeledFaceDescriptors(user.schoolID, descriptors);
          labeledFaceDescriptors.push(faceDescriptor);
        }
      }

      return labeledFaceDescriptors;
    } catch (error) {
      console.error('Error loading labeled images:', error);
      return [];
    }
  };

  // Fetch users with specific role from Firestore
  const fetchUsersWithRole = async (role) => {
    try {
      const usersCollection = collection(FIRESTORE_DB, 'users');
      const q = query(usersCollection, where('role', '==', role));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // Fetch image URL for a user from Firestore
  const fetchImageUrl = async (userId, imageType) => {
    try {
      const userDoc = doc(FIRESTORE_DB, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        return userData.photos[imageType] || null;
      }
    } catch (error) {
      console.error(`Error fetching image URL for ${userId}:`, error);
    }
    return null;
  };

  const addAttendanceMessage = (message) => {
    setAttendanceMessages((prevMessages) => [...prevMessages, message]);
  };

  const attendanceUpdatesMap = {
    timeIn: 'timeIn',
    timeOut: 'timeOut',
  };


  // Update attendance function
  const attendance = async (label) => {
    if (label !== 'unknown' && !tempAttendance.current.has(label)) {
      tempAttendance.current.add(label);

      try {
        const user = await fetchUserBySchoolID(label);
        const event = events.find(e => e.id === selectedEvent);

        const isUserEligible =
        (event.organizations.length === 0 || event.organizations.includes(user.organization)) &&
          (event.courses.length === 0 || event.courses.includes(user.course)) &&
          (event.majors.length === 0 || event.majors.includes(user.major)) &&
          (event.yearLevels.length === 0 || event.yearLevels.includes(user.yearLevel));
          

        if (!isUserEligible) {
          const message = `${user.fname} ${user.lname} is not eligible to join the event.`;
          setToastMessage(message);
          setShowToast(true); 
          addAttendanceMessage(message);
          tempAttendance.current.delete(label);
          return;
        }

        const attendanceRef = collection(FIRESTORE_DB, 'events', selectedEvent, 'attendance');
        const attendanceQuery = query(attendanceRef, where('schoolID', '==', label));
        const querySnapshot = await getDocs(attendanceQuery);

        if (!querySnapshot.empty) {
          const attendanceDoc = querySnapshot.docs[0];
          const attendanceData = attendanceDoc.data();

          if (attendanceData[attendanceType]) {
            const message = `Attendance for ${attendanceType} already recorded for ${user.fname} ${user.lname}.`;
            alert(message);
            addAttendanceMessage(message);
            setAttendingUser(user);  // Update the attending user
            return;
          }

          await updateDoc(attendanceDoc.ref, {
            [attendanceUpdatesMap[attendanceType]]: new Date().toLocaleString(),
          });
          const message = `${user.fname} ${user.lname} has been marked as ${attendanceType}.`;
          alert(message);
          addAttendanceMessage(message);
          setAttendingUser(user);  // Update the attending user
        } else {
          const now = new Date();
          await addDoc(attendanceRef, {
            schoolID: label,
            [attendanceUpdatesMap[attendanceType]]: now.toLocaleString(),
            studentInfo: {
              fname: user.fname,
              lname: user.lname,
              mname: user.mname,
              age: user.age,
              email: user.email,
              course: user.course,
              major: user.major,
              yearLevel: user.yearLevel,
              organization: user.organization,
            },
          });
          const message = `${user.fname} ${user.lname} has been marked as ${attendanceType}.`;
          alert(message);
          addAttendanceMessage(message);
          setAttendingUser(user);  // Update the attending user
        }
      } catch (error) {
        console.error('Error updating attendance record:', error);
      }
    }
  };

  // Manual attendance function
  const handleManualAttendance = async () => {
    if (manualSchoolID.trim()) {
      const event = events.find(e => e.id === selectedEvent);

      if (!event) {
        alert('Event not found or not selected.');
        return;
      }

      try {
        const user = await fetchUserBySchoolID(manualSchoolID.trim());
        const attendanceRef = collection(FIRESTORE_DB, 'events', selectedEvent, 'attendance');
        const attendanceQuery = query(attendanceRef, where('schoolID', '==', manualSchoolID.trim()));
        const querySnapshot = await getDocs(attendanceQuery);

        if (!user) {
          alert('User not found.');
          return;
        }

        const isUserEligible =
        (event.organizations.length === 0 || event.organizations.includes(user.organization)) &&
          (event.courses.length === 0 || event.courses.includes(user.course)) &&
          (event.majors.length === 0 || event.majors.includes(user.major)) &&
          (event.yearLevels.length === 0 || event.yearLevels.includes(user.yearLevel));

        if (!isUserEligible) {
          const message = `User ${user.fname} ${user.lname} is not eligible to join the event.`;
          setToastMessage(message);
      setShowToast(true); // Show the toast
          addAttendanceMessage(message);
          return;
        }

        if (!querySnapshot.empty) {
          const attendanceDoc = querySnapshot.docs[0];
          const attendanceData = attendanceDoc.data();

          if (attendanceData[attendanceType]) {
            const message = `Attendance for ${attendanceType} already recorded for ${user.fname} ${user.lname}.`;
            alert(message);
            addAttendanceMessage(message);
            setAttendingUser(user);  // Update the attending user
            return;
          }

          await updateDoc(attendanceDoc.ref, {
            [attendanceUpdatesMap[attendanceType]]: new Date().toLocaleString(),
          });
          const message = `${user.fname} ${user.lname} has been marked as ${attendanceType}.`;
          alert(message);
          addAttendanceMessage(message);
          setAttendingUser(user);  // Update the attending user
        } else {
          const now = new Date();
          await addDoc(attendanceRef, {
            schoolID: manualSchoolID.trim(),
            [attendanceUpdatesMap[attendanceType]]: now.toLocaleString(),
            studentInfo: {
              fname: user.fname,
              lname: user.lname,
              mname: user.mname,
              age: user.age,
              email: user.email,
              course: user.course,
              major: user.major,
              yearLevel: user.yearLevel,
              organization: user.organization,
            },
          });
          const message = `${user.fname} ${user.lname} has been marked as ${attendanceType}.`;
          alert(message);
          addAttendanceMessage(message);
          setAttendingUser(user);  // Update the attending user
        }

        setManualSchoolID('');

      } catch (error) {
        console.error('Error updating attendance record:', error);
        alert('An error occurred while updating attendance.');
      }
    } else {
      alert('Please enter a valid school ID.');
    }
  };
  

  // Fetch user by school ID
  const fetchUserBySchoolID = async (schoolID) => {
    try {
      const usersCollection = collection(FIRESTORE_DB, 'users');
      const q = query(usersCollection, where('schoolID', '==', schoolID));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
    } catch (error) {
      console.error(`Error fetching user by schoolID ${schoolID}:`, error);
    }
    return null;
  };

  const handleViewAttendance = async () => {
    const records = await fetchAttendanceRecords();
    setAttendanceRecords(records);
    setIsModalOpen(true);
  };

  const handleConfirmEvent = () => {
    setEventConfirmed(true);
    setShowPopup(false);
  };
  
//enterbutton
  const handleAttendanceSubmit = () => {
    if (manualSchoolID.trim()) {
      const confirmed = window.confirm(`Are you sure you want to record attendance for School ID: ${manualSchoolID.trim()}?`);
      if (confirmed) {
        handleManualAttendance();
      }
    } else {
      alert('Please enter a valid school ID.');
    }
  };
  



  // Modal component with attendance records in a table format
const AttendanceModal = ({ isOpen, onClose, records }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Attendance Records</h2>
        <button className="close-button" onClick={onClose}>Close</button>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Age</th>
              <th>Course</th>
              <th>Year Level</th>
              <th>Time-In</th>
              <th>Time-Out</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{`${record.studentInfo.fname} ${record.studentInfo.mname} ${record.studentInfo.lname}`}</td>
                <td>{record.studentInfo.age}</td>
                <td>{record.studentInfo.course}</td>
                <td>{record.studentInfo.yearLevel}</td>
                <td>{record.timeIn}</td>
                <td>{record.timeOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


return (
  <>
      {showPopup && !eventConfirmed && (
        <div className="popup">
          <h2>Select Event</h2>
          <select
            onChange={(e) => setSelectedEvent(e.target.value)}
            value={selectedEvent}
            className="form-select mb-2"
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <select
            value={attendanceType}
            onChange={(e) => setAttendanceType(e.target.value)}
            className="form-select mb-2"
          >
            <option value="timeIn">Time In</option>
            <option value="timeOut">Time Out</option>
          </select>
          <button
            onClick={handleConfirmEvent}
            disabled={!selectedEvent}
            className="btn btn-primary mb-2"
          >
            Confirm
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Close
          </button>
        </div>
      )}

      {!showPopup && eventConfirmed && (
        <div className="main-container">
          <h1>
            "{events.find(e => e.id === selectedEvent)?.name}"
            <span style={{ fontSize: '0.6em', color: 'gray' }}>
              - ({attendanceType})
            </span>
          </h1>

          <div className="attendance-actions">
            <div className="button-att">
              <button onClick={handleViewAttendance}>
                Attendance Records
              </button>
            </div>
  
            <div className="manual-input">
              <input
                type="text"
                value={manualSchoolID}
                onChange={(e) => setManualSchoolID(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAttendanceSubmit();
                  }
                }}
                placeholder="Enter School ID"
              />

              {/* Hiding the select dropdown */}
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value)}
                style={{ display: 'none' }} // This hides the dropdown
              >
                <option value="timeIn">Time In</option>
                <option value="timeOut">Time Out</option>
              </select>

              <button onClick={handleAttendanceSubmit}>
                Submit
              </button>
            </div>
          </div>

          <h3 className='jj'>Student Information:</h3>
          <div className="video-section">
            <div className="user-info">
              {attendingUser ? (
                <div>
                  <p><strong>Name:</strong> {attendingUser.fname} {attendingUser.lname}</p>
                  <p><strong>ID:</strong> {attendingUser.schoolID}</p>
                  <p><strong>Age:</strong> {attendingUser.age}</p>
                  <p><strong>Year Level:</strong> {attendingUser.yearLevel}</p>
                  <p><strong>Course:</strong> {attendingUser.course}</p>
                </div>
              ) : (
                <p>No user currently attending.</p>
              )}
            </div>

            <div className="video-container">
              <video
                ref={videoRef}
                width={760}
                height={570}
                autoPlay
                muted
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="video-canvas"
              />
            </div>

            <div className="attendance-messages">
              <h3>Attendance Notifications: </h3>
              {attendanceMessages.slice(-7).map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </div>
          </div>

          <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Eligibility Check</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

          <AttendanceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            records={attendanceRecords}
          />
        </div>
      )}
  </>
);


}

export default Home_main;