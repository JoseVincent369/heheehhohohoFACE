import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main'; // Adjust paths as needed
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import OfficerModal from './CreationOfficerModal'; // Import the modal component
import './ModeratorStyles.css';

const OfficerManagement = () => {
  const [officers, setOfficers] = useState([]);
  const [currentModerator, setCurrentModerator] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // State for modal open/close

  useEffect(() => {
    const checkAuth = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      if (user) {
        const moderatorDocRef = doc(FIRESTORE_DB, 'users', user.uid);
        const moderatorDocSnap = await getDoc(moderatorDocRef);

        if (moderatorDocSnap.exists()) {
          setCurrentModerator({
            uid: user.uid,
            ...moderatorDocSnap.data(),
          });
        } else {
          console.error('Moderator document not found');
        }
      } else {
        navigate('/'); // Redirect to login if not authenticated
      }
    });

    return () => checkAuth();
  }, []);

const fetchOfficers = async () => {
  if (!currentModerator) return;

  try {
    // Query to fetch officers created by the current moderator
    const officersQuery = query(
      collection(FIRESTORE_DB, 'users'),
      where('role', '==', 'officer'),
      where('createdBy', '==', currentModerator.uid) // Match with current moderator's UID
    );

    const officersSnapshot = await getDocs(officersQuery);

    // Map the results to an array of officer objects
    const officerList = officersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Log the fetched officers
    console.log('Fetched officers:', officerList);
    
    // Set the state with the officer list
    setOfficers(officerList);
  } catch (error) {
    console.error('Error fetching officers:', error);
  }
};


  useEffect(() => {
    fetchOfficers(); // Fetch officers initially
  }, [currentModerator]);

  return (
    <div className="officer-management">
      <h2>Officer Management</h2>
      <button onClick={() => setModalOpen(true)}>Create New Officer</button> {/* Open modal */}
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Organization</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {officers.length > 0 ? (
            officers.map((officer) => (
              <tr key={officer.id}>
                <td>{officer.fullName}</td>
                <td>{officer.email}</td>
                <td>{officer.organization}</td>
                <td>{officer.department}</td>
                <td>
                  {/* Add Edit/Delete functionality if needed */}
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No officers found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <OfficerModal 
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          currentModerator={currentModerator}
          onOfficerCreated={fetchOfficers} // Pass fetchOfficers function to the modal
        />
      )}
    </div>
  );
};

export default OfficerManagement;
