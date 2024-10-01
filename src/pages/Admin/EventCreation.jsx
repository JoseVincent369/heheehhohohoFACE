import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseutil/firebase_main'; // Import FIREBASE_AUTH for authentication
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Import to track authentication state
import LoadingScreen from '../components/LoadingScreen'; 
import './localstyles.css'; // Import the CSS file

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
  const [selectedYearLevel, setSelectedYearLevel] = useState(''); 
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState([]); // Store fetched officers
  const [selectedOfficers, setSelectedOfficers] = useState([]); // Track selected officers



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

  // Fetch departments, courses, and majors
  useEffect(() => {
    setLoading(true);
    const fetchDepartments = async () => {
      try {
        const deptRef = collection(FIRESTORE_DB, 'departments');
        const deptSnapshot = await getDocs(deptRef);
        const depts = deptSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDepartments(depts);

        const coursesMap = {};
        const majorsMap = {};
        for (const dept of deptSnapshot.docs) {
          const courseRef = collection(dept.ref, 'courses');
          const courseSnapshot = await getDocs(courseRef);
          coursesMap[dept.id] = courseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          for (const course of courseSnapshot.docs) {
            const majorRef = collection(course.ref, 'majors');
            const majorSnapshot = await getDocs(majorRef);
            majorsMap[course.id] = majorSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        }

        setCourses(coursesMap);
        setMajors(majorsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching departments, courses, and majors:', error);
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setCurrentUser(user.uid);
        fetchOfficers(user.uid); 
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

   // Fetch officers for the current admin
   const fetchOfficers = async (adminUid) => {
    if (!adminUid) {
      console.error('Admin UID is not defined.');
      return;
    }

    try {
      console.log('Fetching officers for admin UID:', adminUid);

      const officersQuery = query(
        collection(FIRESTORE_DB, 'users'),
        where('role', '==', 'officer'),
        where('adminId', '==', adminUid) // Query officers by adminId
      );

      const officersSnapshot = await getDocs(officersQuery);
      if (officersSnapshot.empty) {
        console.log('No officers found for this admin.');
        setOfficers([]);
      } else {
        const fetchedOfficers = officersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Officers fetched:', fetchedOfficers);
        setOfficers(fetchedOfficers);
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
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

    // Prepare data for Firestore
    const newEvent = {
      name: eventName,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue,
      organizations: selectedOrganizations,
      yearLevels: selectedYearLevels,
      selectedDepartments: selectedDepartments,
      courses: selectedCourses,
      majors: selectedMajors,
      officers: selectedOfficers, 
      status: 'pending',
      createdBy: currentUser || 'unknown', // Use currentUser if available, else fallback to 'unknown'
    };

    try {
      setLoading(true);
      await addDoc(collection(FIRESTORE_DB, 'events'), newEvent);
      alert('Event created successfully!');
      navigate('/localadmin'); // Adjust the path to match your routing structure
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }  finally {
      setLoading(false);
    }

  };


  if (loading) {
    return <LoadingScreen />;
  }
  return (
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


        {/* Departments, Courses, Majors Legend */}
        <div className="form-group">
          <label>Departments:</label>
          {departments.map((dept) => (
            <fieldset key={dept.id} className="nested-fieldset">
              <legend>{dept.name}</legend>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  value={dept.id}
                  onChange={() => handleCheckboxChange(dept.id, setSelectedDepartments, selectedDepartments)}
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
                      {majors[course.id] && selectedCourses.includes(course.id) && (
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
        </div>
{/* Render the list of officers with checkboxes */}
<div>
  <h2>Officers</h2>
  {officers.length > 0 ? (
    <div className="checkbox-group">
      <input
        type="checkbox"
        onChange={(e) =>
          handleSelectAll(officers.map((officer) => officer.id), setSelectedOfficers, selectedOfficers.length > 0)
        }
        checked={selectedOfficers.length === officers.length}
      />
      <span>Select All</span>
    </div>
  ) : (
    <p>No officers found.</p>
  )}

  {officers.length > 0 &&
    officers.map((officer) => (
      <div key={officer.id} className="checkbox-group">
        <input
          type="checkbox"
          value={officer.id}
          onChange={() => handleCheckboxChange(officer.id, setSelectedOfficers, selectedOfficers)}
          checked={selectedOfficers.includes(officer.id)}
        />
        <span>
          {officer.fullName} ({officer.email})
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
  );
};

export default EventCreation;