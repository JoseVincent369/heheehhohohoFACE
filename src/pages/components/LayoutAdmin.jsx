// src/pages/components/AdminLayout.jsx
import SidebarAdmin from './SidebarAdmin'; // Import Admin Sidebar
import NavbarAdmin from './NavbarAdmin'; // Import Admin Navbar
import { Outlet } from 'react-router-dom';

const AdminLayout = ({ userRole }) => {
    console.log('Inside Layout. Received userRole:', userRole);
  
    return (
      <div className="dashboard-layout">
        {/* Static Navbar */}
        <NavbarAdmin userRole={userRole} />
  
        <div className="dashboard-content">
          {/* Sidebar based on user role */}
          <SidebarAdmin userRole={userRole} />
  
          {/* Main content area */}
          <main className="main-content">
            <Outlet /> {/* Child routes will be rendered here */}
          </main>
        </div>
      </div>
    );
  };
  
export default AdminLayout;
