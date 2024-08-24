import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

const EventManagement = () => {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    organizations: [], 
  });

  const [organizationsList, setOrganizationsList] = useState([]); // State to hold organizations fetched from Firebase

  // Fetch organizations from Firestore on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const querySnapshot = await getDocs(collection(FIRESTORE_DB, "organizations"));
        const orgs = querySnapshot.docs.map(doc => doc.data().name); // Assuming each document has a 'name' field
        setOrganizationsList(orgs);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  const handleChange = (e) => {
    setEventData({
      ...eventData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrganizationChange = (e) => { 
    const { value, checked } = e.target;
    const { organizations } = eventData; 

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

        {/* Organization Selection as Checkboxes */}
        <div>
          <label>Select Organizations:</label>
          {organizationsList.map((organization, index) => (
            <div key={index}>
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
