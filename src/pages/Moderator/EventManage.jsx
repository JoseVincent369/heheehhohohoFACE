import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './ModeratorStyles.css';
import Logout from '../Admin/Logout';

const EventManagement = () => {
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [yearLevels] = useState(['1', '2', '3', '4']);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = getAuth(FIREBASE_APP);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
    // Fetch User Details
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // Fetch Organizations and Departments
    const fetchOrganizationsAndDepartments = async () => {
      setLoading(true);
      try {
        // Fetch organizations
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const orgs = orgsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrganizations(orgs);

        // Fetch departments
        const deptsSnapshot = await getDocs(collection(db, 'departments'));
        const depts = deptsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDepartments(depts);
      } catch (error) {
        console.error('Error fetching organizations or departments:', error);
        alert('Failed to fetch organizations or departments.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationsAndDepartments();
  }, [db]);

  useEffect(() => {
    // Fetch courses based on selected departments
    const fetchCourses = async () => {
      if (selectedDepartments.length === 0) return;
      setLoading(true);
      try {
        const coursesPromises = selectedDepartments.map(async (deptId) => {
          const coursesSnapshot = await getDocs(collection(db, `departments/${deptId}/courses`));
          return coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        });
        const coursesArrays = await Promise.all(coursesPromises);
        const allCourses = [].concat(...coursesArrays);
        setCourses(allCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        alert('Failed to fetch courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedDepartments, db]);

  useEffect(() => {
    // Fetch majors based on selected courses
    const fetchMajors = async () => {
      if (selectedCourses.length === 0) return;
      setLoading(true);
      try {
        const majorsPromises = selectedCourses.map(async (courseId) => {
          const majorsSnapshot = await getDocs(collection(db, `departments/${selectedDepartments[0]}/courses/${courseId}/majors`));
          return majorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        });
        const majorsArrays = await Promise.all(majorsPromises);
        const allMajors = [].concat(...majorsArrays);
        setMajors(allMajors);
      } catch (error) {
        console.error('Error fetching majors:', error);
        alert('Failed to fetch majors.');
      } finally {
        setLoading(false);
      }
    };

    fetchMajors();
  }, [selectedCourses, selectedDepartments, db]);

  const handleCheckboxChange = (setter) => (e) => {
    const { value, checked } = e.target;
    setter(prev => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter(item => item !== value);
      }
    });
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error('Error logging out: ', error);
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to create an event.');
      return;
    }

    setLoading(true);
    try {
      // Constructing the event data
      const eventData = {
        name: eventName,
        description: eventDescription,
        startDate: eventStartDate,
        endDate: eventEndDate,
        venue,
        courses: selectedCourses,
        majors: selectedMajors,
        organizations: selectedOrgs,
        selectedDepartments,
        yearLevels: selectedYearLevels,
        createdBy: user.uid,
        status: 'pending', // Initial status for admin approval
      };

      // Adding the event to Firestore
      const eventRef = await addDoc(collection(db, 'events'), eventData);
      console.log('Event created with ID:', eventRef.id);

      alert('Event created successfully, awaiting admin approval!');

      // Clear form inputs after successful submission
      setEventName('');
      setEventDescription('');
      setEventStartDate('');
      setEventEndDate('');
      setVenue('');
      setSelectedOrgs([]);
      setSelectedYearLevels([]);
      setSelectedDepartments([]);
      setSelectedCourses([]);
      setSelectedMajors([]);
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Failed to create event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assume this is where you fetch or initialize the current user
const currentUser = auth.currentUser;

// Add this console log to see the current logged-in user
console.log("Current logged-in user:", currentUser ? currentUser.uid : "No user logged in");

// If you are using a state, you can also check the logged-in user like this:
useEffect(() => {
  const checkCurrentUser = async () => {
    const user = await auth.currentUser;
    console.log("Current logged-in user:", user ? user.uid : "No user logged in");
  };

  checkCurrentUser();
}, []);


  return (
    <div className="event-management">
      <header className="navbar">
        <div className="logo">Event Management</div>
        <div className="user-info">
          <div className="user">{user ? user.displayName : 'Moderator'}</div>
          <Logout />
        </div>
      </header>

      <div className="main-content">
        <nav className={`sidebar`}>
          <ul>
            <li>
              <a href="/moderator/dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/moderator/events">Event Management</a>
            </li>
            <li>
              <a href="/moderator/attendance">Attendance Tracking</a>
            </li>
            <li>
              <a href="/">Settings</a>
            </li>
          </ul>
        </nav>

        <div className="content">
          <h2>Create Event</h2>
          <form onSubmit={handleCreateEvent}>
            <input
              type="text"
              placeholder="Event Name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
            <textarea
              placeholder="Event Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              value={eventStartDate}
              onChange={(e) => setEventStartDate(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
            
            <fieldset>
              <legend>Select Organizations</legend>
              {organizations.map((org) => (
                <label key={org.id}>
                  <input
                    type="checkbox"
                    value={org.id}
                    checked={selectedOrgs.includes(org.id)}
                    onChange={handleCheckboxChange(setSelectedOrgs)}
                  />
                  {org.name}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Select Departments</legend>
              {departments.map((dept) => (
                <label key={dept.id}>
                  <input
                    type="checkbox"
                    value={dept.id}
                    checked={selectedDepartments.includes(dept.id)}
                    onChange={handleCheckboxChange(setSelectedDepartments)}
                  />
                  {dept.name}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Select Courses</legend>
              {courses.map((course) => (
                <label key={course.id}>
                  <input
                    type="checkbox"
                    value={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onChange={handleCheckboxChange(setSelectedCourses)}
                    disabled={!selectedDepartments.length}
                  />
                  {course.name}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Select Majors</legend>
              {majors.map((major) => (
                <label key={major.id}>
                  <input
                    type="checkbox"
                    value={major.id}
                    checked={selectedMajors.includes(major.id)}
                    onChange={handleCheckboxChange(setSelectedMajors)}
                    disabled={!selectedCourses.length}
                  />
                  {major.name}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Select Year Levels</legend>
              {yearLevels.map((level) => (
                <label key={level}>
                  <input
                    type="checkbox"
                    value={level}
                    checked={selectedYearLevels.includes(level)}
                    onChange={handleCheckboxChange(setSelectedYearLevels)}
                  />
                  Year {level}
                </label>
              ))}
            </fieldset>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
