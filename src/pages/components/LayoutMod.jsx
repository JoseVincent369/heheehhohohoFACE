// src/pages/components/LayourMod.jsx
import React from 'react';
import SidebarMod from './SidebarMod'; // Import Admin Sidebar
import NavbarMod from './NavbarMod'; // Import Admin Navbar
import { Outlet } from 'react-router-dom';

const LayoutMod = ({ children }) => {
    return (
        <div className="moderator-layout">
            <NavbarMod />
            <div className="moderator-content">
                <SidebarMod />
                <main>{children}
                <Outlet/>
                </main>
            </div>
        </div>
    );
};

export default LayoutMod;
