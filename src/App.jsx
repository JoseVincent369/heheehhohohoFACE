// src/App.jsx
import 'bootstrap/dist/css/bootstrap.min.css';
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
import Register from './pages/student/Register';
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
import SuperAdminAttendanceSearch from './pages/admin_main/SuperAdminAttendanceSearch';
import Department from './pages/admin_main/Department';
import LocalAdmin from './pages/Admin/LocalAdmin';
import EventCreation from './pages/Admin/EventCreation';
import Records from './pages/Admin/Records';
import CreateModerator from './pages/Admin/CreateModerator';
import StudentAttendanceSearch from './pages/Admin/StudentAttendanceSearch';
import ModeratorManage from './pages/admin_main/ModeratorManage';

// Moderator Pages
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard';
import CreateOfficer from './pages/Moderator/CreateOfficer';
import EventManage from './pages/Moderator/EventManage';
import ModeratorsRecord from './pages/Moderator/ModeratorsRecord';

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
          <Route path="/Register" element={<Register />} />

          {/* CAMERA Routes */}
          <Route path="/home" element={<Home_main />} />

          {/* Super Admin Layout */}
          <Route element={<Layout />}>
            <Route path="/superadmin" element={<AdminDashboard />} />
            <Route path="/admin/admins" element={<AdminManagement />} />
            <Route path="/admin/addOrg" element={<AddOrganization />} />
            <Route path="/admin/StudentManage" element={<StudentManage />} />
            <Route path="/admin/department" element={<Department />} />
            <Route path="/admin/SuperAdminAttendanceSearch" element={<SuperAdminAttendanceSearch />} />
            <Route path="/admin/ModeratorManage" element={<ModeratorManage />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>
          
           {/* Super Admin Change */}
          <Route path="/admin/events" element={<EventManagement />} />


          {/* Local Admin Layout */}
          <Route element={<AdminLayout />}>
            <Route path="/localadmin" element={<LocalAdmin />} />
            <Route path="/local/create" element={<EventCreation />} />
            <Route path="/local/Records" element={<Records />} />
            <Route path="/local/createMod" element={<CreateModerator />} />
            <Route path="/local/StudentAttendanceSearch" element={<StudentAttendanceSearch />} />
          </Route>

          {/* Moderator Layout */}
          <Route element={<LayoutMod />}>
            <Route path="/moderator" element={<ModeratorDashboard />} />
            <Route path="/moderator/CreateOfficer" element={<CreateOfficer />} />
            <Route path="/moderator/create" element={<EventManage />} />
            <Route path="/moderator/ModeratorsRecord" element={<ModeratorsRecord />} />
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
