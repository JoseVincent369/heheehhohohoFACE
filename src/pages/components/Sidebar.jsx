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
          <Link to="/superadmin">
            <FontAwesomeIcon icon={faTachometerAlt} className="sidebar-icon" />
            {isOpen && ' Dashboard'}
          </Link>
        </li>
        <li>
          <Link to="/admin/events">
            <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
            {isOpen && ' Event Registration'}
          </Link>
        </li>
        <li>
          <Link to="/admin/admins">
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            {isOpen && ' Admin Management'}
          </Link>
        </li>
        <li>
          <Link to="/admin/addOrg">
            <FontAwesomeIcon icon={faBuilding} className="sidebar-icon" />
            {isOpen && ' Organization Register'}
          </Link>
        </li>
        <li>
          <Link to="/admin/department">
            <FontAwesomeIcon icon={faClipboard} className="sidebar-icon" />
            {isOpen && ' Department'}
          </Link>
        </li>
        <li>
          <Link to="/admin/StudentManage">
            <FontAwesomeIcon icon={faUser} className="sidebar-icon" />
            {isOpen && ' Student Manage'}
          </Link>
        </li>
        <li>
          <Link to="/signup">
            <FontAwesomeIcon icon={faUserPlus} className="sidebar-icon" />
            {isOpen && ' Student Registration'}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
