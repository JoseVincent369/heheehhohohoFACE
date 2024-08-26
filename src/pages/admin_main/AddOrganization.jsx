import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './generalstyles.css';
const AddOrganization = () => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState({ name: "", id: null });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch the organizations list from Firestore on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgsCollection = collection(FIRESTORE_DB, "organizations");
      const orgsSnapshot = await getDocs(orgsCollection);
      const orgsList = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizations(orgsList);
    };

    fetchOrganizations();
  }, []);

  // Handle input change for the form
  const handleInputChange = (e) => {
    setCurrentOrg({ ...currentOrg, name: e.target.value });
  };

  // Handle form submission for adding or editing an organization
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && currentOrg.id) {
        // Update the existing organization
        await updateDoc(doc(FIRESTORE_DB, "organizations", currentOrg.id), { name: currentOrg.name });
        setOrganizations(organizations.map(org => (org.id === currentOrg.id ? currentOrg : org)));
      } else {
        // Add a new organization
        const docRef = await addDoc(collection(FIRESTORE_DB, "organizations"), { name: currentOrg.name });
        setOrganizations([...organizations, { id: docRef.id, name: currentOrg.name }]);
      }
      resetForm();
      alert('Organization saved successfully!');
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Failed to save organization. Please try again.');
    }
  };

  // Handle editing an organization
  const handleEdit = (org) => {
    setCurrentOrg(org);
    setIsEditing(true);
  };

  // Handle deleting an organization
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await deleteDoc(doc(FIRESTORE_DB, "organizations", id));
        setOrganizations(organizations.filter(org => org.id !== id));
        alert('Organization deleted successfully!');
      } catch (error) {
        console.error('Error deleting organization:', error);
        alert('Failed to delete organization. Please try again.');
      }
    }
  };

  // Reset the form after submission or canceling an edit
  const resetForm = () => {
    setCurrentOrg({ name: "", id: null });
    setIsEditing(false);
  };

  return (
    <div className="admin-panel">
      <h2>{isEditing ? "Edit Organization" : "Add Organization"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={currentOrg.name}
          onChange={handleInputChange}
          placeholder="Organization Name"
          required
        />
        <button type="submit">{isEditing ? "Update Organization" : "Add Organization"}</button>
        {isEditing && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      <h3>Existing Organizations</h3>
      <ul>
        {organizations.map(org => (
          <li key={org.id}>
            {org.name}
            <button onClick={() => handleEdit(org)}>Edit</button>
            <button onClick={() => handleDelete(org.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddOrganization;
