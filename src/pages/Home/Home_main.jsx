import React, { useEffect, useRef, useState } from 'react';
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage functions
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB, STORAGE } from "../../firebaseutil/firebase_main";

function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceapi = window.faceapi;
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const tempAttendace = useRef([]);

  useEffect(() => {
    // Load face-api models and start video
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

    // Start video stream
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

    // Handle video playback
    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

      alert('Loaded');

      if (canvasRef.current && videoRef.current) {
        // Set canvas dimensions to match video dimensions
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const results = resizedDetections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        results.forEach((result, i) => {
          attendance(result._label);

          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString(),
          });
          drawBox.draw(canvasRef.current);
        });
      }, 100);
    };

    // Load models and start video when component mounts
    loadModelsAndStartVideo();

    // Set up event listener for video play
    videoRef.current?.addEventListener('play', handleVideoPlay);

    // Cleanup function to stop video stream and remove event listener
    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, []);

  // Load labeled images for face recognition
  const loadLabeledImages = async () => {
    const usersCollection = collection(FIRESTORE_DB, 'users');
    const userSnapshots = await getDocs(usersCollection);
    const storage = getStorage(FIREBASE_APP);
  
    // Iterate over each user document in Firestore
    const labeledDescriptorsPromises = userSnapshots.docs.map(async (doc) => {
      const userData = doc.data();
      const label = userData.fname; // Using first name as label, you can adjust this
  
      // Paths to the images in Firebase Storage
      const frontRef = ref(storage, `users/${doc.id}/front`);
      const leftRef = ref(storage, `users/${doc.id}/left`);
      const rightRef = ref(storage, `users/${doc.id}/right`);
  
      // Fetch the download URLs for each image
      const frontUrl = await getDownloadURL(frontRef);
      const leftUrl = await getDownloadURL(leftRef);
      const rightUrl = await getDownloadURL(rightRef);
  
      const descriptions = [];
  
      // Process each image URL
      for (let imgUrl of [frontUrl, leftUrl, rightUrl]) {
        const img = await faceapi.fetchImage(imgUrl);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detection.descriptor);
      }
  
      // Return the labeled face descriptors
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    });
  
    // Wait for all promises to resolve
    return Promise.all(labeledDescriptorsPromises);
  };
  
  // Filter out duplicate attendances
  const filter = (label) => {
    return tempAttendace.current.filter((res) => res === label).length <= 0;
  };
  
  // Manage attendance logs
  const attendance = (label) => {
    if (filter(label) && label !== 'unknown') {
      tempAttendace.current.push(label);
      setAttendanceMessages((prevMessages) => [
        ...prevMessages,
        `Attendance Added Successfully for ${label}`,
      ]);
    }
  };
  

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
      <div style={{ flex: '1', backgroundColor: '#444', padding: '20px', borderRadius: '8px', marginRight: '10px', maxHeight: '400px', overflowY: 'auto' }}>
        <h3 style={{ color: 'white' }}>Attendance Logs</h3>
        <ul style={{ color: 'white' }}>
          {attendanceMessages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
      <div style={{ flex: '2', position: 'relative', backgroundColor: '#444', padding: '20px', borderRadius: '8px' }}>
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          muted
          style={{ display: 'block', borderRadius: '8px' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            borderRadius: '8px',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

export default Home_main;
