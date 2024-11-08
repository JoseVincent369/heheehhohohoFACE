import React, { useState } from 'react';
import { Button, Form, Alert, Container, Row, Col, InputGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FIREBASE_AUTH, FIREBASE_APP } from '../../firebaseutil/firebase_main';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './generalstyles.css';

const LoginMain = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const FIREBASE_DB = getFirestore(FIREBASE_APP);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      const userRef = doc(FIREBASE_DB, `users/${user.uid}`);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        if (userRole === 'superadmin') navigate('/superadmin');
        else if (userRole === 'admin') navigate('/localadmin');
        else if (userRole === 'moderator') navigate('/moderator');
        else if (userRole === 'user') navigate('/home');
        else setError('Access error. Please contact support.');
      } else {
        setError('Account not found. Please check your email and try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 p-3">
      <Row className="w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} className="login-container mx-auto p-4 rounded shadow">
          <h2 className="text-center mb-4">Login to Your Account</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formBasicEmail" className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <InputGroup>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter your email address</Tooltip>}
                >
                  <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                </OverlayTrigger>
                <Form.Control
                  type="email"
                  placeholder="e.g., user@nbsc.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
              <Form.Text className="text-muted">Enter the email linked to your account.</Form.Text>
            </Form.Group>

            <Form.Group controlId="formBasicPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter your password</Tooltip>}
                >
                  <InputGroup.Text><FaLock /></InputGroup.Text>
                </OverlayTrigger>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">Password must be at least 6 characters.</Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mt-3">
              Log In
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginMain;
