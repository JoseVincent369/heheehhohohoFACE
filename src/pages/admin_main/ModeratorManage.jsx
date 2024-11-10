import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Modal, Table, Button, Input, Form, Select, Row, Col } from 'antd';

const ModeratorManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    // Fetch moderators from Firestore
    const fetchModerators = async () => {
      setLoading(true);
      try {
        const moderatorsQuery = query(collection(db, 'users'), where('role', '==', 'moderator'));
        const moderatorsSnapshot = await getDocs(moderatorsQuery);
        const moderatorsList = moderatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModerators(moderatorsList);
      } catch (error) {
        console.error('Error fetching moderators:', error);
      }
      setLoading(false);
    };

    // Fetch departments from Firestore
    const fetchDepartments = async () => {
      try {
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const departmentsList = departmentsSnapshot.docs.map((doc) => ({
          value: doc.data().name, // Use the name, not doc.id
          label: doc.data().name,
        }));
        setDepartments(departmentsList);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    // Fetch organizations from Firestore
    const fetchOrganizations = async () => {
      try {
        const organizationsSnapshot = await getDocs(collection(db, 'organizations'));
        const organizationsList = organizationsSnapshot.docs.map((doc) => ({
          value: doc.data().name, // Use the name, not doc.id
          label: doc.data().name,
        }));
        setOrganizations(organizationsList);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchModerators();
    fetchDepartments();
    fetchOrganizations();
  }, [db]);

  // Add or Edit Moderator
  const handleSaveModerator = async (values) => {
    setLoading(true);
    try {
      const { department, organization, ...restValues } = values; // Extracting selected department and organization

      // Modify department and organization to store their names
      const newValues = {
        ...restValues,
        role: 'moderator',
        createdBy: auth.currentUser.uid,
        department: department,  // Store the names of selected departments
        organization: organization,  // Store the name of the selected organization
      };

      if (selectedModerator?.id) {
        // Update existing moderator
        const moderatorRef = doc(db, 'users', selectedModerator.id);
        await updateDoc(moderatorRef, newValues);
        setModerators(
          moderators.map((moderator) =>
            moderator.id === selectedModerator.id ? { ...moderator, ...newValues } : moderator
          )
        );
      } else {
        // Add new moderator
        const newModeratorRef = doc(collection(db, 'users'));
        await setDoc(newModeratorRef, newValues);
        setModerators([...moderators, { id: newModeratorRef.id, ...newValues }]);
      }
      setSelectedModerator(null);
    } catch (error) {
      console.error('Error saving moderator:', error);
    }
    setLoading(false);
  };

  // Delete Moderator
  const handleDeleteModerator = async (moderatorId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', moderatorId));
      setModerators(moderators.filter((moderator) => moderator.id !== moderatorId));
    } catch (error) {
      console.error('Error deleting moderator:', error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Department',
      render: (text, record) => record.department.join(', '), // Display department names
    },
    {
      title: 'Organization',
      dataIndex: 'organization',
      render: (org) => (org ? org : 'N/A'),
    },
    {
      title: 'Actions',
      render: (text, record) => (
        <div style={{ textAlign: 'center' }}> {/* This div centers the buttons */}
          <Button
            onClick={() => setSelectedModerator(record)}
            style={{ marginRight: '10px', marginTop: '10px' }} // Margin to the right of the Edit button
          >
            Edit
          </Button>
          <Button
            danger
            onClick={() => handleDeleteModerator(record.id)}
            style={{ marginLeft: '10px', marginTop: '10px' }} // Margin to the left of the Delete button
          >
            Delete
          </Button>
        </div>
      ),
    }    
  ];

  return (
    <div className='container' style={{ marginTop: '40px' }}>
      <h2>Moderator Management</h2>
      <Button
        type="primary"
        onClick={() => setSelectedModerator({})} // Open Add Moderator form
      >
        Add Moderator
      </Button>
      <Table
        columns={columns}
        dataSource={moderators}
        rowKey="id"
        loading={loading}
        style={{ marginTop: '40px' }}
      />

      {/* Modal for Adding/Editing Moderator */}
      <Modal
        title={selectedModerator?.id ? 'Edit Moderator' : 'Add Moderator'}
        open={selectedModerator !== null}
        onCancel={() => setSelectedModerator(null)}
        footer={null}
        width={600} // Adjust modal width if necessary
      >
<Form
  onFinish={handleSaveModerator}
  initialValues={selectedModerator || {}}
  labelCol={{ span: 8 }}  // Adjust label width
  wrapperCol={{ span: 16 }} // Adjust input width
  layout="horizontal" // Ensures elements are in horizontal layout
>
  <Form.Item
    label="Full Name"
    name="fullName"
    rules={[{ required: true, message: 'Please input the full name' }]}
  >
    <Input />
  </Form.Item>
  <Form.Item
    label="Email"
    name="email"
    rules={[{ required: true, message: 'Please input the email' }]}
  >
    <Input type="email" />
  </Form.Item>
  <Form.Item
    label="Department"
    name="department"
    rules={[{ required: true, message: 'Please select the department' }]}
  >
    <Select
      mode="multiple"
      options={departments}  // Display department names in the dropdown
      placeholder="Select Departments"
    />
  </Form.Item>
  <Form.Item
    label="Organization"
    name="organization"
    rules={[{ required: true, message: 'Please select the organization' }]}
  >
    <Select
      mode="multiple"
      options={organizations}
      placeholder="Select Organizations"
    />
  </Form.Item>

  {/* Center the Add Moderator button */}
  <div style={{ textAlign: 'center' }}>
    <Button
      type="primary"
      htmlType="submit"
      style={{
        marginTop: '20px', // Optional, for some spacing
      }}
    >
      {selectedModerator?.id ? 'Save Moderator' : 'Add Moderator'}
    </Button>
  </div>
</Form>
      </Modal>
    </div>
  );
};

export default ModeratorManagement;
