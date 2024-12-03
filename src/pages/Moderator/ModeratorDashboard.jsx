import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  where,
  getDoc,
  doc,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_APP, FIRESTORE_DB } from "../../firebaseutil/firebase_main";
import { browserSessionPersistence, setPersistence } from "firebase/auth";
import { Tabs, Tab, Modal, Button, Spinner } from "react-bootstrap";
import { Table, Spin, Pagination } from "antd";
import "./moderatorStyles.css";

import { Select } from "antd";
const { Option } = Select; // Destructure Option from Select

const ModeratorDashboard = () => {
  const faceapi = window.faceapi;
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [rejectedEvents, setRejectedEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [doneEvents, setDoneEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isListTrained, setIsListTrained] = useState(false);
  const [isLoadTrained, setIsLoadTrained] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [usersInCharge, setUsersInCharge] = useState([]);
  const [selectedUserInChargeId, setSelectedUserInChargeId] = useState("");
  const [selectedUsersInCharge, setSelectedUsersInCharge] = useState([]);
  const [userInCharge, setUserInCharge] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [pageSize, setPageSize] = useState(5); // Items per page

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  // Authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the logged-in user
        setLoading(false);
      } else {
        setUser(null); // Handle logged-out state
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      // Now any authentication state will persist only for the session
    })
    .catch((error) => {
      console.error("Error setting persistence:", error);
    });

  // Fetch Approved, Rejected, and Pending Events
  useEffect(() => {
    if (!user) return;

    const fetchEvents = query(
      collection(db, "events"),
      where("moderators", "array-contains", user.uid)
      
    );

    const unsubscribeEvents = onSnapshot(
      fetchEvents,
      (querySnapshot) => {
        const eventsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        /// console.log("Fetched Events Data:", eventsData); // Debugging line
        setApprovedEvents(
          eventsData.filter((event) => event.status === "accepted")
        );
        setRejectedEvents(
          eventsData.filter((event) => event.status === "rejected")
        );
        setPendingEvents(
          eventsData.filter((event) => event.status === "pending")
        );
        setDoneEvents(eventsData.filter((event) => event.status === "done")
        );  
        setEventsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setEventsLoading(false);
      }
    );

    return () => unsubscribeEvents();
  }, [db, user]);

  const fetchEligibleUsers = async () => {
    try {
      // Ensure user is authenticated and available
      if (!user) {
        console.error("No user is logged in.");
        return; // Exit if no user is authenticated
      }

      // Get the current moderator's information
      const moderatorRef = doc(db, "users", user.uid);
      const moderatorSnapshot = await getDoc(moderatorRef);

      // Check if moderator data exists
      if (!moderatorSnapshot.exists()) {
        console.error("Moderator data not found");
        return; // Exit if moderator data is not found
      }

      const moderatorData = moderatorSnapshot.data();
      console.log("Moderator's data:", moderatorData); // Optional: Log moderator's data for debugging

      // Define the base query to filter by 'user' role
      const q = query(collection(db, "users"), where("role", "==", "user"));

      // Fetch matching users
      const snapshot = await getDocs(q);
      const eligibleUsers = snapshot.docs.map((doc) => ({
        value: doc.id, // Set the value to user ID
        label: `${doc.data().fname} ${doc.data().lname}`, // Full name for the dropdown label
        ...doc.data(),
      }));

      // Set eligible users to the state
      setUsersInCharge(eligibleUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch users based on userInCharge criteria
  useEffect(() => {
    const fetchUsersInCharge = async () => {
      if (!user) return;

      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const filteredUsers = usersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (user) =>
              user.role === "user" &&
              user.department === userInCharge.department &&
              user.organization &&
              user.organization.some((org) =>
                userInCharge.organization.includes(org)
              )
          );

        setUsersInCharge(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsersInCharge();
  }, [userInCharge]);

  const assignUserInCharge = async () => {
    // Check if both selectedEvent and selectedUserInChargeId are defined
    if (selectedEvent && selectedUsersInCharge) {
      try {
        console.log(
          "Assigning user in charge:",
          selectedUsersInCharge,
          "to event:",
          selectedEvent.id
        ); // Debugging line

        // Update the event document in Firestore
        await updateDoc(doc(db, "events", selectedEvent.id), {
          userInCharge: selectedUsersInCharge, // Assuming this is where the user in charge should be stored
        });

        alert("User in charge assigned successfully!");
        handleModalClose(); // Close modal after assignment
      } catch (error) {
        console.error("Error assigning user in charge:", error);
        alert("Error assigning user in charge.");
      }
    } else {
      console.error(
        "Either selectedEvent or selectedUserInChargeId is not defined."
      );
      alert("Please select an event and a user to assign.");
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    fetchEligibleUsers();
    setIsModalOpen(true);
    setIsListTrained(event.isTrained);
  };
  // Fetch image URL for a user from Firestore
  const fetchImageUrl = async (user, imageType) => {
    try {
      return user.photos[imageType] || null;
    } catch (error) {
      console.error(`Error fetching image URL for ${user.schoolID}:`, error);
    }
    return null;
  };

  const handleTrainedData = async (trainedData) => {
    // Check if both selectedEvent and selectedUserInChargeId are defined

    try {
      // Update the event document in Firestore
      await setDoc(
        doc(db, "events", selectedEvent.id),
        {
          trainedData: JSON.stringify(trainedData), // Assuming this is where the user in charge should be stored
          isTrained: true,
        },
        {
          merge: true,
        }
      );

      // Close modal after assignment
    } catch (error) {
      console.error("Error assigning user in charge:", error);
      alert("Error assigning user in charge.");
    }
  };

  const fetchUsersWithRole = async (selectedEvent) => {
    try {
      const usersCollection = collection(FIRESTORE_DB, "users");
  
      // Safely handle null values and ensure arrays are correctly processed
      const eventCourses = Array.isArray(selectedEvent.courses) ? selectedEvent.courses : [];
      const eventOrganizations = Array.isArray(selectedEvent.organizations) ? selectedEvent.organizations : [];
  
      const queries = [];
  
      // Scenario 1: If both courses and organizations are specified
      if (eventCourses.length > 0) {
        const coursesQuery = query(
          usersCollection,
          where("course", "in", eventCourses.map(course => course.trim()))
        );
        queries.push(getDocs(coursesQuery));
      }
      
      if (eventOrganizations.length > 0) {
        const organizationsQuery = query(
          usersCollection,
          where("organization", "array-contains-any", eventOrganizations.map(org => org.trim()))
        );
        queries.push(getDocs(organizationsQuery));
      }      
      // Scenario 2: If only courses are specified
      else if (eventCourses.length > 0) {
        const coursesQuery = query(
          usersCollection,
          where("course", "in", eventCourses.map(course => course.trim()))
        );
        queries.push(getDocs(coursesQuery));
      }
      // Scenario 3: If only organizations are specified
      else if (eventOrganizations.length > 0) {
        const organizationsQuery = query(
          usersCollection,
          where("organization", "array-contains-any", eventOrganizations.map(org => org.trim()))
        );
        queries.push(getDocs(organizationsQuery));
      } else {
        console.warn("No valid filters provided for courses or organizations.");
        return []; // If no filters exist, return empty
      }
  
      // Execute all queries
      const querySnapshots = await Promise.all(queries);
  
      // Merge results and avoid duplicates
      const uniqueUsers = new Map(); // Map to avoid duplicate users by ID
      querySnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          uniqueUsers.set(doc.id, { id: doc.id, ...doc.data() });
        });
      });
  
      // Return unique users as an array
      return Array.from(uniqueUsers.values());
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };
  
  

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

  const loadLabeledImages = async () => {
    try {
      const users = await fetchUsersWithRole(selectedEvent);
      const labeledFaceDescriptors = [];

      for (const user of users) {
        const descriptors = [];
        for (const imageType of ["front", "left", "right"]) {
          const imageUrl = await fetchImageUrl(user, imageType);
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
          const faceDescriptor = new faceapi.LabeledFaceDescriptors(
            user.schoolID,
            descriptors
          );
          labeledFaceDescriptors.push(faceDescriptor);
        }
      }
      setIsLoadTrained(false);
      setIsListTrained(!isListTrained);
      console.log(labeledFaceDescriptors);
      let trainedData = labeledFaceDescriptors.map(data => ({
        _label: data._label,
        _descriptors: data._descriptors.map(desc => Array.from(desc)), // Convert Float32Array to Array
      }));
      handleTrainedData(trainedData);
    } catch (error) {
      console.error("Error loading labeled images:", error);
      return [];
    }
  };

  const fetchTrainedData = async (selectedEvent) => {
    try {
      // Reference to the document 'training' within the collection 'trainedDescriptors'
      const trainedDataRef = doc(db, "trainedDescriptors", "training"); 
  
      const trainedDataSnapshot = await getDoc(trainedDataRef);
  
      if (trainedDataSnapshot.exists()) {
        let trainedDescriptors = trainedDataSnapshot.data().trainedDescriptors;
  
        // If the data contains escaped characters, parse it
        if (typeof trainedDescriptors === "string") {
          trainedDescriptors = JSON.parse(trainedDescriptors.replace(/\\/g, ""));
        }
  
        console.log("Trained Data Retrieved:", trainedDescriptors);
  
        // Ensure the data is an array
        if (!Array.isArray(trainedDescriptors)) {
          throw new Error("Trained data is not in the expected array format.");
        }
  
        return trainedDescriptors; // Return the trained data from Firestore
      } else {
        console.log("No trained data found.");
        return null; // Return null if no trained data is found
      }
    } catch (error) {
      console.error("Error fetching trained data:", error);
      return null;
    }
  };
  
  
  
// Handle button click for training or using saved trained data
const handleTrainOrUseData = async () => {
  if (selectedEvent.courses.length >= 6) {
    try {
      setIsLoadTrained(true); // Indicate training/loading is in progress

      // Fetch trained data from Firestore (if it exists)
      const savedTrainedData = await fetchTrainedData(selectedEvent);

      if (savedTrainedData) {
        console.log("Using saved trained data...");
        await handleTrainedData(savedTrainedData);
      } else {
        console.log("No saved data found. Training new data...");
        await loadLabeledImages();
      }

      // Mark the event as trained
      setSelectedEvent((prevEvent) => ({
        ...prevEvent,
        isTrained: true,
      }));
      setIsListTrained(true); // Update UI state
    } catch (error) {
      console.error("Error handling training or loading data:", error);
    } finally {
      setIsLoadTrained(false); // Hide spinner/loading state
    }
  } else {
    alert("At least 6 courses are required to load and train the images.");
  }
};


  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsListTrained(false);
    setIsLoadTrained(false);
    setSelectedUsersInCharge([]);
  };
  const itemList = (list) => {
    return list
      ? list.map((item, index) => {
          return (
            <li key={index} className="m-0 p-0 list-group-item ">
              {item}
            </li>
          );
        })
      : null;
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const getPaginatedEvents = (events) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return events.slice(startIndex, endIndex);
  };

    
  return (
    <div className="container">
      <div
        className="content"
        style={{ maxHeight: "190vh", overflowY: "auto" }}
      >
        {error && <p className="error-message">{error}</p>}
        {loading && <Spin spinning={true} />}
        <Tabs defaultActiveKey="approved" id="event-tabs" className="mb-3">
    
    {/* Approved Events Tab */}
    <Tab eventKey="approved" title="Approved Events">
      <Spin spinning={eventsLoading}>
        {approvedEvents.length === 0 ? (
          <p>No approved events at the moment.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedEvents(approvedEvents).map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={approvedEvents.length}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20"]}
            />
          </>
        )}
      </Spin>
    </Tab>

    {/* Rejected Events Tab */}
    <Tab eventKey="rejected" title="Rejected Events">
      <Spin spinning={eventsLoading}>
        {rejectedEvents.length === 0 ? (
          <p>No rejected events at the moment.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedEvents(rejectedEvents).map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={rejectedEvents.length}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20"]}
            />
          </>
        )}
      </Spin>
    </Tab>

    {/* Pending Events Tab */}
    <Tab eventKey="pending" title="Pending Events">
      <Spin spinning={eventsLoading}>
        {pendingEvents.length === 0 ? (
          <p>No pending events at the moment.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedEvents(pendingEvents).map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={pendingEvents.length}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20"]}
            />
          </>
        )}
      </Spin>
    </Tab>

    {/* Done Events Tab */}
    <Tab eventKey="done" title="Done Events">
      <Spin spinning={eventsLoading}>
        {doneEvents.length === 0 ? (
          <p>No done events at the moment.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedEvents(doneEvents).map((event, index) => (
                  <tr key={event.id || index} onClick={() => handleEventClick(event)}>
                    <td>{event.name}</td>
                    <td>{event.description || "N/A"}</td>
                    <td>{new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}</td>
                    <td>{event.venue || "N/A"}</td>
                    <td>{event.status || "N/A"}</td>
                    <td><button onClick={() => handleEventClick(event)}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={doneEvents.length}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20"]}
            />
          </>
        )}
      </Spin>
    </Tab>
  </Tabs>

        {/* Modal for Event Details */}
        {isModalOpen && selectedEvent && (
          <div className="modal">
            <div className="modal-content">
              <h3>{selectedEvent.name}</h3>
              <strong>Description:</strong>{" "}
              <p disabled className="form-control">
                {selectedEvent.description || "N/A"}
              </p>
              <div className="row">
                <div className="col-sm-12 col-md-6 col-lg-6">
                  {" "}
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {new Date(
                      selectedEvent.startDate?.seconds * 1000
                    ).toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="col-sm-12 col-md-6 col-lg-6">
                  {" "}
                  <p>
                    <strong>End Date:</strong>{" "}
                    {new Date(
                      selectedEvent.endDate?.seconds * 1000
                    ).toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12 col-md-6 col-lg-6">
                  {" "}
                  <p>
                    <strong>Venue:</strong> {selectedEvent.venue || "N/A"}
                  </p>
                </div>
                <div className="col-sm-12 col-md-6 col-lg-6">
                  {" "}
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedEvent.status.toUpperCase(0) || "N/A"}
                  </p>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-sm-12 col-md-6 col-lg-6">
                  <h5>Department</h5>
                  <ol className="list-group list-group-numbered">
                    {itemList(selectedEvent.courses)}
                  </ol>
                </div>
                <div className="col-sm-12 col-md-6 col-lg-6">
                  <h5>Organization</h5>
                  {itemList(selectedEvent.organizations)}
                </div>
              </div>
              <h5 className="mb-2 p-0">
  STEP 1: Load and Train Student Images
</h5>

{/* Button1: Load the saved data or train new data */}
{selectedEvent.courses && selectedEvent.courses.length >= 6 ? (
  <div>
    <p className="mb-2">Button to train images using the saved training data</p>
    {selectedEvent.isTrained ? (
      <p className="alert alert-success text-center">Images already trained.</p>
    ) : (
      <button
        disabled={isListTrained || isLoadTrained}
        onClick={async () => {
          setIsLoadTrained(true); // Show spinner while training
          await handleTrainOrUseData(); // Train or load data
          setIsLoadTrained(false); // Hide spinner after training is complete
          setIsListTrained(true); // Indicate training is complete
          setSelectedEvent((prevEvent) => ({
            ...prevEvent,
            isTrained: true, // Mark as trained in the event
          }));
        }}
        className="btn btn-primary"
      >
        Load and Train Student Images (or use saved data)
      </button>
    )}
  </div>
) : (
  <p className="alert alert-warning">Insufficient courses. Minimum 6 courses required to load and train images.</p>
)}

{/* Button2: Load eligible student images */}
<div>
  <p className="mb-2">Button to load eligible student images</p>
  {selectedEvent.isTrained ? (
    <p className="alert alert-success">Images already trained.</p>
  ) : (
    <button
      disabled={isListTrained || isLoadTrained}
      onClick={async () => {
        setIsLoadTrained(true); // Show spinner while loading
        await loadLabeledImages(); // Load labeled images
        setIsLoadTrained(false); // Hide spinner after loading is complete
        setIsListTrained(true); // Indicate images are loaded
        setSelectedEvent((prevEvent) => ({
          ...prevEvent,
          isTrained: true, // Mark as trained in the event
        }));
      }}
      className="btn btn-secondary"
    >
      Load Student Images
    </button>
  )}
</div>



{/* Spinner for loading or training */}
{isLoadTrained ? (
  <div className="d-flex justify-content-center">
    <Spinner />
    <span className="mx-2">Processing Images...</span>
  </div>
) : null}




                    <h5 className="mt-4">Users In Charge</h5>
      {selectedEvent.userInCharge && selectedEvent.userInCharge.length > 0 ? (
        <ul className="list-group">
          {selectedEvent.userInCharge.map((userId) => {
            const user = usersInCharge.find((u) => u.value === userId);
            return (
              <li key={userId} className="list-group-item">
                {user ? user.label : userId} {/* Display user name if available */}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">No users assigned yet.</p>
      )}
              <h5 className="mb-2 p-0  ">STEP 2: Assign Officer In Charge</h5>
              <Select
                style={{ width: "100%" }}
                mode="multiple"
                showSearch
                allowClear
                placeholder="Select User(s) in Charge"
                value={selectedUsersInCharge.map((userId) =>
                  usersInCharge.find((user) => user.value === userId)
                )}
                onChange={(selectedValues) => {
                  setSelectedUsersInCharge(selectedValues);
                }}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              >
                {usersInCharge.map((user) => (
                  <Option key={user.value} value={user.value}>
                    {user.label}
                  </Option>
                ))}
              </Select>
              {/* Conditionally render the assign button */}
              {selectedEvent.status === "accepted" && (
                <button disabled={!isListTrained} onClick={assignUserInCharge}>
                  Assign
                </button>
              )}
              <button onClick={handleModalClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;
