import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login_main from './pages/admin_main/login_main';
import Home_main from './pages/Home/Home_main';
import SignUp from './pages/student/Signup';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login_main />} />
          <Route path="/home" element={<Home_main />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
