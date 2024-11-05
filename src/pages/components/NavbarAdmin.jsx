import React from 'react';
import './component.css';
import Logout from './Logout';
import logo from '../../assets/images/nbsc logo.png'; // Ensure this is correctly imported

const Navbar = ({ user }) => {
  console.log(user); // Debugging line to check the user object

  return (
    <header className="navbar">
      <div className="logo-container">
        <img src={logo} alt="NBSC Logo" style={{ width: '50px', height: 'auto' }} />
        <div className="logo-text">E-Attend Attendance System</div>
      </div>
      
      <div className="Admin">
        {/* Fallback for fname and lname */}
        {user && user.fname && user.lname ? `${user.fname} ${user.lname}` : 'Admin'}
      </div>
      <Logout /> {/* Logout button */}
    </header>
  );
};

export default Navbar;
