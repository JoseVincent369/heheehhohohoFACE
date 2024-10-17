import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, addDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { getAuth } from 'firebase/auth'; 
import './Homestyles.css';
import Logout from '../components/Logout';

function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const [events, setEvents] = useState([]); // State for events
  const [selectedEvent, setSelectedEvent] = useState(''); // State for selected event
  const [eventConfirmed, setEventConfirmed] = useState(false); // State for event confirmation
  const [showPopup, setShowPopup] = useState(true); // State for popup visibility
  const [attendingUser, setAttendingUser] = useState(null); // State for currently attending user
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [attendanceRecords, setAttendanceRecords] = useState([]); // Attendance data state
  const [officerID, setOfficerID] = useState(null); // Store the officer ID
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State for login status
  const tempAttendance = useRef(new Set());
  const faceapi = window.faceapi;

  

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const currentOfficer = user.uid; // Assuming uid is the officer ID
        setOfficerID(currentOfficer);
        setIsLoggedIn(true); // Update login status
      } else {
        setIsLoggedIn(false); // User is logged out
        setOfficerID(null); // Reset officer ID
      }
    });
  
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    if (officerID) {
        const loadEvents = async () => {
            const eventsCollection = collection(FIRESTORE_DB, 'events');
            // Fetch events where officerID is in 'officers' and status is 'accepted'
            const q = query(
                eventsCollection, 
                where('officers', 'array-contains', officerID),
                where('status', '==', 'accepted') // Add this line
            );
            const eventsSnapshot = await getDocs(q);
            const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsList);
        };

        loadEvents();
    }
}, [officerID]); // Fetch events when officerID changes




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
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.4);

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

  const attendanceCache = useRef(new Set()); // Cache to store attended users

  const attendance = async (label) => {
    if (label !== 'unknown' && !tempAttendance.current.has(label)) {
      tempAttendance.current.add(label); // Avoid duplicate detection for the current session
  
      // Check if user is already in the attendance cache
      if (attendanceCache.current.has(label)) {
        alert(`${label} has already been recorded as attending this event (from cache).`);
        return;
      }
  
      try {
        const user = await fetchUserBySchoolID(label);
        const event = events.find(e => e.id === selectedEvent);
  
        // Check if user matches the event's requirements
        const isUserEligible =
          (event.department === user.department) &&
          (event.courses.length === 0 || event.courses.includes(user.course)) &&
          (event.majors.length === 0 || event.majors.includes(user.major)) &&
          (event.yearLevels.length === 0 || event.yearLevels.includes(user.yearLevel)) &&
          (event.organizations.length === 0 || event.organizations.includes(user.organization));
  
        if (!isUserEligible) {
          alert(`${user.fname} ${user.lname} is not eligible to attend this event.`);
          setAttendingUser(null);
          return;
        }
  
        // Query Firestore to see if the user has already attended the event
        const attendanceRef = collection(FIRESTORE_DB, 'events', selectedEvent, 'attendance');
        const attendanceQuery = query(attendanceRef, where('schoolID', '==', label));
        const querySnapshot = await getDocs(attendanceQuery);
  
        if (!querySnapshot.empty) {
          // Add user to cache since they have already attended
          attendanceCache.current.add(label); // Update cache with this schoolID
          alert(`${user.fname} ${user.lname} has already attended this event (from Firestore).`);
          return; // Exit the function to avoid duplicate entries
        }

        const now = new Date();

        if (isUserEligible) {
          // Add attendance record to Firestore
          await addDoc(attendanceRef, {
            schoolID: label,
            timestamp: now.toLocaleString(),
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
          const isAttendanceAllowed = (studentDetails, event) => {
            // Check for department match first (highest priority)
            if (event.selectedDepartments.includes(studentDetails.department)) {
              return true;
            }
            
            // If no department match, check for course match
            if (event.courses.includes(studentDetails.course)) {
              return true;
            }
          
            // If no course match, check for major match
            if (event.majors.includes(studentDetails.major)) {
              return true;
            }
          
            // If no major match, check for year level match (lowest priority)
            if (event.yearLevels.includes(studentDetails.yearLevel)) {
              return true;
            }
          
            // If none of the conditions match, attendance is not allowed
            return false;
          };
          
          // Example usage
          if (isAttendanceAllowed(studentDetails, event)) {
            console.log('Student is allowed for attendance');
          } else {
            console.log('Student is not allowed for attendance');
          }
          

          // Update the cache and attendance messages
          attendanceCache.current.add(label); // Add the user to the cache after successful attendance
          setAttendanceMessages(prevMessages => [
            ...prevMessages,
            `${user.fname} ${user.lname} attended ${event?.name} at ${now.toLocaleString()}`,
          ]);
          setAttendingUser(user);

        } else {
          alert(`${user.fname} ${user.lname} is not eligible to attend this event.`);
          setAttendingUser(null);
        }

      } catch (error) {
        console.error('Error adding attendance record:', error);
      }
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
    const records = await fetchAttendanceRecords(); // Fetch attendance records
    setAttendanceRecords(records); // Store them in the state
    setIsModalOpen(true); // Open the modal
  };
  

  // Confirm event selection and close popup
  const handleConfirmEvent = () => {
    setEventConfirmed(true);
    setShowPopup(false); // Close popup after confirming
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
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{`${record.studentInfo.fname} ${record.studentInfo.mname} ${record.studentInfo.lname}`}</td>
                <td>{record.studentInfo.age}</td>
                <td>{record.studentInfo.course}</td>
                <td>{record.studentInfo.yearLevel}</td>
                <td>{record.timestamp}</td>
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
    {isLoggedIn ? (
      <>
        {/* Render the main content of the app here */}
        {/* Existing components and logic */}
      </>
    ) : (
      <div>Please log in to access this page.</div>
    )}
      {/* Event Title as Header */}
      {eventConfirmed && <h1>{events.find(e => e.id === selectedEvent)?.name}</h1>}

      {/* View Attendance Records Button */}
<div className="button-att">
  <button onClick={handleViewAttendance}>
    Attendance Records
  </button>
</div>


      {/* Event Selection Popup */}
      {showPopup && (
        <div className="popup">
          <h2>Select Event</h2>
          <select
            onChange={(e) => setSelectedEvent(e.target.value)}
            value={selectedEvent}
          >
            <option value="">Select an event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
  
          <button onClick={handleConfirmEvent} disabled={!selectedEvent}>
            Confirm
          </button>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
      <Logout/>
  
      {/* Main Content */}
      <div style={{ display: 'flex', width: 720, height: 560 }}>
        {/* Video Section */}
        <div style={{ flex: 1, position: 'relative' }}>
          <video
            ref={videoRef}
            width={720}
            height={560}
            autoPlay
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', left: 0, top: 0, transform: 'scaleX(-1)', zIndex: 1 }}
          />
        </div>
  
        {/* User Information Section */}
        <div style={{ width: '500px', backgroundColor: '#f9f9f9', padding: '80px' }}>
          <h3>Attending User Info</h3>
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
      </div>

  
      {/* Render Attendance Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        records={attendanceRecords}
      />
      {/* Overlaying Attendance Messages */}
          <div style={{
            position: 'relative',
            top: '-100px',
            left: 0,
            width: '100%',
            color: 'white',
            padding: '10px',
            zIndex: 2,
            pointerEvents: 'none'  // Allow interaction with the video underneath
          }}>
            <h3>Attendance Messages</h3>
            {attendanceMessages.map((message, index) => (
              <p key={index} style={{ margin: 0 }}>{message}</p>
            ))}
          </div>
      
    </>
  );
  

}

export default Home_main;
