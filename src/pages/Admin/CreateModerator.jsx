import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth, signInWithEmailAndPassword, deleteUser, EmailAuthProvider } from 'firebase/auth'; 
import { getStorage, ref, deleteObject } from 'firebase/storage'; 
import { getFirestore, getDocs, collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE  } from '../../firebaseutil/firebase_main';
import { initializeApp } from "firebase/app";
import CreateModeratorModal from './CreateModeratorModal';
import './localstyles.css';




const ManageModerators = () => {
  const [moderators, setModerators] = useState([]);
  const [error, setError] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editModerator, setEditModerator] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setCurrentAdmin(user);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, [navigate]);

  useEffect(() => {
    const fetchModerators = async () => {
      if (!currentAdmin) return; // Prevent fetching if currentAdmin is null
      try {
        console.log(`Fetching moderators for admin UID: ${currentAdmin.uid}`);
        const moderatorsQuery = query(
          collection(FIRESTORE_DB, 'users'),
          where('role', '==', 'moderator'),
          where('createdBy', '==', currentAdmin.uid) // Check the matching condition
        );
  
        const moderatorsSnapshot = await getDocs(moderatorsQuery);
        console.log('Snapshot:', moderatorsSnapshot); // Log the snapshot
  
        const moderatorsList = moderatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        console.log('Moderators fetched:', moderatorsList); // Check what moderators were fetched
        setModerators(moderatorsList);
      } catch (error) {
        console.error('Error fetching moderators:', error);
        setError(`Failed to fetch moderators: ${error.message}`);
      }
    };
  
    fetchModerators();
  }, [currentAdmin]);
  

  const handleOpenModal = () => {
    setEditModerator(null); // Reset editModerator when creating a new moderator
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditModerator(null); // Reset when closing the modal
  };

  const handleEditModerator = (moderator) => {
    setEditModerator(moderator); // Set the moderator to be edited
    setShowModal(true);
  };

  const handleDeleteModerator = async (moderatorToDelete) => {
    const auth = getAuth(); // Getting the auth instance
    const storage = getStorage(); // Getting the storage instance
  
    try {
      // Step 1: Reauthenticate the user
      await auth.currentUser.reauthenticateWithCredential(
        EmailAuthProvider.credential(moderatorToDelete.email, 'yourModeratorPassword') // replace with the actual password
      );
  
      // Delete the user from Firebase Authentication
      await auth.deleteUser(moderatorToDelete.uid); // Use the uid of the moderator
  
      // Step 2: Delete the moderator document from Firestore
      await deleteDoc(doc(FIRESTORE_DB, 'users', moderatorToDelete.id)); // moderatorToDelete.id is the document ID
  
      // Step 3: Delete the moderator's image from Firebase Storage
      const imageRef = ref(storage, `moderator/${moderatorToDelete.id}`);
      await deleteObject(imageRef); // Delete the image
  
      setModerators(moderators.filter((moderator) => moderator.id !== moderatorToDelete.id)); // Update state
      alert('Moderator deleted successfully!');
    } catch (error) {
      console.error('Error deleting moderator:', error);
      setError(`Failed to delete moderator: ${error.message}`);
    }
  };
  
  

  return (
    <div className="organization-management">
      <div className="main-content">
        <h2>Your Moderators</h2>
        <button onClick={handleOpenModal}>Create Moderator</button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {moderators.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Organization</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {moderators.map((moderator) => (
                <tr key={moderator.id}>
                  <td>{moderator.fullName}</td>
                  <td>{moderator.email}</td>
                  <td>{moderator.department}</td>
                  <td>{moderator.organization}</td>
                  <td>
                    <img 
                      src={moderator.photoURL} 
                      alt={`${moderator.fullName}'s profile`} 
                      style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
                    />
                  </td>
                  <td>
                    <button onClick={() => handleEditModerator(moderator)}>Edit</button>
                    <button onClick={() => handleDeleteModerator(moderator.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No moderators created by you.</p>
        )}

        {currentAdmin && ( // Ensure currentAdmin is defined before rendering modal
          <CreateModeratorModal
            showModal={showModal}
            handleClose={handleCloseModal}
            currentAdmin={currentAdmin}
            fetchModerators={() => setModerators(moderators)} // Refresh the list of moderators
            editModerator={editModerator} // Pass the moderator to be edited
            setEditModerator={setEditModerator} // To update state when modal is closed
          />
        )}
      </div>
    </div>
  );
};

export default ManageModerators;
