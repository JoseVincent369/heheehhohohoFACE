import React from 'react';
import './component.css';
import Logout from './Logout';
import logo from '../../assets/images/nbsc logo.png'; // Ensure this is correctly imported

const Navbar = ({ user }) => {
  return (
    <header className="navbar">
      <div className="logo-container">
        {/* Use the correct imported logo variable */}
        <img src={logo} alt="NBSC Logo" style={{ width: '50px', height: 'auto' }} />
        <div className="logo-text">E-Attend Attendance System</div>
      </div>
      <div className="user-info">
        <div className="Admin">
          
          {user ? user.displayName : 'Admin'}
        </div>
        <Logout /> {/* Logout button */}
      </div>
    </header>
  );
};

export default Navbar;
