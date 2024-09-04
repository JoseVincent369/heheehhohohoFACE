import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseutil/firebase_main'; // Import FIREBASE_AUTH for authentication
import {
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Import to track authentication state
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
  const [yearLevels, setYearLevels] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgRef = collection(FIRESTORE_DB, 'organizations');
      const orgSnapshot = await getDocs(orgRef);
      const orgs = orgSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrganizations(orgs);
    };

    fetchOrganizations();
  }, []);

  // Fetch departments, courses, and majors
  useEffect(() => {
    const fetchDepartments = async () => {
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
    };

    fetchDepartments();
  }, []);

  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (value, setFunction, selectedValues) => {
    if (selectedValues.includes(value)) {
      setFunction(selectedValues.filter((item) => item !== value));
    } else {
      setFunction([...selectedValues, value]);
    }
  };

  const handleSelectAll = (items, setFunction, isSelected) => {
    setFunction(isSelected ? [] : items.map((item) => item.id));
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
      createdBy: currentUser || 'unknown', // Use currentUser if available, else fallback to 'unknown'
    };

    try {
      await addDoc(collection(FIRESTORE_DB, 'events'), newEvent);
      alert('Event created successfully!');
      navigate('/localadmin'); // Adjust the path to match your routing structure
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

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
              onChange={(e) =>
                handleSelectAll(organizations, setSelectedOrganizations, selectedOrganizations.length > 0)
              }
              checked={selectedOrganizations.length === organizations.length}
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

        {/* Departments, Courses, Majors Checkbox */}
        <div className="form-group">
          <label>Departments:</label>
          {departments.map((dept) => (
            <div key={dept.id} className="checkbox-group">
              <input
                type="checkbox"
                value={dept.id}
                onChange={() => handleCheckboxChange(dept.id, setSelectedDepartments, selectedDepartments)}
                checked={selectedDepartments.includes(dept.id)}
              />
              <span>{dept.name}</span>

              {/* Nested Courses */}
              {courses[dept.id] && selectedDepartments.includes(dept.id) && (
                <div className="nested-checkbox-group">
                  <label>Courses:</label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        handleSelectAll(courses[dept.id], setSelectedCourses, selectedCourses.length > 0)
                      }
                      checked={selectedCourses.length === courses[dept.id].length}
                    />
                    <span>Select All</span>
                  </div>
                  {courses[dept.id].map((course) => (
                    <div key={course.id} className="checkbox-group">
                      <input
                        type="checkbox"
                        value={course.id}
                        onChange={() => handleCheckboxChange(course.id, setSelectedCourses, selectedCourses)}
                        checked={selectedCourses.includes(course.id)}
                      />
                      <span>{course.name}</span>

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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Year Levels Checkbox */}
        <div className="form-group">
          <label>Year Levels:</label>
          <div className="checkbox-group">
            <input
              type="checkbox"
              onChange={(e) =>
                handleSelectAll(yearLevels, setSelectedYearLevels, selectedYearLevels.length > 0)
              }
              checked={selectedYearLevels.length === yearLevels.length}
            />
            <span>Select All</span>
          </div>
          {yearLevels.map((year) => (
            <div key={year} className="checkbox-group">
              <input
                type="checkbox"
                value={year}
                onChange={() => handleCheckboxChange(year, setSelectedYearLevels, selectedYearLevels)}
                checked={selectedYearLevels.includes(year)}
              />
              <span>{year}</span>
            </div>
          ))}
        </div>

        <button type="submit" className="submit-button">Create Event</button>
      </form>
    </div>
  );
};

export default EventCreation;
