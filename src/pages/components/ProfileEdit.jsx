import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';

const ProfileEdit = ({ show, handleClose }) => {
  const [userData, setUserData] = useState({
    displayName: '',
    photoURL: '',
    email: '',
    role: '',
    department: '',
    fname: '',
    lname: '',
    mname: '',
    organization: '',
    schoolID: '',
    yearLevel: ''
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);
  const storage = getStorage(FIREBASE_APP);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!show) return;

      setLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user) {
          setError('No user logged in.');
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setError('User data not found.');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        setUserData({
          displayName: `${data.fname || ''} ${data.mname || ''} ${data.lname || ''}`,
          photoURL: data.photoURL || '',
          email: data.email || '',
          role: data.role || '',
          department: data.department || '',
          fname: data.fname || '',
          lname: data.lname || '',
          mname: data.mname || '',
          organization: data.organization || '',
          schoolID: data.schoolID || '',
          yearLevel: data.yearLevel || ''
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [show, auth, db]);

  const handleFileChange = (e) => {
    setNewPhoto(e.target.files[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in.');

      const userRef = doc(db, 'users', user.uid);

      if (newPhoto) {
        const photoRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(photoRef, newPhoto);
        const photoURL = await getDownloadURL(photoRef);
        await updateDoc(userRef, { photoURL });
        setUserData((prev) => ({ ...prev, photoURL }));
      }

      await updateDoc(userRef, {
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        fname: userData.fname,
        lname: userData.lname,
        mname: userData.mname,
        organization: userData.organization,
        schoolID: userData.schoolID,
        yearLevel: userData.yearLevel
      });

      setSuccess('Profile updated successfully!');
      handleClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSave}>
              <Form.Group controlId="formDisplayName" className="mb-3">
                <Form.Label>Display Name</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.displayName}
                  onChange={(e) =>
                    setUserData({ ...userData, displayName: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <Form.Group controlId="formDepartment" className="mb-3">
                <Form.Label>Department</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.department}
                  onChange={(e) =>
                    setUserData({ ...userData, department: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formPhoto" className="mb-3">
                <Form.Label>Profile Photo</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {userData.photoURL && (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    style={{ width: '100px', height: '100px', marginTop: '10px' }}
                  />
                )}
              </Form.Group>

              <Form.Group controlId="formRole" className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.role}
                  onChange={(e) =>
                    setUserData({ ...userData, role: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formFname" className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.fname}
                  onChange={(e) =>
                    setUserData({ ...userData, fname: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formLname" className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.lname}
                  onChange={(e) =>
                    setUserData({ ...userData, lname: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formMname" className="mb-3">
                <Form.Label>Middle Name</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.mname}
                  onChange={(e) =>
                    setUserData({ ...userData, mname: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formOrganization" className="mb-3">
                <Form.Label>Organization</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.organization}
                  onChange={(e) =>
                    setUserData({ ...userData, organization: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formSchoolID" className="mb-3">
                <Form.Label>School ID</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.schoolID}
                  onChange={(e) =>
                    setUserData({ ...userData, schoolID: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group controlId="formYearLevel" className="mb-3">
                <Form.Label>Year Level</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.yearLevel}
                  onChange={(e) =>
                    setUserData({ ...userData, yearLevel: e.target.value })
                  }
                />
              </Form.Group>

              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </Form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ProfileEdit;
