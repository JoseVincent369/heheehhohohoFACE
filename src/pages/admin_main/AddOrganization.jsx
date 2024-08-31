import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './generalstyles.css';

const AddOrganization = () => {
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState({ name: "", id: null });
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term

  const navigate = useNavigate(); // Initialize navigate for navigation

  // Fetch the organizations list from Firestore on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgsCollection = collection(FIRESTORE_DB, "organizations");
      const orgsSnapshot = await getDocs(orgsCollection);
      const orgsList = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizations(orgsList);
      setFilteredOrganizations(orgsList);
    };

    fetchOrganizations();
  }, []);

  // Update the filtered list based on the search term
  useEffect(() => {
    const filtered = organizations.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrganizations(filtered);
  }, [searchTerm, organizations]);

  // Handle input change for the form
  const handleInputChange = (e) => {
    setCurrentOrg({ ...currentOrg, name: e.target.value });
  };

  // Handle form submission for adding or editing an organization
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentOrg.id) {
        // Update the existing organization
        await updateDoc(doc(FIRESTORE_DB, "organizations", currentOrg.id), { name: currentOrg.name });
        setOrganizations(organizations.map(org => (org.id === currentOrg.id ? currentOrg : org)));
        setFilteredOrganizations(filteredOrganizations.map(org => (org.id === currentOrg.id ? currentOrg : org)));
      } else {
        // Add a new organization
        const docRef = await addDoc(collection(FIRESTORE_DB, "organizations"), { name: currentOrg.name });
        const newOrg = { id: docRef.id, name: currentOrg.name };
        setOrganizations([...organizations, newOrg]);
        setFilteredOrganizations([...filteredOrganizations, newOrg]);
      }
      resetForm();
      alert('Organization saved successfully!');
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Failed to save organization. Please try again.');
    }
  };

  // Handle starting the edit mode
  const handleEdit = (org) => {
    setCurrentOrg(org);
    setEditingOrgId(org.id);
  };

  // Handle deleting an organization
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await deleteDoc(doc(FIRESTORE_DB, "organizations", id));
        setOrganizations(organizations.filter(org => org.id !== id));
        setFilteredOrganizations(filteredOrganizations.filter(org => org.id !== id));
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
    setEditingOrgId(null);
  };

  return (
    <div className="admin-panel">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/superadmin')}>
        &lt; Back
      </button>

      <h2>{editingOrgId ? "Edit Organization" : "Add Organization"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={currentOrg.name}
          onChange={handleInputChange}
          placeholder="Organization Name"
          required
        />
        <button type="submit">{editingOrgId ? "Update Organization" : "Add Organization"}</button>
        {editingOrgId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Organizations"
        />
      </div>

      <h3>Existing Organizations</h3>
      <div className="organization-list">
        {filteredOrganizations.map(org => (
          <div className="organization-item" key={org.id}>
            {editingOrgId === org.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={currentOrg.name}
                  onChange={handleInputChange}
                />
                <button onClick={handleSubmit}>Update</button>
                <button onClick={resetForm}>Cancel</button>
              </div>
            ) : (
              <>
                <span>{org.name}</span>
                <div>
                  <button onClick={() => handleEdit(org)}>Edit</button>
                  <button onClick={() => handleDelete(org.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddOrganization;
