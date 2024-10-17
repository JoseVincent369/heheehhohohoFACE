import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import './generalstyles.css';

const EventManagement = () => {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    organizations: [],
    year: [],
    selectedDepartments: {},
  });

  const [organizationsList, setOrganizationsList] = useState([]);
  const [yearLevels, setYearLevels] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
  const [departments, setDepartments] = useState({}); // Stores department, course, and major names

  const navigate = useNavigate(); 

  // Fetch organizations and departments from Firestore on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organizations
        const orgQuerySnapshot = await getDocs(collection(FIRESTORE_DB, "organizations"));
        const orgs = orgQuerySnapshot.docs.map(doc => doc.data().name);
        setOrganizationsList(orgs);

        // Fetch departments, courses, and majors
        const deptQuerySnapshot = await getDocs(collection(FIRESTORE_DB, "departments"));
        const departmentsData = {};

        for (const doc of deptQuerySnapshot.docs) {
          const deptName = doc.data().name;
          const coursesQuerySnapshot = await getDocs(collection(doc.ref, "courses"));
          const coursesData = {};

          for (const courseDoc of coursesQuerySnapshot.docs) {
            const courseName = courseDoc.data().name;
            const majorsQuerySnapshot = await getDocs(collection(courseDoc.ref, "majors"));
            const majors = majorsQuerySnapshot.docs.map(majorDoc => majorDoc.data().name);
            coursesData[courseName] = majors;
          }
          departmentsData[deptName] = coursesData;
        }

        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({
      ...eventData,
      [name]: value,
    });
  };

  const handleOrganizationChange = (e) => {
    const { value, checked } = e.target;
    const { organizations } = eventData;

    if (value === "selectAll") {
      setEventData({
        ...eventData,
        organizations: checked ? organizationsList : [],
      });
    } else {
      if (checked) {
        setEventData({
          ...eventData,
          organizations: [...organizations, value],
        });
      } else {
        setEventData({
          ...eventData,
          organizations: organizations.filter((organization) => organization !== value),
        });
      }
    }
  };

  const handleYearChange = (e) => {
    const { value, checked } = e.target;
    const { year } = eventData;

    if (value === "selectAllYears") {
      setEventData({
        ...eventData,
        year: checked ? yearLevels : [],
      });
    } else {
      if (checked) {
        setEventData({
          ...eventData,
          year: [...year, value],
        });
      } else {
        setEventData({
          ...eventData,
          year: year.filter((yr) => yr !== value),
        });
      }
    }
  };

  const handleDepartmentChange = (e) => {
    const { value, checked } = e.target;
    const [department] = value.split("|");
    const { selectedDepartments } = eventData;

    if (checked) {
      setEventData({
        ...eventData,
        selectedDepartments: {
          ...selectedDepartments,
          [department]: {
            ...(selectedDepartments[department] || {}),
          },
        },
      });
    } else {
      const { [department]: removedDepartment, ...restDepartments } = selectedDepartments;
      setEventData({
        ...eventData,
        selectedDepartments: restDepartments,
      });
    }
  };

  const handleCourseChange = (e) => {
    const { value, checked } = e.target;
    const [department, course] = value.split("|");
    const { selectedDepartments } = eventData;

    if (checked) {
      setEventData({
        ...eventData,
        selectedDepartments: {
          ...selectedDepartments,
          [department]: {
            ...(selectedDepartments[department] || {}),
            [course]: selectedDepartments[department]?.[course] || [],
          },
        },
      });
    } else {
      setEventData({
        ...eventData,
        selectedDepartments: {
          ...selectedDepartments,
          [department]: {
            ...selectedDepartments[department],
            [course]: [],
          },
        },
      });
    }
  };

  const handleMajorChange = (e) => {
    const { value, checked } = e.target;
    const [department, course, major] = value.split("|");
    const { selectedDepartments } = eventData;

    if (checked) {
      setEventData({
        ...eventData,
        selectedDepartments: {
          ...selectedDepartments,
          [department]: {
            ...selectedDepartments[department],
            [course]: [
              ...(selectedDepartments[department]?.[course] || []),
              major,
            ],
          },
        },
      });
    } else {
      setEventData({
        ...eventData,
        selectedDepartments: {
          ...selectedDepartments,
          [department]: {
            ...selectedDepartments[department],
            [course]: (selectedDepartments[department]?.[course] || []).filter(m => m !== major),
          },
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use addDoc to automatically generate a document ID
      await addDoc(collection(FIRESTORE_DB, "events"), eventData);
      alert('Event added successfully!');
      navigate('/superadmin'); // Redirect to superadmin page after successful submission
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  return (
    <div className="event-management">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/superadmin')}>
        &lt; Back
      </button>

      <h2>Create Event</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Event Name"
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        ></textarea>
        <input
          type="datetime-local"
          name="startDate"
          onChange={handleChange}
          required
        />
        <input
          type="datetime-local"
          name="endDate"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="venue"
          placeholder="Venue"
          onChange={handleChange}
          required
        />

        {/* Year Level Selection as Checkboxes */}
        <div className="checkbox-group">
          <label>Select Year Levels:</label>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="selectAllYears"
              value="selectAllYears"
              onChange={handleYearChange}
              checked={eventData.year.length === yearLevels.length}
            />
            <label htmlFor="selectAllYears">Select All</label>
          </div>
          {yearLevels.map((year, index) => (
            <div className="checkbox-item" key={index}>
              <input
                type="checkbox"
                id={`year-${index}`}
                value={year}
                onChange={handleYearChange}
                checked={eventData.year.includes(year)}
              />
              <label htmlFor={`year-${index}`}>{year}</label>
            </div>
          ))}
        </div>

        {/* Organization Selection as Checkboxes */}
        <div className="checkbox-group">
          <label>Select Organizations:</label>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="selectAllOrgs"
              value="selectAll"
              onChange={handleOrganizationChange}
              checked={eventData.organizations.length === organizationsList.length}
            />
            <label htmlFor="selectAllOrgs">Select All</label>
          </div>
          {organizationsList.map((organization, index) => (
            <div className="checkbox-item" key={index}>
              <input
                type="checkbox"
                id={`organization-${index}`}
                value={organization}
                onChange={handleOrganizationChange}
                checked={eventData.organizations.includes(organization)}
              />
              <label htmlFor={`organization-${index}`}>{organization}</label>
            </div>
          ))}
        </div>

<div className="checkbox-group">
  {/* Department Selection */}
  <fieldset>
    <legend>Select Department:</legend>
    {Object.keys(departments).map((department, deptIndex) => (
      <div className="checkbox-item" key={deptIndex}>
        <input
          type="checkbox"
          id={`department-${deptIndex}`}
          value={department}
          onChange={handleDepartmentChange}
          checked={eventData.selectedDepartments[department] !== undefined}
        />
        <label htmlFor={`department-${deptIndex}`}>{department}</label>
      </div>
    ))}
  </fieldset>

  {/* Course Selection (for selected departments) */}
  {Object.keys(eventData.selectedDepartments).length > 0 && (
    <fieldset>
      <legend>Select Course:</legend>
      {Object.keys(eventData.selectedDepartments).map((department, deptIndex) =>
        departments[department] && Object.keys(departments[department]).map((course, courseIndex) => (
          <div className="checkbox-item" key={courseIndex}>
            <input
              type="checkbox"
              id={`course-${deptIndex}-${courseIndex}`}
              value={`${department}|${course}`}
              onChange={handleCourseChange}
              checked={eventData.selectedDepartments[department]?.[course] !== undefined}
            />
            <label htmlFor={`course-${deptIndex}-${courseIndex}`}>{course}</label>
          </div>
        ))
      )}
    </fieldset>
  )}

  {/* Major Selection (for selected courses) */}
  {Object.keys(eventData.selectedDepartments).some(department =>
    Object.keys(eventData.selectedDepartments[department]).length > 0
  ) && (
    <fieldset>
      <legend>Select Major:</legend>
      {Object.keys(eventData.selectedDepartments).map((department, deptIndex) =>
        Object.keys(eventData.selectedDepartments[department]).map((course, courseIndex) =>
          departments[department][course] && departments[department][course].map((major, majorIndex) => (
            <div className="checkbox-item" key={majorIndex}>
              <input
                type="checkbox"
                id={`major-${deptIndex}-${courseIndex}-${majorIndex}`}
                value={`${department}|${course}|${major}`}
                onChange={handleMajorChange}
                checked={eventData.selectedDepartments[department][course].includes(major)}
              />
              <label htmlFor={`major-${deptIndex}-${courseIndex}-${majorIndex}`}>{major}</label>
            </div>
          ))
        )
      )}
    </fieldset>
  )}
</div>




        <button type="submit">Add Event</button>
      </form>
    </div>
  );
};

export default EventManagement;
