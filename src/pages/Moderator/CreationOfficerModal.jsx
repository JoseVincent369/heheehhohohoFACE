import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main'; // Adjust paths as needed
import './ModeratorStyles.css';

const OfficerModal = ({ modalOpen, setModalOpen, currentModerator, onOfficerCreated }) => {
  const [officerData, setOfficerData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    department: '',
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch organizations and departments from Firestore on component mount
  useEffect(() => {
    const fetchOrganizationsAndDepartments = async () => {
      try {
        const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
        const orgList = orgsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrganizations(orgList);

        const deptSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
        const deptList = deptSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDepartments(deptList);
      } catch (error) {
        console.error('Error fetching organizations and departments:', error);
      }
    };

    fetchOrganizationsAndDepartments();
  }, []);
  

  const handleChange = (e) => {
    setOfficerData({
      ...officerData,
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
      if (!currentModerator.adminId) {
        setError('Error: adminId is missing. Officer creation aborted.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        officerData.email,
        officerData.password
      );

      const officerUid = userCredential.user.uid;

      const photoRef = ref(STORAGE, `officers/${officerUid}/${photo.name}`);
      await uploadBytes(photoRef, photo);
      const photoURL = await getDownloadURL(photoRef);

      const officerDoc = {
        fullName: officerData.fullName,
        email: officerData.email,
        role: 'officer',
        organization: officerData.organization,
        department: officerData.department,
        photoURL: photoURL,
        createdBy: currentModerator.uid, // Moderator's UID
        adminId: currentModerator.adminId, // Admin1's UID
      };

      await setDoc(doc(FIRESTORE_DB, 'users', officerUid), officerDoc);

      alert('Officer created successfully!');
      setOfficerData({
        fullName: '',
        email: '',
        password: '',
        organization: '',
        department: '',
      });
      setPhoto(null);
      setError('');
      setModalOpen(false); // Close modal after success

      // Call the callback to refresh the officer list
      onOfficerCreated(); 
    } catch (error) {
      console.error('Error creating officer:', error);
      setError(`Failed to create officer: ${error.message}`);
    }
  };


  return (
    <div className={`modal ${modalOpen ? 'open' : 'closed'}`}>
      <div className="modal-content">
        <h2>Create Officer</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            value={officerData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
          <input
            type="email"
            name="email"
            value={officerData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            value={officerData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          
          {/* Dropdown for organization */}
          <select
            name="organization"
            value={officerData.organization}
            onChange={handleChange}
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Dropdown for department */}
          <select
            name="department"
            value={officerData.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          <input type="file" onChange={handleFileChange} accept="image/*" />
          <button type="submit">Create Officer</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
        <button className="close-button" onClick={() => setModalOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
};

export default OfficerModal;
