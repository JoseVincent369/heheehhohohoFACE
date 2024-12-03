import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  setDoc,
  doc,
  getFirestore,
  getDoc,
} from "firebase/firestore";
import { FIREBASE_APP } from "../../firebaseutil/firebase_main";
import { Modal, Button, Spinner } from "react-bootstrap";
import { Select } from "antd";
const { Option } = Select;

const TrainAndStoreData = () => {
  const faceapi = window.faceapi;
  const [allCoursesData, setAllCoursesData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const db = getFirestore(FIREBASE_APP);

  // Load face recognition models
  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      ]);
    };
    loadModelsAndStartVideo();
    return () => {};
  }, []);

  // Fetch all courses and associated users
  const trainCoursesData = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);
  
      const labeledFaceDescriptors = []; // To store user data for training
  
      for (const doc of snapshot.docs) {
        const user = { id: doc.id, ...doc.data() };
  
        if (!user.schoolID) continue; // Skip if schoolID is not available
  
        const descriptors = [];
        for (const imageType of ["front", "left", "right"]) {
          const imageUrl = user.photos[imageType];
          if (imageUrl) {
            const img = await faceapi.fetchImage(imageUrl);
            const detection = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
  
            if (detection) {
              descriptors.push(Array.from(detection.descriptor)); // Convert Float32Array to Array
            }
          }
        }
  
        if (descriptors.length > 0) {
          labeledFaceDescriptors.push({
            _label: user.schoolID, // Use schoolID as the label
            _descriptors: descriptors,
          });
        }
      }
  
      // Store the trained data in Firestore
      await setDoc(doc(db, "trainedDescriptors", "training"), {
        trainedDescriptors: JSON.stringify(labeledFaceDescriptors), // Store as JSON string
      });
  
      console.log("All descriptors trained and saved successfully!");
    } catch (error) {
      console.error("Error training  data:", error);
    }
    setLoading(false);
  };
  
  
  

  // Fetch users for an event applicable to everyone
  const handleEventForEveryone = async () => {
    try {
      const docRef = doc(db, "trainedDescriptors", "training"); // Reference the document
      const trainedCoursesSnapshot = await getDoc(docRef); // Fetch the document
  
      if (trainedCoursesSnapshot.exists()) {
        const { trainedDescriptors } = trainedCoursesSnapshot.data();
        const parsedData = JSON.parse(trainedDescriptors); // Parse JSON string back to array
  
        console.log("Trained data:", parsedData);
  
        // Perform your logic with the parsed data
        alert("Trained course data loaded successfully for the event!");
      } else {
        console.error("No trained course data found.");
        alert("No trained course data found.");
      }
    } catch (error) {
      console.error("Error fetching trained course data:", error);
    }
  };
  
  

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="container">
      <Button onClick={trainCoursesData} disabled={loading}>
        {loading ? <Spinner size="sm" animation="border" /> : "Train Courses Data"}
      </Button>
      <Button onClick={handleEventForEveryone} disabled={loading}>
        Use Trained Courses for Event
      </Button>

      <Modal show={isModalOpen} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Event for Everyone</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Display modal content */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainAndStoreData;
