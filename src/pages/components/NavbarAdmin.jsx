import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa'; // Import user and logout icons
import logo from '../../assets/images/nbsc logo.png';


const NavbarAdmin = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/'); // Navigate to the home page when logging out
  };

  const handleLogoClick = (e) => {
    e.preventDefault(); // Prevent logout from triggering when clicking on the logo
    navigate('/localadmin'); // Navigate to the home page when clicking on the logo
  };

  return (
    <header style={{ position: 'relative' }}>
      <Navbar
  bg="dark" // Bootstrap predefined dark background
  variant="dark" // Ensures text and icon colors are light in dark theme
  expand="lg"
  style={{
    backgroundColor: '#002d54', // Dark color for navbar background
  }}
>
        <Container fluid className="position-relative">
          {/* Logo */}
          <Navbar.Brand
            onClick={handleLogoClick} // Handle logo click to navigate
            className="d-flex align-items-center"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer', // Change the cursor to a pointer to indicate clickability
            }}
          >
            <img src={logo} alt="NBSC Logo" style={{ width: '50px', height: 'auto' }} />
            <span className="ms-2 d-none d-md-inline">E-Attend Attendance System</span>
          </Navbar.Brand>

          {/* User display name and Logout button positioned absolutely */}
          <div
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* User display name with icon */}
            <Nav.Item
              style={{
                fontWeight: 'bold',
                color: '#4a4a4a',
                fontSize: '1rem',
                padding: '5px 10px',
                borderRadius: '5px',
                backgroundColor: '#e8e8e8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <FaUser /> {/* User icon */}
              {user ? user.displayName : 'LocalAdmin'}
            </Nav.Item>

            {/* Logout button with icon */}
            <Button
              variant="outline-danger"
              onClick={handleLogout} // Only logout when button is clicked
              style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                padding: '5px 15px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <FaSignOutAlt /> {/* Logout icon */}
              Logout
            </Button>
          </div>
        </Container>
      </Navbar>
    </header>
  );
};

export default NavbarAdmin;
