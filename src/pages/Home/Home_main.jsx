import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, addDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';

function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const [events, setEvents] = useState([]); // State for events
  const [selectedEvent, setSelectedEvent] = useState(''); // State for selected event
  const [eventConfirmed, setEventConfirmed] = useState(false); // State for event confirmation
  const [showConfirmPopup, setShowConfirmPopup] = useState(false); // State for popup visibility
  const tempAttendance = useRef(new Set());
  const faceapi = window.faceapi;

  // Fetch events from Firestore
  useEffect(() => {
    const loadEvents = async () => {
      const eventsCollection = collection(FIRESTORE_DB, 'events');
      const eventsSnapshot = await getDocs(eventsCollection);
      const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsList);
    };

    loadEvents();
  }, []);

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

      alert('Models Loaded!');

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
          const faceDescriptor = new faceapi.LabeledFaceDescriptors(user.lname, descriptors);
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

  // Mark attendance and update Firestore
  const attendance = async (label) => {
    if (!tempAttendance.current.has(label) && label !== 'unknown') {
      tempAttendance.current.add(label);

      try {
        const attendanceRef = collection(FIRESTORE_DB, 'events', selectedEvent, 'attendance');

        await addDoc(attendanceRef, {
          attendee: label,
          timestamp: new Date().toISOString(),
        });

        setAttendanceMessages(prevMessages => [
          ...prevMessages,
          `${label} recognized and attendance recorded at ${new Date().toLocaleTimeString()}`
        ]);
      } catch (error) {
        console.error('Error adding attendance record:', error);
      }
    }
  };

  // Confirm event selection
  const handleConfirmEvent = () => {
    setEventConfirmed(true);
    setShowConfirmPopup(false);
  };

  return (
    <>
      <h2>Select Event</h2>
      <select 
        onChange={(e) => setSelectedEvent(e.target.value)} 
        value={selectedEvent} 
        disabled={eventConfirmed} // Disable if confirmed
      >
        <option value="">Select an event</option>
        {events.map(event => (
          <option key={event.id} value={event.id}>{event.name}</option>
        ))}
      </select>

      {!eventConfirmed && (
        <button
          onClick={() => setShowConfirmPopup(true)}
          disabled={!selectedEvent}
        >
          Confirm Event
        </button>
      )}

      {showConfirmPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Confirm Event</h3>
            <p>Are you sure you want to confirm this event: {events.find(e => e.id === selectedEvent)?.name}?</p>
            <button onClick={handleConfirmEvent}>Yes</button>
            <button onClick={() => setShowConfirmPopup(false)}>No</button>
          </div>
        </div>
      )}

      <video ref={videoRef} width={720} height={560} autoPlay muted style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0 }} />

      <div>
        <h3>Attendance Messages</h3>
        {attendanceMessages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </>
  );
}

export default Home_main;
