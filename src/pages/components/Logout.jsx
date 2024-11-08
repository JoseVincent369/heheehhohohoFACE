import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseutil/firebase_main'; // Adjust the import path as needed
import logo from '../../assets/images/nbsc logo.png'; // Ensure this is correctly imported

const NavbarComponent = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      navigate('/'); // Redirect to the login page after logout
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
  };

  return (
    <Navbar expand="lg" bg="light" className="shadow-sm">
      <Container>
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <img
            src={logo}
            alt="NBSC Logo"
            style={{ width: '50px', height: 'auto' }}
            className="me-2"
          />
          <span>E-Attend Attendance System</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto">
            <Nav.Item>
              <span className="navbar-text me-3">{user ? user.displayName : 'SuperAdmin'}</span>
            </Nav.Item>
            <Nav.Item>
              <Button variant="danger" onClick={handleLogout}>Logout</Button>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
