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
       <ul className={isOpen ? '' : 'd-none'}>
      <ul>
        <li>
          <Link to="/localadmin">
            <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Dashboard</span>
          </Link>
        </li>

        <li>
          <Link to="/local/createMod">
            <FontAwesomeIcon icon={faBuilding} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Create Moderator</span>
          </Link>
        </li>
        <li>
          <Link to="/local/create">
            <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Event Creation</span>
          </Link>
        </li>
        <li>
          <Link to="/local/Records">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}> Records</span>
          </Link>
        </li>
        <li>
          <Link to="/local/StudentAttendanceSearch">
            <FontAwesomeIcon icon={faStar} className="sidebar-icon" />
            <span className={isOpen ? '' : 'd-none'}>Attendance Search</span>
          </Link> 
        </li>
        
      </ul>
      </ul>
    </div>
  );
};

export default Sidebar;
