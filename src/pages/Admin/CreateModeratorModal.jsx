import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './localstyles.css';

const CreateModeratorModal = ({ showModal, handleClose, currentAdmin, fetchModerators }) => {
  const [moderatorData, setModeratorData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    department: '',
  });

  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [organizationsList, setOrganizationsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  // Fetch organizations and departments
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
        const orgs = orgsSnapshot.docs.map((doc) => doc.data().name);
        setOrganizationsList(orgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError(`Failed to fetch organizations: ${error.message}`);
      }
    };

    const fetchDepartments = async () => {
      try {
        const depsSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
        const deps = depsSnapshot.docs.map((doc) => doc.data().name);
        setDepartmentsList(deps);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError(`Failed to fetch departments: ${error.message}`);
      }
    };

    fetchOrganizations();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setModeratorData({
      ...moderatorData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async () => {
    const newModeratorData = {
      fullName,
      email,
      department,
      organization,
      photoURL,
      role: 'moderator',
      createdBy: currentAdmin.uid,
    };

    try {
      await addDoc(collection(FIRESTORE_DB, 'users'), newModeratorData);
      fetchModerators(); // Refresh the moderators list after creation
      handleClose(); // Close the modal after submission
    } catch (error) {
      console.error('Error creating moderator:', error);
    }
  };

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Moderator</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="fullName"
                value={moderatorData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                required
                autoComplete="off" // Disable autofill
              />
              <input
                type="email"
                name="email"
                value={moderatorData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                autoComplete="off" // Disable autofill
              />
              <input
                type="password"
                name="password"
                value={moderatorData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                autoComplete="new-password" // Disable autofill for passwords
              />

              {/* Organization Dropdown */}
              <select
                name="organization"
                value={moderatorData.organization}
                onChange={handleChange}
                autoComplete="off" // Disable autofill
              >
                <option value="">Select Organization</option>
                {organizationsList.map((org, index) => (
                  <option key={index} value={org}>
                    {org}
                  </option>
                ))}
              </select>

              {/* Department Dropdown */}
              <select
                name="department"
                value={moderatorData.department}
                onChange={handleChange}
                autoComplete="off" // Disable autofill
              >
                <option value="">Select Department</option>
                {departmentsList.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <input type="file" onChange={handleFileChange} accept="image/*" />
              <button type="submit">Create Moderator</button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            <button onClick={handleClose}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateModeratorModal;
