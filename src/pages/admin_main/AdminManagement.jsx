import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Input, Checkbox, Button, Badge } from 'antd';
import './generalstyles.css';

const AdminManagement = () => {
    const [adminData, setAdminData] = useState({
        SchoolID: "",
        email: "",
        password: "",
        fname: "",
        mname: "",
        lname: "",
        organizations: [],
        departments: [],
        organizationsOpen: false,
        departmentsOpen: false,
    });

    const [organizationsList, setOrganizationsList] = useState([]);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();
    const { Search } = Input;

    useEffect(() => {
        // Fetch organizations and departments from Firestore
        const fetchData = async () => {
            const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
            const orgs = orgsSnapshot.docs.map(doc => doc.data().name);
            setOrganizationsList(orgs);

            const depsSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
            const deps = depsSnapshot.docs.map(doc => doc.data().name);
            setDepartmentsList(deps);

            const adminsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const admins = adminsSnapshot.docs
                .filter(doc => doc.data().role === 'admin')
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(admins);
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        setAdminData({
            ...adminData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(
                FIREBASE_AUTH,
                adminData.email,
                adminData.password
            );
            const userId = userCredential.user.uid;

            const adminDoc = {
                SchoolID: adminData.SchoolID,
                fname: adminData.fname,
                mname: adminData.mname,
                lname: adminData.lname,
                email: adminData.email,
                role: "admin",
                organizations: adminData.organizations,
                departments: adminData.departments
            };

            await setDoc(doc(FIRESTORE_DB, "users", userId), adminDoc);
            alert('Admin account created successfully!');

            // Update the admin list
            const updatedAdminsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const updatedAdmins = updatedAdminsSnapshot.docs
                .filter(doc => doc.data().role === 'admin')
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(updatedAdmins);
            setShowModal(false); // Close modal after submit
        } catch (error) {
            console.error('Error creating admin:', error);
            alert(`Failed to create admin account: ${error.message}`);
        }
    };

    const handleMultiSelectChange = (value, type) => {
        setAdminData((prev) => ({
            ...prev,
            [type]: value
        }));
    };

    const handleSelectAllToggle = (type) => {
        const allOptions = type === 'organizations' ? organizationsList : departmentsList;
        const currentlySelected = adminData[type];
        const isAllSelected = currentlySelected.length === allOptions.length;

        setAdminData((prev) => ({
            ...prev,
            [type]: isAllSelected ? [] : allOptions
        }));
    };

    const toggleDropdown = (type) => {
        setAdminData((prev) => ({
            ...prev,
            organizationsOpen: type === 'organizations' ? !prev.organizationsOpen : false,
            departmentsOpen: type === 'departments' ? !prev.departmentsOpen : false,
        }));
    };



    return (
        <div className="main-content" style={{ marginLeft: '-15px' }}>
            <div className="admin-management">
            <Button type="primary" onClick={() => setShowModal(true)}>Create Admin</Button>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Admin</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="SchoolID"
                                value={adminData.SchoolID}
                                onChange={handleChange}
                                placeholder="School ID"
                                required
                                autoComplete="off"
                            />
                            <input
                                type="text"
                                name="fname"
                                value={adminData.fname}
                                onChange={handleChange}
                                placeholder="First Name"
                                required
                                autoComplete="off"
                            />
                            <input
                                type="text"
                                name="mname"
                                value={adminData.mname}
                                onChange={handleChange}
                                placeholder="Middle Name"
                                autoComplete="off"
                            />
                            <input
                                type="text"
                                name="lname"
                                value={adminData.lname}
                                onChange={handleChange}
                                placeholder="Last Name"
                                required
                                autoComplete="off"
                            />
                            <input
                                type="email"
                                name="email"
                                value={adminData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                                autoComplete="off"
                            />
                            <input
                                type="password"
                                name="password"
                                value={adminData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                autoComplete="new-password"
                            />

                            {/* Organizations Dropdown */}
                            <div>
                                <Badge count={adminData.organizations.length}>
                                    <Button onClick={() => toggleDropdown('organizations')}>
                                        Select Organizations
                                    </Button>
                                </Badge>
                                {adminData.organizationsOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        zIndex: 10,
                                        borderRadius: '4px',
                                        maxHeight: '350px',
                                        overflowY: 'auto',
                                        width: '200px',
                                        padding: '10px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                    }}>
                                        <Search
                                            placeholder="Search Organizations"
                                            onChange={(e) => handleSearch(e.target.value, 'organizations')}
                                        />
                                        {/* Select All Checkbox for Organizations */}
                                        <Checkbox
                                            checked={adminData.organizations.length === organizationsList.length}
                                            onChange={() => handleSelectAllToggle('organizations')}
                                        >
                                            Select All
                                        </Checkbox>
                                        <Checkbox.Group
                                            options={organizationsList}
                                            value={adminData.organizations}
                                            onChange={(checkedValues) => handleMultiSelectChange(checkedValues, 'organizations')}
                                        />
                                        <Button type="link" onClick={() => setAdminData({ ...adminData, organizationsOpen: false })}>
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Departments Dropdown */}
                            <div>
                                <Badge count={adminData.departments.length}>
                                    <Button onClick={() => toggleDropdown('departments')}>
                                        Select Departments
                                    </Button>
                                </Badge>
                                {adminData.departmentsOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        zIndex: 10,
                                        borderRadius: '4px',
                                        maxHeight: '350px',
                                        overflowY: 'auto',
                                        width: '200px',
                                        padding: '10px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                    }}>
                                        <Search
                                            placeholder="Search Departments"
                                            onChange={(e) => handleSearch(e.target.value, 'departments')}
                                        />
                                        {/* Select All Checkbox for Departments */}
                                        <Checkbox
                                            checked={adminData.departments.length === departmentsList.length}
                                            onChange={() => handleSelectAllToggle('departments')}
                                        >
                                            Select All
                                        </Checkbox>
                                        <Checkbox.Group
                                            options={departmentsList}
                                            value={adminData.departments}
                                            onChange={(checkedValues) => handleMultiSelectChange(checkedValues, 'departments')}
                                        />
                                        <Button type="link" onClick={() => setAdminData({ ...adminData, departmentsOpen: false })}>
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ marginTop: '16px' }}>
                                <Button type="primary" htmlType="submit">Create Admin</Button>
                                <Button type="default" onClick={() => setShowModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <h2>Existing Admins</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>School ID</th>
                        <th>First Name</th>
                        <th>Middle Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Organizations</th>
                        <th>Departments</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map(admin => (
                        <tr key={admin.id}>
                            <td>{admin.SchoolID}</td>
                            <td>{admin.fname}</td>
                            <td>{admin.mname || 'N/A'}</td>
                            <td>{admin.lname}</td>
                            <td>{admin.email}</td>
                            <td>{Array.isArray(admin.organizations) ? admin.organizations.join(", ") : 'N/A'}</td>
                            <td>{Array.isArray(admin.departments) ? admin.departments.join(", ") : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
            </div>
    );
};

export default AdminManagement;
