import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getDoc, setDoc, getDocs, collection, doc } from 'firebase/firestore';
import { Input, Checkbox, Button, Badge } from 'antd';
import './localstyles.css';

const CreateModeratorModal = ({ showModal, handleClose, currentAdmin, fetchModerators }) => {
  const [moderatorData, setModeratorData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    organization: '',
    department: '',
  });

  const [error, setError] = useState('');
  const [organizationsList, setOrganizationsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [orgDropdownStatus, setOrgDropdownStatus] = useState(false);
  const [deptDropdownStatus, setDeptDropdownStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [dropdownStatus, setDropdownStatus] = useState({ orgOpen: false, deptOpen: false });

  const { Search } = Input;

  // Fetch current admin data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        const adminRef = doc(FIRESTORE_DB, 'admins', user.uid);
        getDoc(adminRef).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            setCurrentAdmin({ uid: user.uid, ...docSnapshot.data() });
          }
        });
      } else {
        setCurrentAdmin(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch organizations and departments
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
        const orgs = orgsSnapshot.docs.map((doc) => doc.data().name);
        const sortedOrgs = orgs.sort();
        setOrganizationsList(orgs);
        setFilteredOrgs(sortedOrgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError(`Failed to fetch organizations: ${error.message}`);
      }
    };

    const fetchDepartments = async () => {
      try {
        const depsSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
        const deps = depsSnapshot.docs.map((doc) => doc.data().name);
        setDepartmentsList(deps);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError(`Failed to fetch departments: ${error.message}`);
      }
    };

    fetchOrganizations();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setModeratorData({
      ...moderatorData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle search input for organizations
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (value.length > 0) {
      const filtered = organizationsList.filter(org => org.toLowerCase().startsWith(value[0]));
      setFilteredOrgs(filtered);
    } else {
      setFilteredOrgs(organizationsList);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, middleName, email, password, organization, department } = moderatorData;

    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      if (!currentAdmin || !currentAdmin.uid) {
        throw new Error("Admin not authenticated or UID not found.");
      }

      // Combine names into fullName for storage if needed
      const fullName = `${firstName} ${middleName} ${lastName}`.trim();

      const newModeratorData = {
        fullName,
        email,
        department,
        organization,
        role: 'moderator',
        createdBy: currentAdmin.uid,
        uid: user.uid,
      };

      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), newModeratorData);

      fetchModerators();
      handleClose(); 
    } catch (error) {
      console.error('Error creating moderator:', error);
      setError(`Error creating moderator: ${error.message}`);
    }
  };

  const toggleOrgDropdown = () => {
    setDropdownStatus({ orgOpen: !dropdownStatus.orgOpen, deptOpen: false });
  };

  const toggleDeptDropdown = () => {
    setDropdownStatus({ orgOpen: false, deptOpen: !dropdownStatus.deptOpen });
  };

  const handleOrgChange = (selectedOrgs) => {
    setModeratorData({
      ...moderatorData,
      organization: selectedOrgs,
    });
  };
  
  const handleDeptChange = (selectedDepts) => {
    setModeratorData({
      ...moderatorData,
      department: selectedDepts,
    });
  };
  
  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Moderator</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="firstName"
                value={moderatorData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                required
                autoComplete="off"
              />
              <input
                type="text"
                name="middleName"
                value={moderatorData.middleName}
                onChange={handleChange}
                placeholder="Middle Name"
                autoComplete="off"
              />
              <input
                type="text"
                name="lastName"
                value={moderatorData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                required
                autoComplete="off"
              />
              <input
                type="email"
                name="email"
                value={moderatorData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                autoComplete="off"
              />
              <input
                type="password"
                name="password"
                value={moderatorData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                autoComplete="new-password"
              />

              {/* Organization Checkbox Dropdown */}
              <Badge count={moderatorData.organization.length}>
                <Button onClick={toggleOrgDropdown}>Select Organizations</Button>
              </Badge>
              {dropdownStatus.orgOpen && (
                <div
                  style={{
                    width: '200px',
                    maxHeight: '350px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    position: 'absolute',
                    zIndex: 10,
                    borderRadius: '4px',
                    padding: '10px',
                  }}
                >
                  <Search
                    placeholder="Search Organizations"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                    <Checkbox
                      indeterminate={moderatorData.organization.length > 0 && moderatorData.organization.length < organizationsList.length}
                      onChange={(e) => handleOrgChange(e.target.checked ? organizationsList : [])}
                      checked={moderatorData.organization.length === organizationsList.length}
                    >
                      Select All
                    </Checkbox>
                    <Checkbox.Group
                      options={organizationsList}
                      value={moderatorData.organization}
                      onChange={handleOrgChange}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '50%' }}>
                    <Button type="link" onClick={() => setDropdownStatus({ ...dropdownStatus, orgOpen: false })}>Ok</Button>
                    <Button type="link" onClick={() => setDropdownStatus({ ...dropdownStatus, orgOpen: false })}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Department Checkbox Dropdown */}
              <Badge count={moderatorData.department.length}>
                <Button onClick={toggleDeptDropdown}>Select Departments</Button>
              </Badge>
              {dropdownStatus.deptOpen && (
                <div
                  style={{
                    width: '200px',
                    maxHeight: '350px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    position: 'absolute',
                    zIndex: 10,
                    borderRadius: '4px',
                    padding: '10px',
                    overflow: 'auto',
                  }}
                >
                  <Search
                    placeholder="Search Department"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                    <Checkbox
                      indeterminate={moderatorData.department.length > 0 && moderatorData.department.length < departmentsList.length}
                      onChange={(e) => handleDeptChange(e.target.checked ? departmentsList : [])}
                      checked={moderatorData.department.length === departmentsList.length}
                    >
                      Select All
                    </Checkbox>
                    <Checkbox.Group
                      options={departmentsList}
                      value={moderatorData.department}
                      onChange={handleDeptChange}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '50%' }}>
                    <Button type="link" onClick={() => setDropdownStatus({ ...dropdownStatus, deptOpen: false })}>Ok</Button>
                    <Button type="link" onClick={() => setDropdownStatus({ ...dropdownStatus, deptOpen: false })}>Cancel</Button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <Button type="primary" htmlType="submit">Create Moderator</Button>
                <Button type="default" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}
    </>
  );
};

export default CreateModeratorModal;
