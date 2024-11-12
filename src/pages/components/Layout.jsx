import React from 'react';
import Navbar from './Navbar'; // Adjust path as needed
import Sidebar from './Sidebar'; // Adjust path as needed
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ userRole }) => {
  const location = useLocation();
  const isSignupPage = location.pathname === '/signup'; // Check if the current page is the signup page

  return (
    <div className="dashboard-layout">
 
      <div className={`dashboard-content ${isSignupPage ? 'center-content' : ''}`}>
        {!isSignupPage && <Sidebar userRole={userRole} />}
        {!isSignupPage && <Navbar userRole={userRole} />}
        <main className={`main-content ${isSignupPage ? 'signin-centered' : ''}`}>

        
          <Outlet /> {/* Child routes will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
