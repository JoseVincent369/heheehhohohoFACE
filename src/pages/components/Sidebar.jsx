import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faClipboardList, faUsers, faBuilding, faClipboard, faUserPlus, faUser, faStar } from '@fortawesome/free-solid-svg-icons';
import './component.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    // Toggle a class for the main content area
    document.querySelector('.main-content').classList.toggle('shifted');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Button to toggle the sidebar */}
      <button className="menu-button d-md-none" onClick={toggleSidebar}>
        {isOpen ? '✖' : '☰'}
      </button>
      {/* Conditionally render the list based on the sidebar state */}
      <ul className={isOpen ? '' : 'd-none'}>
        <li>
          <Link to="/superadmin">
            <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/signup">
            <FontAwesomeIcon icon={faUserPlus} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Student Registration</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/department">
            <FontAwesomeIcon icon={faClipboard} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Department</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/addOrg">
            <FontAwesomeIcon icon={faBuilding} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Organization Register</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/admins">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Admin Management</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/ModeratorManage">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Moderator Manage</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/StudentManage">
            <FontAwesomeIcon icon={faUser} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Student Manage</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/SuperAdminAttendanceSearch">
            <FontAwesomeIcon icon={faStar} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Attendance Search</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
