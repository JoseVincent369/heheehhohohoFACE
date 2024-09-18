import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import * as faceapi from 'face-api.js';

function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const tempAttendance = useRef(new Set());
  const faceapi = window.faceapi;

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

      alert('Loaded');

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
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString(),
          });
          drawBox.draw(canvas);
        });
      };

      // Reduce the frequency of detection to improve performance
      const interval = setInterval(detectFaces, 500); // Adjust the interval as needed

      // Cleanup function to clear interval
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

    loadModelsAndStartVideo();
    videoRef.current?.addEventListener('play', handleVideoPlay);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, []);

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

  const attendance = (label) => {
    if (!tempAttendance.current.has(label) && label !== 'unknown') {
      tempAttendance.current.add(label);
      setAttendanceMessages(prevMessages => [
        ...prevMessages,
        `${label} recognized at ${new Date().toLocaleTimeString()}`
      ]);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
      {/* Attendance Logs Section */}
      <div style={{ flex: '1', backgroundColor: '#444', padding: '20px', borderRadius: '8px', marginRight: '10px', maxHeight: '400px', overflowY: 'auto' }}>
        <h3 style={{ color: 'white' }}>Attendance Logs</h3>
        <ul style={{ color: 'white' }}>
          {attendanceMessages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
  
      {/* Video and Canvas Section */}
      <div
        style={{
          flex: '2',
          position: 'relative',
          backgroundColor: '#444',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        {/* Video Feed */}
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          muted
          style={{
            display: 'block',
            borderRadius: '8px',
            transform: 'scaleX(-1)', // Flips the video to correct the inversion for the front camera
          }}
        />
  
        {/* Canvas for Face Recognition */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            borderRadius: '8px',
            zIndex: 1,
            transform: 'scaleX(-1)', // Match the canvas flip to ensure drawings align correctly
          }}
        />
      </div>
    </div>
  );
}  

export default Home_main;
