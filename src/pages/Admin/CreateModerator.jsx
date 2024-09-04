import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './localstyles.css';

const CreateModerator = () => {
  const [moderatorData, setModeratorData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    department: '',
  });

  const [organizationsList, setOrganizationsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setCurrentAdmin(user);
      } else {
        navigate('/');
      }
    });

    return () => checkAuth();
  }, [navigate]);

  useEffect(() => {
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

    const fetchModerators = async () => {
      if (!currentAdmin) return;
      try {
        console.log('Fetching moderators for admin UID:', currentAdmin.uid);

        const moderatorsQuery = query(
          collection(FIRESTORE_DB, 'users'),
          where('role', '==', 'moderator'),
          where('createdBy', '==', currentAdmin.uid)
        );

        const moderatorsSnapshot = await getDocs(moderatorsQuery);

        console.log('Moderators Snapshot:', moderatorsSnapshot.docs);

        const moderatorsList = moderatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Moderators List:', moderatorsList);

        setModerators(moderatorsList);
      } catch (error) {
        console.error('Error fetching moderators:', error);
        setError(`Failed to fetch moderators: ${error.message}`);
      }
    };

    fetchDepartments();
    fetchModerators();
  }, [currentAdmin]);

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
      if (!currentAdmin) {
        setError('User not authenticated.');
        return;
      }

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
        createdBy: currentAdmin.uid,
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

      await fetchModerators(); 
    } catch (error) {
      console.error('Error creating moderator:', error);
      setError(`Failed to create moderator account: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Create Moderator</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          value={moderatorData.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          required
        />
        <input
          type="email"
          name="email"
          value={moderatorData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={moderatorData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <select
          name="organization"
          value={moderatorData.organization}
          onChange={handleChange}
          required
        >
          <option value="">Select Organization</option>
          {organizationsList.map((org, index) => (
            <option key={index} value={org}>
              {org}
            </option>
          ))}
        </select>
        <select
          name="department"
          value={moderatorData.department}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departmentsList.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <input type="file" onChange={handleFileChange} accept="image/*" required />
        <button type="submit">Create Moderator</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <h3>Your Moderators</h3>
      {moderators.length > 0 ? (
        <ul>
          {moderators.map((moderator) => (
            <li key={moderator.id}>{moderator.fullName} - {moderator.email}</li>
          ))}
        </ul>
      ) : (
        <p>No moderators created by you.</p>
      )}
    </div>
  );
};

export default CreateModerator;
