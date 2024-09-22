// Layout.jsx
import Navbar from './Navbar'; // Adjust path as needed
import Sidebar from './Sidebar'; // Adjust path as needed
import { Outlet } from 'react-router-dom';

const Layout = ({ userRole }) => {
  console.log('Inside Layout. Received userRole:', userRole);

  return (
    <div className="dashboard-layout">
      {/* Static Navbar */}
      <Navbar userRole={userRole} />

      <div className="dashboard-content">
        {/* Sidebar based on user role */}
        <Sidebar userRole={userRole} />

        {/* Main content area */}
        <main className="main-content">
          <Outlet /> {/* Child routes will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
