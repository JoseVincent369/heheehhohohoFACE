import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { FIREBASE_APP  } from '../../firebaseutil/firebase_main';
import { Timestamp  } from 'firebase/firestore';
import { Input, Checkbox, Button, Select, Spin, Form, DatePicker  } from 'antd';
import moment from 'moment';
import './ModeratorStyles.css';

const { Search } = Input;
const { Option } = Select;

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
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState({});
  const [majors, setMajors] = useState({});
  const [students, setStudents] = useState([]);
  const [yearLevels] = useState([
    '1st Year', 
    '2nd Year', 
    '3rd Year', 
    '4th Year'
]);
  const [user, setUser] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState(students);
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
    const fetchOrganizationsAndDepartments = async () => {
      if (!user) return; // Wait for user to be authenticated
  
      setLoading(true);
      try {
        // Fetch organizations
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const orgs = orgsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrganizations(orgs);
  
        // Fetch user's assigned departments (by names, assuming that's how they are stored)
        const userSnapshot = await getDocs(collection(db, 'users'));
        const currentUser = userSnapshot.docs.find((doc) => doc.id === user.uid);
        const moderatorDepartments = currentUser?.data()?.department; // Use the correct field for department
  
        console.log("Moderator's departments:", moderatorDepartments); // Debugging
  
        if (moderatorDepartments && moderatorDepartments.length > 0) {
          // Fetch all departments
          const deptsSnapshot = await getDocs(collection(db, 'departments'));
          const depts = deptsSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter(dept => moderatorDepartments.includes(dept.name)); // Use dept.name
  
          console.log("Fetched departments:", depts); // Debugging
          setDepartments(depts);
        }
      } catch (error) {
        console.error('Error fetching organizations or departments:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrganizationsAndDepartments();
  }, [db, user]);
  
  
  // Fetch users with role 'user'
const fetchUsersWithRoleUser = async () => {
  if (!user) return;

  setLoading(true);
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const filteredUsers = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'user' && (user.department || user.department === 'department'));

    setStudents(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchUsersWithRoleUser();
}, [user]);




