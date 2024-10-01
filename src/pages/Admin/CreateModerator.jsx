import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getDocs, collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
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
        const moderatorsQuery = query(
          collection(FIRESTORE_DB, 'users'),
          where('role', '==', 'moderator'),
          where('createdBy', '==', currentAdmin.uid)
        );

        const moderatorsSnapshot = await getDocs(moderatorsQuery);
        const moderatorsList = moderatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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

  const handleDeleteModerator = async (id) => {
    try {
      await deleteDoc(doc(FIRESTORE_DB, 'users', id));
      setModerators(moderators.filter((moderator) => moderator.id !== id));
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
