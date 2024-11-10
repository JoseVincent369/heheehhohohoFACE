// src/pages/components/LayourMod.jsx
import React from 'react';
import SidebarMod from './SidebarMod'; // Import Admin Sidebar
import NavbarMod from './NavbarMod'; // Import Admin Navbar
import { Outlet } from 'react-router-dom';

const LayoutMod  = ({ userRole }) => {
    console.log('Inside Layout. Received userRole:', userRole);
    return (
        <div className="dashboard-layout">
          {/* Static Navbar */}
          <NavbarMod userRole={userRole} />
    
          <div className="dashboard-content">
            {/* Sidebar based on user role */}
            <SidebarMod userRole={userRole} />
    
            {/* Main content area */}
            <main className="main-content">
              <Outlet /> {/* Child routes will be rendered here */}
            </main>
          </div>
        </div>
      );
};

export default LayoutMod;
