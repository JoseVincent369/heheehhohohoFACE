// src/pages/components/AdminLayout.jsx
import React from 'react';
import SidebarAdmin from './SidebarAdmin'; // Import Admin Sidebar
import NavbarAdmin from './NavbarAdmin'; // Import Admin Navbar
import { Outlet } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    return (
        <div className="admin-layout">
            <NavbarAdmin />
            <div className="admin-content">
                <SidebarAdmin />
                <main>{children}
                <Outlet/>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
