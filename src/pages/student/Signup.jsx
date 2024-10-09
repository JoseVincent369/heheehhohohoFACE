import React, { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore'; // Use getDoc for fetching documents
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import './generalstyles.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    mname: "",
    nameExtension: "", // Added name extension
    yearLevel: "",
    email: "",
    age: "",
    course: "",
    major: "",
    schoolID: "",
    password: "",
    organization: [], // Treat organization as an array
    department: "", // Removed department from formData
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
  const [yearLevels, setYearLevels] = useState([]);

  const navigate = useNavigate();

  const fetchOrganizations = async () => {
    const orgSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
    const orgs = orgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrganizations(orgs.sort((a, b) => a.name.localeCompare(b.name))); // Sort by name
  };

  const fetchDepartments = async () => {
    const deptSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
    const deps = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDepartments(deps.sort((a, b) => a.name.localeCompare(b.name))); // Sort by name
  };

  const fetchCourses = async (departmentId) => {
    const courseSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses`));
    const coursesData = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(coursesData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const fetchMajors = async (departmentId, courseId) => {
    const majorSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses/${courseId}/majors`));
    const majorsData = majorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMajors(majorsData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const fetchYearLevels = async (departmentId) => {
    const yearLevelSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/yearLevels`));
    const yearLevelsData = yearLevelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setYearLevels(yearLevelsData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    fetchOrganizations();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "organization") {
      // Handle multiple organizations
      const selectedOrgs = [...formData.organization];
      if (e.target.checked) {
        selectedOrgs.push(value);
      } else {
        const index = selectedOrgs.indexOf(value);
        if (index > -1) selectedOrgs.splice(index, 1);
      }
      setFormData({
        ...formData,
        organization: selectedOrgs,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (name === 'department') {
        fetchCourses(value);
        fetchYearLevels(value);
      }

      if (name === 'course') {
        fetchMajors(formData.department, value);
      }
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
      // Fetch names for course, major, yearLevel, and organization
      const courseDoc = await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}/courses/${formData.course}`));
      const courseName = courseDoc.exists() ? courseDoc.data().name : "";

      const majorDoc = formData.major
        ? await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}/courses/${formData.course}/majors/${formData.major}`))
        : null;
      const majorName = majorDoc?.exists() ? majorDoc.data().name : "";

      const yearLevelDoc = await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}/yearLevels/${formData.yearLevel}`));
      const yearLevelName = yearLevelDoc.exists() ? yearLevelDoc.data().name : "";

      const orgPromises = formData.organization.map(async (orgId) => {
        const orgDoc = await getDoc(doc(FIRESTORE_DB, `organizations/${orgId}`));
        return orgDoc.exists() ? orgDoc.data().name : "";
      });
      const organizationNames = await Promise.all(orgPromises);

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;
      const photoURLs = await uploadPhotos(userId);

      // Save user data in Firestore
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        fname: formData.fname,
        lname: formData.lname,
        mname: formData.mname,
        nameExtension: formData.nameExtension,
        yearLevel: yearLevelName,
        email: formData.email,
        age: formData.age,
        course: courseName,
        major: majorName,
        organization: organizationNames,
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
      setLoading(false);
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

          <Form.Group controlId="formMname">
            <Form.Label>Middle Name</Form.Label>
            <Form.Control type="text" name="mname" value={formData.mname} onChange={handleChange} />
          </Form.Group>

          <Form.Group controlId="formLname">
            <Form.Label>Last Name</Form.Label>
            <Form.Control type="text" name="lname" value={formData.lname} onChange={handleChange} required />
          </Form.Group>

          {/* Name Extension Field */}
          <Form.Group controlId="formNameExtension">
            <Form.Label>Name Extension (e.g., Jr., Sr.)</Form.Label>
            <Form.Control type="text" name="nameExtension" value={formData.nameExtension} onChange={handleChange} />
          </Form.Group>

          <Form.Group controlId="formAge">
            <Form.Label>Age</Form.Label>
            <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} required />
          </Form.Group>

          <Form.Group controlId="formSchoolID">
            <Form.Label>School ID</Form.Label>
            <Form.Control type="text" name="schoolID" value={formData.schoolID} onChange={handleChange} required />
          </Form.Group>

          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
          </Form.Group>

          {/* Department Dropdown */}
          <Form.Group controlId="formDepartment">
            <Form.Label>Department</Form.Label>
            <Form.Control as="select" name="department" value={formData.department} onChange={handleChange} required>
              <option value="">Select Department</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Year Level Dropdown */}
          <Form.Group controlId="formYearLevel">
            <Form.Label>Year Level</Form.Label>
            <Form.Control as="select" name="yearLevel" value={formData.yearLevel} onChange={handleChange} required>
              <option value="">Select Year Level</option>
              {yearLevels.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
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
            <Form.Control as="select" name="major" value={formData.major} onChange={handleChange} >
              <option value="">Select Major</option>
              {majors.map(major => (
                <option key={major.id} value={major.id}>{major.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Organization Checkboxes */}
          <Form.Group controlId="formOrganization">
            <Form.Label>Organization</Form.Label>
            {organizations.map(org => (
              <Form.Check
                key={org.id}
                type="checkbox"
                label={org.name}
                name="organization"
                value={org.id}
                onChange={handleChange}
              />
            ))}
          </Form.Group>

          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
          </Form.Group>

          {/* Photo Uploads */}
          <Form.Group controlId="formFrontPhoto">
            <Form.Label>Front Photo</Form.Label>
            <Form.Control type="file" name="front" onChange={handlePhotoChange} required />
          </Form.Group>

          <Form.Group controlId="formLeftPhoto">
            <Form.Label>Left Photo</Form.Label>
            <Form.Control type="file" name="left" onChange={handlePhotoChange} required />
          </Form.Group>

          <Form.Group controlId="formRightPhoto">
            <Form.Label>Right Photo</Form.Label>
            <Form.Control type="file" name="right" onChange={handlePhotoChange} required />
          </Form.Group>

          <Button variant="primary" type="submit">Register</Button>
        </Form>
      )}
    </div>
  );
};

export default SignUp;