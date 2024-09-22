import React, { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen'; 
import './generalstyles.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    mname: "",
    yearLevel: "",
    email: "",
    age: "",
    course: "",
    major: "",
    schoolID: "",
    password: "",
    organization: "",
    department: "", // Added department
  });

  const [photos, setPhotos] = useState({
    front: null,
    left: null,
    right: null,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);

  const navigate = useNavigate();

  // Fetch organizations from Firestore
  const fetchOrganizations = async () => {
    const orgSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
    setOrganizations(orgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch departments from Firestore
  const fetchDepartments = async () => {
    const deptSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
    setDepartments(deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch courses based on selected department
  const fetchCourses = async (departmentId) => {
    const courseSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses`));
    setCourses(courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch majors based on selected course
  const fetchMajors = async (departmentId, courseId) => {
    const majorSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses/${courseId}/majors`));
    setMajors(majorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchOrganizations();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // If department is changed, fetch corresponding courses
    if (e.target.name === 'department') {
      fetchCourses(e.target.value); // Fetch courses for the selected department
    }

    // If course is changed, fetch corresponding majors
    if (e.target.name === 'course') {
      fetchMajors(formData.department, e.target.value); // Fetch majors for the selected course and department
    }
  };

  const handlePhotoChange = (e) => {
    setPhotos({
      ...photos,
      [e.target.name]: e.target.files[0],
    });
  };

  const uploadPhotos = async (userId) => {
    const photoURLs = {};

    for (const [key, photo] of Object.entries(photos)) {
      if (photo) {
        const photoRef = ref(STORAGE, `users/${userId}/${key}`);
        await uploadBytes(photoRef, photo);
        const downloadURL = await getDownloadURL(photoRef);
        photoURLs[key] = downloadURL;
      }
    }

    return photoURLs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true); 

    try {
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;
      const photoURLs = await uploadPhotos(userId);
  
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        fname: formData.fname,
        lname: formData.lname,
        mname: formData.mname,
        yearLevel: formData.yearLevel,
        email: formData.email,
        age: formData.age,
        course: formData.course,
        major: formData.major,
        organization: formData.organization,
        department: formData.department, // Save selected department
        schoolID: formData.schoolID,
        role: "user",
        photos: photoURLs,
      });
  
      setSuccess("User registered successfully!");
      navigate("/");

    } catch (error) {
      console.error("Sign-up failed:", error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError("The email address is already in use by another account.");
          break;
        case 'auth/invalid-email':
          setError("The email address is invalid.");
          break;
        case 'auth/operation-not-allowed':
          setError("Email/password accounts are not enabled.");
          break;
        case 'auth/weak-password':
          setError("The password is too weak. Please use a stronger password.");
          break;
        default:
          setError("Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false); // Set loading to false when submission ends
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {loading ? (
        <LoadingScreen />
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formFname">
            <Form.Label>First Name</Form.Label>
            <Form.Control type="text" name="fname" value={formData.fname} onChange={handleChange} required />
          </Form.Group>
          <Form.Group controlId="formLname">
            <Form.Label>Last Name</Form.Label>
            <Form.Control type="text" name="lname" value={formData.lname} onChange={handleChange} required />
          </Form.Group>
          <Form.Group controlId="formMname">
            <Form.Label>Middle Name</Form.Label>
            <Form.Control type="text" name="mname" value={formData.mname} onChange={handleChange} />
          </Form.Group>
          <Form.Group controlId="formYearLevel">
            <Form.Label>Year Level</Form.Label>
            <Form.Control
              as="select"
              name="yearLevel"
              value={formData.yearLevel}
              onChange={handleChange}
              required
            >
              <option value="">Select Year Level</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group controlId="formAge">
            <Form.Label>Age</Form.Label>
            <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} required />
          </Form.Group>
          
          {/* Organization Dropdown */}
          <Form.Group controlId="formOrganization">
            <Form.Label>Organization</Form.Label>
            <Form.Control as="select" name="organization" value={formData.organization} onChange={handleChange} >
              <option value="">Select Organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Department Dropdown */}
          <Form.Group controlId="formDepartment">
            <Form.Label>Department</Form.Label>
            <Form.Control as="select" name="department" value={formData.department} onChange={handleChange} required>
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Course Dropdown */}
          <Form.Group controlId="formCourse">
            <Form.Label>Course</Form.Label>
            <Form.Control as="select" name="course" value={formData.course} onChange={handleChange} required>
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Major Dropdown */}
          <Form.Group controlId="formMajor">
            <Form.Label>Major</Form.Label>
            <Form.Control as="select" name="major" value={formData.major} onChange={handleChange}>
              <option value="">Select Major</option>
              {majors.map(major => (
                <option key={major.id} value={major.id}>{major.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formSchoolID">
            <Form.Label>School ID</Form.Label>
            <Form.Control type="text" name="schoolID" value={formData.schoolID} onChange={handleChange} required />
          </Form.Group>
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
          </Form.Group>

          <Form.Group controlId="formFrontPhoto">
            <Form.Label>Front Photo</Form.Label>
            <Form.Control type="file" name="front" onChange={handlePhotoChange} />
          </Form.Group>
          <Form.Group controlId="formLeftPhoto">
            <Form.Label>Left Photo</Form.Label>
            <Form.Control type="file" name="left" onChange={handlePhotoChange} />
          </Form.Group>
          <Form.Group controlId="formRightPhoto">
            <Form.Label>Right Photo</Form.Label>
            <Form.Control type="file" name="right" onChange={handlePhotoChange} />
          </Form.Group>

          <Button variant="primary" type="submit">Sign Up</Button>
        </Form>
      )}
    </div>
  );
};

export default SignUp;
