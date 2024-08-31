import React, { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { FIREBASE_AUTH, FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import './generalstyles.css';

const LoginMain = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const FIREBASE_DB = getFirestore(FIREBASE_APP); // Initialize Firestore

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      console.log('Logged in as:', user);
  
      // Fetch the user's role from Firestore
      const userRef = doc(FIREBASE_DB, `users/${user.uid}`);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role; // Assuming role is stored directly in the document
        console.log('User role:', userRole);  // Log the fetched user role
  
        // Navigate based on the user's role
        if (userRole === 'superadmin') {
          console.log('Navigating to /superadmin');
          navigate('/superadmin'); // Redirect to Admin Dashboard
        } else if (userRole === 'admin') {
          console.log('Navigating to /localadmin');
          navigate('/localadmin'); // Redirect to Local Admin Dashboard
        } else if (userRole === 'moderator') {
          console.log('Navigating to /Moderator');
          navigate('/Moderator'); // Redirect to Moderator Dashboard
        } else {
          setError('Invalid role. Please contact the administrator.');
        }
      } else {
        setError('User data not found. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid email or password.');
    }
  };
  
  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </div>
  );
};

export default LoginMain;
