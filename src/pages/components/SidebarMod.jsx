import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faClipboardList, faUsers, faBuilding, faClipboard, faUserPlus, faUser } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    // Toggle a class for the main content area
    document.querySelector('.main-content').classList.toggle('shifted');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="menu-button" onClick={toggleSidebar}>
        {isOpen ? '☰' : '✖'}
      </button>
      <ul>
        <li>
          <Link to="/moderator">
            <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
            {isOpen && ' Dashboard'}
          </Link>
        </li>
        <li>
          <Link to="/moderator/create">
            <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
            {isOpen && ' Event Creation'}
          </Link>
        </li>
        <li>
          <Link to="/moderator/ModeratorsRecord">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            {isOpen && ' Moderators Record'}
          </Link>
        </li>
        {/* Additional links if needed */}
      </ul>
    </div>
  );
};

export default Sidebar;
