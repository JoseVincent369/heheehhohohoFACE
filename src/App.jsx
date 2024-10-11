// src/App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
// Loading
import { LoadingProvider, useLoading } from './pages/components/LoadingContext';  // Import the Loading Context
import LoadingScreen from './pages/components/LoadingScreen'; // Import the Loading Screen

// Pages and Layouts
import Login_main from './pages/admin_main/login_main';
import Home_main from './pages/Home/Home_main';
import SignUp from './pages/student/Signup';
import NotFound from './pages/components/NotFount';
import Layout from './pages/components/Layout';
import AdminLayout from './pages/components/LayoutAdmin';
import LayoutMod from './pages/components/LayoutMod';


// Super Admin, Admin, Moderator Pages
import AdminDashboard from './pages/admin_main/AdminDashboard';
import EventManagement from './pages/admin_main/EventManagement';
import AdminManagement from './pages/admin_main/AdminManagement';
import AddOrganization from './pages/admin_main/AddOrganization';
import StudentManage from './pages/admin_main/StudentManage';
import CreateSuperAdmin from './pages/admin_main/CreateSuperAdmin';
import Department from './pages/admin_main/Department';
import LocalAdmin from './pages/Admin/LocalAdmin';
import EventCreation from './pages/Admin/EventCreation';
import OrganizationManagement from './pages/Admin/OrganizationManagement';
import CreateModerator from './pages/Admin/CreateModerator';

// Moderator Pages
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard';
import CreateOfficer from './pages/Moderator/CreateOfficer';
import EventManage from './pages/Moderator/EventManage';
import OfficerDashboard from './pages/Moderator/OfficerDashboard';

// Other
import Logout from './pages/components/Logout';

function App() {
  return (
    <LoadingProvider>
      <MainApp />
    </LoadingProvider>

  );
}

function MainApp() {
  const { isLoading } = useLoading(); // Destructure loading state from useLoading

  return (
    <>
      {isLoading && <LoadingScreen />}

      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login_main />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/CreateSuperAdmin" element={<CreateSuperAdmin />} />
          {/* CAMERA Routes */}
          <Route path="/home" element={<Home_main />} />

          {/* Super Admin Layout */}
          <Route element={<Layout />}>
            <Route path="/superadmin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<EventManagement />} />
            <Route path="/admin/admins" element={<AdminManagement />} />
            <Route path="/admin/addOrg" element={<AddOrganization />} />
            <Route path="/admin/StudentManage" element={<StudentManage />} />
            <Route path="/admin/department" element={<Department />} />
          </Route>

          {/* Moderator Layout */}
          <Route element={<LayoutMod />}>
            <Route path="/moderator" element={<ModeratorDashboard />} />
            <Route path="/moderator/CreateOfficer" element={<CreateOfficer />} />
            <Route path="/moderator/create" element={<EventManage />} />
            <Route path="/moderator/officers" element={<OfficerDashboard />} />
          </Route>

          {/* Local Admin Layout */}
          <Route element={<AdminLayout />}>
            <Route path="/localadmin" element={<LocalAdmin />} />
            <Route path="/local/create" element={<EventCreation />} />
            <Route path="/local/Org" element={<OrganizationManagement />} />
            <Route path="/local/createMod" element={<CreateModerator />} />
          </Route>

          {/* Other */}
          <Route path="/logout" element={<Logout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