// Fetch courses based on selected departments
useEffect(() => {
  const fetchCourses = async () => {
    if (selectedDepartments.length === 0) return;
    setLoading(true);
    try {
      const coursesPromises = selectedDepartments.map(async (deptId) => {
        const coursesSnapshot = await getDocs(collection(db, `departments/${deptId}/courses`));
        const coursesData = coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return { deptId, coursesData }; // Return both deptId and coursesData
      });
      const coursesArrays = await Promise.all(coursesPromises);
      
      // Create a mapping of department ID to its courses
      const coursesMap = {};
      coursesArrays.forEach(({ deptId, coursesData }) => {
        coursesMap[deptId] = coursesData;
      });
      setCourses(coursesMap); // Set the courses state to the new mapping
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, [selectedDepartments, db]);

// Fetch majors based on selected courses
useEffect(() => {
  const fetchMajors = async () => {
    if (selectedCourses.length === 0) return;
    setLoading(true);
    try {
      const majorsPromises = selectedCourses.map(async (courseId) => {
        // Ensure to get the department ID of the selected course
        const deptId = selectedDepartments[0]; // Assuming one department is selected
        const majorsSnapshot = await getDocs(collection(db, `departments/${deptId}/courses/${courseId}/majors`));
        const majorsData = majorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return { courseId, majorsData }; // Return both courseId and majorsData
      });
      const majorsArrays = await Promise.all(majorsPromises);
      
      // Create a mapping of course ID to its majors
      const majorsMap = {};
      majorsArrays.forEach(({ courseId, majorsData }) => {
        majorsMap[courseId] = majorsData;
      });
      setMajors(majorsMap); // Set the majors state to the new mapping
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
  

  const handleSelectAll = (type) => (e) => {
    const { checked } = e.target;
    if (type === 'organizations') {
      if (checked) {
        setSelectedOrganizations(organizations.map(org => org.id));
      } else {
        setSelectedOrganizations([]);
      }
    } else if (type === 'departments') {
      if (checked) {
        setSelectedDepartments(departments.map(dept => dept.id));
      } else {
        setSelectedDepartments([]);
      }
    }
  };
  
  const handleYearLevelClick = (yearLevel) => {
    setSelectedYearLevels(prev => 
      prev.includes(yearLevel) ? prev.filter(level => level !== yearLevel) : [...prev, yearLevel]
    );
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to create an event.');
      return;
    }
  
    setLoading(true);
    try {
      // Convert start and end dates to Firestore Timestamp
      const startDateTimestamp = Timestamp.fromDate(eventStartDate.toDate());
      const endDateTimestamp = Timestamp.fromDate(eventEndDate.toDate());
  
      // Fetch the adminID from the createdBy field
      const userSnapshot = await getDocs(collection(db, 'users'));
      const currentUser = userSnapshot.docs.find((doc) => doc.id === user.uid);
      const adminID = currentUser?.data()?.createdBy || null; // Get the admin ID from the 'createdBy' field or use null if undefined
  
      // Map selected values to their names
      const selectedOrgNames = selectedOrgs.map(orgId => organizations.find(org => org.id === orgId)?.name).filter(Boolean); // Remove undefined names
      const selectedCourseNames = selectedCourses.map(courseId => {
        const deptCourses = Object.values(courses).flat();
        return deptCourses.find(course => course.id === courseId)?.name;
      }).filter(Boolean);
  
      const selectedMajorNames = selectedMajors.map(majorId => {
        const deptMajors = Object.values(majors).flat();
        return deptMajors.find(major => major.id === majorId)?.name;
      }).filter(Boolean);
  
      const selectedYearLevelNames = selectedYearLevels.map(yearId => yearId); // Assuming yearId is a valid name
  
      const mappedUserIds = students?.map(student => student.id) || []; // Create an array of user IDs

  
      // Constructing the event data, using null for undefined values
      const eventData = {
        name: eventName || null,
        description: eventDescription || null,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        venue: venue || null,
        organizations: selectedOrgNames || null,
        yearLevels: selectedYearLevelNames || null,
        selectedDepartments: selectedDepartments.length > 0 ? selectedDepartments : null, // Check if departments are selected
        courses: selectedCourseNames.length > 0 ? selectedCourseNames : null,
        majors: selectedMajorNames.length > 0 ? selectedMajorNames : null,
        userInCharge: mappedUserIds.length > 0 ? mappedUserIds : [], // Use an empty array if no users are selected        // Use null if no users are selected
        moderators: [user.uid],
        adminID: adminID,
        status: 'pending',
      };
  
      // Log the event data to check for undefined values
      console.log('Event Data:', eventData);
  
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

const handleSearchUsers = (value) => {
  // Filter students based on the email
  const filtered = students.filter(student =>
    student.email.toLowerCase().includes(value.toLowerCase())
  );
  
  setFilteredStudents(filtered); // Update state with filtered results
};

return (
  <div className="container my-4">
    <h2 className="text-center mb-4">Create Event</h2>
    <form onSubmit={handleCreateEvent}>
      <div className="row">
        {/* Event Name */}
        <div className="col-md-6 mb-3">
          <label>Event Name:</label>
          <input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="form-control"
          />
        </div>

        {/* Venue */}
        <div className="col-md-6 mb-3">
          <label>Venue:</label>
          <input
            type="text"
            placeholder="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="mb-3">
        <label>Description:</label>
        <textarea
          placeholder="Event Description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          required
          className="form-control"
          rows="4"
        />
      </div>

      
      <div className="row" style={{ marginTop: '40px' }}> 
  <div className="col-md-12 mb-3">
    <label>Start Date:</label>
    <DatePicker
      showTime={{ format: 'h:mm A', use12Hours: true }}
      format="YYYY-MM-DD h:mm A"
      value={eventStartDate ? moment(eventStartDate) : null}
      onChange={(date) => setEventStartDate(date)}
      style={{ width: '100%' }}
      required
    />
  </div>
  <div className="col-md-12 mb-3">
    <label>End Date:</label>
    <DatePicker
      showTime={{ format: 'h:mm A', use12Hours: true }}
      format="YYYY-MM-DD h:mm A"
      value={eventEndDate ? moment(eventEndDate) : null}
      onChange={(date) => setEventEndDate(date)}
      style={{ width: '100%' }}
      required
    />
  </div>
</div>


      {/* Organization Selection */}
      <Form.Item label="Organizations" className="mb-3" style={{  marginTop: '40px' }}>
        <Select
          mode="multiple"
          showSearch
          placeholder="Search and select organizations"
          value={selectedOrganizations}
          onChange={setSelectedOrganizations}
          style={{ width: '100%' }}
        >
          {organizations.map((org) => (
            <Option key={org.id} value={org.id}>
              <Checkbox
                checked={selectedOrganizations.includes(org.id)}
              >
                {org.name}
              </Checkbox>
            </Option>
          ))}
        </Select>
      </Form.Item>

   
{/* Departments with Nested Courses and Majors */}
{departments.map((dept) => (
  <fieldset key={dept.id} className="nested-fieldset">
    <legend>{dept.name}</legend>
    <div className="checkbox-group">
      <input
        type="checkbox"
        value={dept.id}
        checked={selectedDepartments.includes(dept.id)}
        onChange={handleCheckboxChange(setSelectedDepartments)}

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
                onChange={handleCheckboxChange(setSelectedCourses)}
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
                      onChange={handleCheckboxChange(setSelectedMajors)}
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

      {/* Year Levels */}
      <Form.Item label="Year Levels" style={{  marginTop: '40px' }}>
        <Select
          mode="multiple"
          placeholder="Select Year Levels"
          value={selectedYearLevels}
          onChange={setSelectedYearLevels}
          style={{ width: '100%' }}
        >
          {yearLevels.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>
      </Form.Item>


      {/* Users (Searchable) */}
      <Form.Item label="Users" style={{  marginTop: '40px' }}>
        {loading ? (
          <Spin />
        ) : (
          <Select
            mode="multiple"
            placeholder="Search Users by Email"
            onSearch={handleSearchUsers}
            style={{ width: '100%' }}
            showSearch
          >
            {students.map((student) => (
              <Option key={student.id} value={student.id}>
                {student.lname} {student.fname} ({student.email})
              </Option>
            ))}
          </Select>
        )}
      </Form.Item>

      <div className="button-container">
        <Button type="primary" htmlType="submit" disabled={loading}>
          {loading ? 'Creating Event...' : 'Create Event'}
        </Button>
      </div>
    </form>
  </div>
);
};

export default EventManagement;
