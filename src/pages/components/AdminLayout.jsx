// src/components/AdminLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <AdminSidebar />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
