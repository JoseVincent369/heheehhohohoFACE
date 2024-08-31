import React, { useEffect, useRef, useState } from 'react';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "../../firebaseutil/firebase_main";
import './homestyles.css';

function Home_main() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceapi = window.faceapi;
  const [attendanceMessages, setAttendanceMessages] = useState([]);
  const tempAttendace = useRef([]);

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      // Load face-api models
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

    loadModelsAndStartVideo();
    videoRef.current?.addEventListener('play', handleVideoPlay);

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

  const loadLabeledImages = async () => {
    const usersCollection = collection(FIRESTORE_DB, 'users');
    const userSnapshots = await getDocs(usersCollection);
    const storage = getStorage(FIREBASE_APP);

    const labeledDescriptorsPromises = userSnapshots.docs.map(async (doc) => {
      const userData = doc.data();
      const label = userData.lname || "unknown";

      const fetchImage = async (userId, imageType) => {
        try {
            // Fetch the user document from Firestore
            const userDoc = await getDoc(doc(FIRESTORE_DB, `users/${userId}`));
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const imageUrl = userData.photos?.[imageType]; // Assuming photos field has links stored
    
                // Check if the image URL exists
                if (imageUrl) {
                    return imageUrl;
                } else {
                    console.warn(`Image ${imageType}.jpg not found in Firestore for user ${userId}`);
                    // Provide a fallback image URL if the image is not found in Firestore
                    return 'path/to/default-image.jpg';
                }
            } else {
                console.error(`User document with ID ${userId} does not exist.`);
                return 'path/to/default-image.jpg';
            }
        } catch (error) {
            console.error(`Error fetching image ${imageType} for user ${userId}:`, error);
            // Return a fallback image URL in case of error
            return 'path/to/default-image.jpg';
        }
    };
    
    

      const descriptions = [];

      try {
        for (let key in imageRefs) {
          try {
            const imgUrl = await getDownloadURL(imageRefs[key]);
            const img = await faceapi.fetchImage(imgUrl);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
              descriptions.push(detection.descriptor);
            }
          } catch (error) {
            if (error.code === 'storage/object-not-found') {
              console.warn(`Image ${key}.jpg not found for user ${label}:`, error);
            } else {
              console.error(`Error fetching image ${key}.jpg for user ${label}:`, error);
            }
          }
        }

        if (descriptions.length === 0) {
          return new faceapi.LabeledFaceDescriptors('unknown', []);
        }
      } catch (error) {
        console.error(`Error processing images for user ${label}:`, error);
        return new faceapi.LabeledFaceDescriptors('unknown', []);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    });

    return Promise.all(labeledDescriptorsPromises);
  };

  const filter = (label) => {
    return tempAttendace.current.filter((res) => res === label).length <= 0;
  };

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
      <div
        style={{
          flex: '2',
          position: 'relative',
          backgroundColor: '#444',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
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
