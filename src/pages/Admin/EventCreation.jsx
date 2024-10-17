import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseutil/firebase_main'; // Import FIREBASE_AUTH for authentication
import { collection, getDocs, addDoc, query, where, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Import to track authentication state
import { Form, Input, DatePicker, Checkbox, Button, Select, Spin } from 'antd'; // Importing Ant Design components
import LoadingScreen from '../components/LoadingScreen'; 
import './localstyles.css'; // Import the CSS file

const { TextArea } = Input;
const { Option } = Select;

const EventCreation = () => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [courses, setCourses] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [majors, setMajors] = useState({});
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [moderators, setModerators] = useState([]); // Store fetched moderators
  const [selectedModerators, setSelectedModerators] = useState([]); // Track selected moderators




  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const orgRef = collection(FIRESTORE_DB, 'organizations');
        const orgSnapshot = await getDocs(orgRef);
        const orgs = orgSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrganizations(orgs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const fetchCoursesAndMajors = async (departmentId) => {
    if (!departmentId) return;
  
    try {
      // Fetch courses
      const coursesRef = collection(FIRESTORE_DB, `departments/${departmentId}/courses`);
      const coursesSnapshot = await getDocs(coursesRef);
      const fetchedCourses = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Update courses state
      setCourses((prevCourses) => ({
        ...prevCourses,
        [departmentId]: fetchedCourses,
      }));
  
      // Now fetch majors for each course under this department
      const majorsForDept = {};
      for (const course of fetchedCourses) {
        const majorsRef = collection(FIRESTORE_DB, `departments/${departmentId}/courses/${course.id}/majors`);
        const majorsSnapshot = await getDocs(majorsRef);
        const fetchedMajors = majorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        majorsForDept[course.id] = fetchedMajors; // Store majors under their corresponding course ID
      }
  
      // Update majors state
      setMajors((prevMajors) => ({
        ...prevMajors,
        ...majorsForDept, // Merge with previous majors state
      }));
    } catch (error) {
      console.error('Error fetching courses and majors:', error);
    }
  };
  
  
  const handleDepartmentChange = (value) => {
    handleCheckboxChange(value, setSelectedDepartments, selectedDepartments);
    fetchCoursesAndMajors(value); // Fetch courses and majors when a department is selected
  };
  

  const fetchAdminData = async (adminUid) => {
    if (!adminUid) {
      console.error('Admin UID is not defined.');
      return;
    }
  
    try {
      const adminDoc = await getDoc(doc(FIRESTORE_DB, 'users', adminUid)); // Fetch the admin document
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        setCurrentUser(adminUid); // Store department ID
        fetchModerators(adminUid);
        return adminData.departments || []; // Return departments if available
      } else {
        console.error('No such admin found.');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };
  
  
  // Replace your current fetch user useEffect with this
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        fetchAdminData(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const fetchModerators = async (adminUid) => {
    if (!adminUid) {
        console.error('Admin UID is not defined.');
        return;
    }

    try {
        console.log('Fetching moderators for admin UID:', adminUid);

        const adminDoc = await getDoc(doc(FIRESTORE_DB, 'users', adminUid));
        const adminData = adminDoc.data();
        const adminDepartments = adminData.departments || [];  // Get the department of the current admin

        

        console.log(`Fetching moderators for admin UID: ${adminUid}`);
        const moderatorsQuery = query(
          collection(FIRESTORE_DB, 'users'),
          where('role', '==', 'moderator'),
          where('createdBy', '==', adminUid) // Check the matching condition
        );

        const moderatorsSnapshot = await getDocs(moderatorsQuery);
        const fetchedModerators = moderatorsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log('Moderators fetched:', fetchedModerators);
        setModerators(fetchedModerators);

        // Check if any moderators were fetched
        if (fetchedModerators.length === 0) {
          alert('Before creating an event, please create a moderator first.'); // Alert if no moderators
           // Navigate to the moderator creation path
          return; // Ensure you exit the function after navigation
      }
      

    // Filter departments based on admin's department
    const deptRef = collection(FIRESTORE_DB, 'departments');
    const deptSnapshot = await getDocs(deptRef);
    const filteredDepartments = deptSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((dept) => adminDepartments.includes(dept.name)); // Assuming dept.name is the department name
      console.log('Filtered Departments:', filteredDepartments);
    setDepartments(filteredDepartments); // Set only the admin's department
  } catch (error) {
    console.error('Error fetching moderators:', error);
    
  }
};


  const handleCheckboxChange = (value, setter, selected) => {
    if (selected.includes(value)) {
      setter(selected.filter((id) => id !== value)); // Remove the selected item
    } else {
      setter([...selected, value]); // Add the new item
    }
  };

  const handleSelectAll = (items, setter, isSelected) => {
    if (isSelected) {
      setter([]); // Deselect all if any are selected
    } else {
      setter(items); // Select all
    }
  };


  

  const handleEventCreation = async (e) => {
    e.preventDefault();

    // Validate form inputs
    if (!eventName || !startDate || !endDate || !venue) {
        alert('Please fill in all required fields.');
        return;
    }

    // Map selected values to their names
    const selectedOrgNames = selectedOrganizations.map(orgId => organizations.find(org => org.id === orgId)?.name || '');
    const selectedCourseNames = selectedCourses.map(courseId => {
        const deptCourses = Object.values(courses).flat();
        return deptCourses.find(course => course.id === courseId)?.name || '';
    });
    const selectedMajorNames = selectedMajors.map(majorId => {
        const deptMajors = Object.values(majors).flat();
        return deptMajors.find(major => major.id === majorId)?.name || '';
    });

    // If year levels are not selected, set them as an empty array
    const selectedYearLevelNames = selectedYearLevels.length > 0 ? selectedYearLevels : [];

    // Prepare data for Firestore
    const newEvent = {
        name: eventName,
        description: description || '',  // Provide a default empty string if not entered
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        venue,
        organizations: selectedOrgNames.filter(Boolean),  // Filter out any undefined values
        yearLevels: selectedYearLevelNames,  // Store year level names
        selectedDepartments: selectedDepartments.length > 0 ? selectedDepartments : [], // Keep department IDs if needed
        courses: selectedCourseNames.filter(Boolean),  // Filter out undefined courses
        majors: selectedMajorNames.filter(Boolean),    // Filter out undefined majors
        moderators: selectedModerators.length > 0 ? selectedModerators : [],  // Ensure empty array if no Moderatorss are selected
        status: 'accepted',
        createdBy: currentUser || 'unknown',
        adminID: currentUser || 'unknown',
    };

    try {
      setLoading(true);
      await addDoc(collection(FIRESTORE_DB, 'events'), newEvent);
      alert('Event created successfully!');
      navigate('/localadmin');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Rendering the form
  if (loading) {
    return <Spin tip="Loading..." />; // Ant Design Spin component for loading state
  }



  return (
    <div className="main-content">
    <div className="event-creation">
          
      <h1>Create Event</h1>
      <form onSubmit={handleEventCreation} className="event-form">
        <div className="form-group">
          <label>Event Name:</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
          />
        </div>
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>End Date:</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Venue:</label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* Organizations Checkbox */}
<div className="form-group">
  <label>Organizations:</label>
  <div className="checkbox-group">
    <input
      type="checkbox"
      onChange={() => handleSelectAll(organizations.map((org) => org.id), setSelectedOrganizations, selectedOrganizations.length === organizations.length)}
      checked={selectedOrganizations.length === organizations.length && organizations.length > 0}
    />
    <span>Select All</span>
  </div>

  {organizations.map((org) => (
    <div key={org.id} className="checkbox-group">
      <input
        type="checkbox"
        value={org.id}
        onChange={() => handleCheckboxChange(org.id, setSelectedOrganizations, selectedOrganizations)}
        checked={selectedOrganizations.includes(org.id)}
      />
      <span>{org.name}</span>
    </div>
  ))}
</div>

{/*Department*/}
{departments.map((dept) => (
  <fieldset key={dept.id} className="nested-fieldset">
    <legend>{dept.name}</legend>
    <div className="checkbox-group">
      <input
        type="checkbox"
        value={dept.id}
        onChange={() => handleDepartmentChange(dept.id)}
        checked={selectedDepartments.includes(dept.id)}
      />
      <span>Select Department</span>
    </div>

    {/* Nested Courses */}
    {courses[dept.id] && selectedDepartments.includes(dept.id) && (
  <div className="nested-checkbox-group">
    <label>Courses:</label>
    {courses[dept.id].map((course) => (
      <fieldset key={course.id} className="nested-fieldset">
        <legend>{course.name}</legend>
        <div className="checkbox-group">
          <input
            type="checkbox"
            value={course.id}
            onChange={() => handleCheckboxChange(course.id, setSelectedCourses, selectedCourses)}
            checked={selectedCourses.includes(course.id)}
          />
          <span>Select Course</span>
            </div>

       {/* Nested Majors */}
       {majors[course.id] && selectedCourses.includes(course.id) && majors[course.id].length > 0 && (
          <div className="nested-checkbox-group">
            <label>Majors:</label>
            {majors[course.id].map((major) => (
              <div key={major.id} className="checkbox-group">
                <input
                  type="checkbox"
                  value={major.id}
                  onChange={() => handleCheckboxChange(major.id, setSelectedMajors, selectedMajors)}
                  checked={selectedMajors.includes(major.id)}
                />
                <span>{major.name}</span>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        ))}
      </div>
    )}
  </fieldset>
))}





{/* Render the list of Moderatorss with checkboxes */}
<div>
  <h2>Moderatorss</h2>
  {moderators.length > 0 ? (
    <div className="checkbox-group">
      <input
        type="checkbox"
        onChange={(e) =>
          handleSelectAll(moderators.map((moderator) => moderator.id), setSelectedModerators, selectedModerators.length > 0)
        }
        checked={selectedModerators.length === moderators.length}
      />
      <span>Select All</span>
    </div>
  ) : (
    <p>No moderators found.</p>
  )}

  {moderators.length > 0 &&
    moderators.map((moderator) => (
      <div key={moderator.id} className="checkbox-group">
        <input
          type="checkbox"
          value={moderator.id}
          onChange={() => handleCheckboxChange(moderator.id, setSelectedModerators, selectedModerators)}
          checked={selectedModerators.includes(moderator.id)}
        />
        <span>
          {moderator.fullName} ({moderator.email})
        </span>
      </div>
    ))}
</div>


         {/* Year Levels Checkbox */}
         <div className="form-group">
          <label>Year Levels:</label>
          <div className="checkbox-group">
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(yearLevels, setSelectedYearLevels, selectedYearLevels.length > 0)}
              checked={selectedYearLevels.length === yearLevels.length}
            />
            <span>Select All</span>
          </div>
          {yearLevels.map((yearLevel) => (
            <div key={yearLevel} className="checkbox-group">
              <input
                type="checkbox"
                value={yearLevel}
                onChange={() => handleCheckboxChange(yearLevel, setSelectedYearLevels, selectedYearLevels)}
                checked={selectedYearLevels.includes(yearLevel)}
              />
              <span>{yearLevel}</span>
            </div>
          ))}
        </div>

        <button type="submit" className="submit-button">Create Event</button>
      </form>
    </div>
    </div>
  );
};

export default EventCreation;