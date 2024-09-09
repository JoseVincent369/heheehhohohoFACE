import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login_main from './pages/admin_main/login_main';
import Home_main from './pages/Home/Home_main';
import SignUp from './pages/student/Signup';
import AdminDashboard from '../src/pages/admin_main/AdminDashboard';
import EventManagement from '../src/pages/admin_main/EventManagement';
import AdminManagement from './pages/admin_main/AdminManagement';
import AddOrganization from './pages/admin_main/AddOrganization';
import StudentManage from './pages/admin_main/StudentManage';
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard';
import AttendanceTracking from './pages/Moderator/AttendanceTracking'
import EventManage from './pages/Moderator/EventManage';
import LocalAdmin from './pages/Admin/LocalAdmin'
import EventCreation from './pages/Admin/EventCreation'
import OrganizationManagement from './pages/Admin/OrganizationManagement'
import Logout from './pages/Admin/Logout';
import CreateSuperAdmin from './pages/admin_main/CreateSuperAdmin'
import Department from './pages/admin_main/Department'
import OfficerDashboard from './pages/Moderator/OfficerDashboard';
import CreateModerator from './pages/Admin/CreateModerator';

function App() {
  return (
    <Router>
      <div>
        <Routes>
        <Route path="/CreateSuperAdmin" element={<CreateSuperAdmin />} />


          <Route path="/" element={<Login_main />} />
          <Route path="/home" element={<Home_main />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/superadmin" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<EventManagement />} />
        <Route path="/admin/admins" element={<AdminManagement />} />
        <Route path="/admin/addOrg" element={<AddOrganization />} />
        <Route path="/admin/StudentManage" element={<StudentManage />} />
        <Route path="/admin/department" element={<Department />} />
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/moderator/attendance" element={<AttendanceTracking />} />
        <Route path="/moderator/create" element={<EventManage />} />
        <Route path="/moderator/officers" element={<OfficerDashboard />} />
        <Route path="/localadmin" element={<LocalAdmin />} />
        <Route path="/local/create" element={<EventCreation />} />
        <Route path="/local/Org" element={<OrganizationManagement />} />
        <Route path="/local/createMod" element={<CreateModerator />} />
        <Route path="/logout" element={<Logout />} />


      
        </Routes> 
      </div>
    </Router>
  );
}

export default App;
