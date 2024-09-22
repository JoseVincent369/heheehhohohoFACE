import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faClipboardList, faUsers, faBuilding } from '@fortawesome/free-solid-svg-icons';

const SidebarAdmin = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    // Trigger the callback function to update the main content shift
    if (onToggle) {
      onToggle(!isOpen);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="menu-button" onClick={toggleSidebar}>
        {isOpen ? '☰' : '✖'}
      </button>
      <ul>
        <li>
          <Link to="/localadmin">
            <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
            {isOpen && ' Dashboard'}
          </Link>
        </li>
        <li>
          <Link to="/local/create">
            <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
            {isOpen && ' Event Creation'}
          </Link>
        </li>
        <li>
          <Link to="/local/Org">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            {isOpen && ' Organization Management'}
          </Link>
        </li>
        <li>
          <Link to="/local/createMod">
            <FontAwesomeIcon icon={faBuilding} className="sidebar-icon" />
            {isOpen && ' Create Moderator'}
          </Link>
        </li>
        {/* Additional links if needed */}
      </ul>
    </div>
  );
};

export default SidebarAdmin;
