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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError('Please upload a photo.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        moderatorData.email,
        moderatorData.password
      );

      const uid = userCredential.user.uid;

      const photoRef = ref(STORAGE, `moderators/${uid}/${photo.name}`);
      await uploadBytes(photoRef, photo);
      const url = await getDownloadURL(photoRef);

      const moderatorDoc = {
        fullName: moderatorData.fullName,
        email: moderatorData.email,
        role: 'moderator',
        organization: moderatorData.organization,
        department: moderatorData.department,
        photoURL: url,
        createdBy: currentAdmin.uid, // Admin1's UID
        adminId: currentAdmin.uid,   // Admin1's UID
      };

      await setDoc(doc(FIRESTORE_DB, 'users', uid), moderatorDoc);

      alert('Moderator account created successfully!');
      setModeratorData({
        fullName: '',
        email: '',
        password: '',
        organization: '',
        department: '',
      });
      setPhoto(null);
      setError('');

      await fetchModerators(); // Refresh the list of moderators
      handleClose(); // Close the modal
    } catch (error) {
      console.error('Error creating moderator:', error);
      setError(`Failed to create moderator account: ${error.message}`);
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
