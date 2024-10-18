import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Input, Button, Table, Modal, Divider } from 'antd';
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
      Modal.success({
        content: 'Organization saved successfully!',
      });
    } catch (error) {
      console.error('Error saving organization:', error);
      Modal.error({
        content: 'Failed to save organization. Please try again.',
      });
    }
  };

  // Handle starting the edit mode
  const handleEdit = (org) => {
    setCurrentOrg(org);
    setEditingOrgId(org.id);
  };

  // Handle deleting an organization
  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this organization?',
      onOk: async () => {
        try {
          await deleteDoc(doc(FIRESTORE_DB, "organizations", id));
          setOrganizations(organizations.filter(org => org.id !== id));
          setFilteredOrganizations(filteredOrganizations.filter(org => org.id !== id));
          Modal.success({
            content: 'Organization deleted successfully!',
          });
        } catch (error) {
          console.error('Error deleting organization:', error);
          Modal.error({
            content: 'Failed to delete organization. Please try again.',
          });
        }
      }
    });
  };

  // Reset the form after submission or canceling an edit
  const resetForm = () => {
    setCurrentOrg({ name: "", id: null });
    setEditingOrgId(null);
  };

  const columns = [
    {
      title: 'Organization Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, org) => (
        <span>
          <Button type="link" onClick={() => handleEdit(org)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDelete(org.id)}>Delete</Button>
        </span>
      ),
    },
  ];

  return (
    <div className="admin-panel">
      {/* Back Button */}


      <h2>{editingOrgId ? "Edit Organization" : "Add Organization"}</h2>
      <Input
        placeholder="Organization Name"
        value={currentOrg.name}
        onChange={handleInputChange}
        style={{ marginBottom: '16px' }}
      />
      <Button type="primary" onClick={handleSubmit} style={{ marginRight: '8px' }}>
        {editingOrgId ? "Update Organization" : "Add Organization"}
      </Button>
      {editingOrgId && (
        <Button type="default" onClick={resetForm}>
          Cancel
        </Button>
      )}

      <Divider orientation="left">Search Organizations</Divider>
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '16px' }}
      />

      <Divider orientation="left">Existing Organizations</Divider>
      <Table
        columns={columns}
        dataSource={filteredOrganizations}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
};

export default AddOrganization;
