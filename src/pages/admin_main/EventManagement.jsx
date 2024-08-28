import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import './generalstyles.css';

const EventManagement = () => {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    organizations: [],
    year: []
  });

  const [organizationsList, setOrganizationsList] = useState([]);
  const [yearLevels, setYearLevels] = useState(["Year 1", "Year 2", "Year 3", "Year 4"]);

  // Fetch organizations from Firestore on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const querySnapshot = await getDocs(collection(FIRESTORE_DB, "organizations"));
        const orgs = querySnapshot.docs.map(doc => doc.data().name);
        setOrganizationsList(orgs);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(FIRESTORE_DB, "events", eventData.name), eventData);
      alert('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  return (
    <div className="event-management">
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

        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default EventManagement;
