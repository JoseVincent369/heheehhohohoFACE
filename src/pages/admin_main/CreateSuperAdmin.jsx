import React, { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './generalstyles.css';

const CreateSuperAdmin = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

      // Save user info in Firestore with the role of superadmin
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        role: "superadmin",
        photos: {}, // Add URLs if you want to upload photos later
      });

      setSuccess("Superadmin account created successfully!");
    } catch (error) {
      console.error("Error creating superadmin:", error);
      setError("Failed to create superadmin account. Please try again.");
    }
  };

  return (
    <div className="create-superadmin-container">
      <h2>Create Superadmin</h2>
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

        <Button variant="primary" type="submit">
          Create Superadmin
        </Button>
      </Form>
    </div>
  );
};

export default CreateSuperAdmin;
