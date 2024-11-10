// Moderator Sidebar

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
            <Link to="/moderator">
              <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
              <span className={isOpen ? '' : 'd-none'}> Dashboard</span>
            </Link>
          </li>

          <li>
            <Link to="/moderator/create">
              <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
              <span className={isOpen ? '' : 'd-none'}> Event Creation</span>
            </Link>
          </li>

          <li>
            <Link to="/moderator/ModeratorsRecord">
              <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
              <span className={isOpen ? '' : 'd-none'}> Moderators Record</span>
            </Link>
          </li>

          {/* Add more links as needed */}
        </ul>
      </ul>
    </div>
  );
};

export default Sidebar;
