import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login_main from './pages/admin_main/login_main';
import Home_main from './pages/Home/Home_main';
import SignUp from './pages/student/Signup';
import AdminDashboard from '../src/pages/admin_main/AdminDashboard'
import EventManagement from '../src/pages/admin_main/EventManagement';
import ModeratorManagement from '../src/pages/admin_main/ModeratorManagement';
import AddOrganization from './pages/admin_main/AddOrganization';
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
        <Route path="/admin/moderators" element={<ModeratorManagement />} />
        <Route path="/admin/addOrg" element={<AddOrganization />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
