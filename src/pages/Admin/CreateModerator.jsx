import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth, EmailAuthProvider } from 'firebase/auth'; 
import { getStorage, ref, deleteObject } from 'firebase/storage'; 
import { getDoc, getDocs, collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import CreateModeratorModal from './CreateModeratorModal';
import { Table, Button, Typography, Alert } from 'antd';
import './localstyles.css';

const { Title } = Typography;

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
          where('createdBy', '==', currentAdmin.uid) // Check the matching condition
        );

        const moderatorsSnapshot = await getDocs(moderatorsQuery);

        if (moderatorsSnapshot.empty) {
          setModerators([]); // Ensure moderators is set to empty if none found
          return; // Exit if no moderators are found
        }

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

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, moderator) => (
        <>
          <Button onClick={() => handleEditModerator(moderator)} type="link">Edit</Button>
          <Button onClick={() => handleDeleteModerator(moderator)} type="link" danger>Delete</Button>
        </>
      ),
    },
  ];

  return (
    <div className="container my-4">
      {/* Title */}
      <div className="row">
        <div className="col">
          <Title level={2} className="text-center">Your Moderators</Title>
        </div>
      </div>

      {/* Button */}
      <div className="row mb-3">
        <div className="col text-center">
          <Button type="primary" onClick={handleOpenModal} className="mb-3">
            Create Moderator
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="row mb-3">
          <div className="col">
            <Alert message={error} type="error" showIcon />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="row">
        <div className="col">
          {moderators.length > 0 ? (
            <Table
              dataSource={moderators}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              className="table-responsive"

            />
          ) : (
            <p className="text-center">No moderators created by you.</p>
          )}
        </div>
      </div>

      {/* Modal for creating/editing moderators */}
      {currentAdmin && (
        <CreateModeratorModal
          showModal={showModal}
          handleClose={handleCloseModal}
          currentAdmin={currentAdmin}
          fetchModerators={() => setModerators(moderators)}
          editModerator={editModerator}
          setEditModerator={setEditModerator}
        />
      )}
    </div>
  );
};

export default ManageModerators;
