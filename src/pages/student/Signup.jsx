import React, { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

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
  });

  const [photos, setPhotos] = useState({
    front: null,
    left: null,
    right: null,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

    try {
      // Create user with email and password in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;

      // Upload photos to Firebase Storage
      const photoURLs = await uploadPhotos(userId);

      // Save user info in Firestore, including photo URLs
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        fname: formData.fname,
        lname: formData.lname,
        mname: formData.mname,
        yearLevel: formData.yearLevel,
        email: formData.email,
        age: formData.age,
        course: formData.course,
        major: formData.major,
        schoolID: formData.schoolID,
        role: "user", // Default role
        photos: photoURLs, // Store the photo URLs in Firestore
      });

      setSuccess("User registered successfully!");
      navigate("/login"); // Redirect to login page after successful registration
    } catch (error) {
      console.error("Sign-up failed:", error);
      setError("Failed to create an account. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        {/* First Name */}
        <Form.Group controlId="formFirstName">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter first name"
            name="fname"
            value={formData.fname}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Last Name */}
        <Form.Group controlId="formLastName">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter last name"
            name="lname"
            value={formData.lname}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Middle Name */}
        <Form.Group controlId="formMiddleName">
          <Form.Label>Middle Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter middle name"
            name="mname"
            value={formData.mname}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Year Level */}
        <Form.Group controlId="formYearLevel">
          <Form.Label>Year Level</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter year level"
            name="yearLevel"
            value={formData.yearLevel}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Email */}
        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Age */}
        <Form.Group controlId="formAge">
          <Form.Label>Age</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Course */}
        <Form.Group controlId="formCourse">
          <Form.Label>Course</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Major */}
        <Form.Group controlId="formMajor">
          <Form.Label>Major</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter major"
            name="major"
            value={formData.major}
            onChange={handleChange}
          />
        </Form.Group>

        {/* School ID */}
        <Form.Group controlId="formSchoolID">
          <Form.Label>School ID</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter school ID"
            name="schoolID"
            value={formData.schoolID}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Password */}
        <Form.Group controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Front Photo */}
        <Form.Group controlId="formFrontPhoto">
          <Form.Label>Front Photo</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            name="front.jpg"
            onChange={handlePhotoChange}
            required
          />
        </Form.Group>

        {/* Left Photo */}
        <Form.Group controlId="formLeftPhoto">
          <Form.Label>Left Photo</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            name="left.jpg"
            onChange={handlePhotoChange}
            required
          />
        </Form.Group>

        {/* Right Photo */}
        <Form.Group controlId="formRightPhoto">
          <Form.Label>Right Photo</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            name="right.jpg"
            onChange={handlePhotoChange}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Sign Up
        </Button>
      </Form>
    </div>
  );
};

export default SignUp;
