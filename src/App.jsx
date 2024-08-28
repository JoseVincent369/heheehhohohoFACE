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



function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login_main />} />
          <Route path="/home" element={<Home_main />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<EventManagement />} />
        <Route path="/admin/admins" element={<AdminManagement />} />
        <Route path="/admin/addOrg" element={<AddOrganization />} />
        <Route path="/admin/StudentManage" element={<StudentManage />} />
        <Route path="/Moderator" element={<ModeratorDashboard />} />
        <Route path="/moderator/attendance" element={<AttendanceTracking />} />
        <Route path="/moderator/events" element={<EventManage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
