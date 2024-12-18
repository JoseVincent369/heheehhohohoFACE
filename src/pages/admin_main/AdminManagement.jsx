import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Input, Checkbox, Button, Badge, Table, Space, Select  } from 'antd';
import './generalstyles.css';

const AdminManagement = () => {
    const [adminData, setAdminData] = useState({
        AdminSchollID: "",
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
    const [isEditing, setIsEditing] = useState(false); // Track if we are editing
    const [currentAdminId, setCurrentAdminId] = useState(null); // Track current admin being edited


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
                AdminSchollID: adminData.AdminSchollID,
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

    const columns = [
        { title: 'School ID', dataIndex: 'AdminSchollID', key: 'AdminSchollID' },
        { title: 'First Name', dataIndex: 'fname', key: 'fname' },
        { title: 'Middle Name', dataIndex: 'mname', key: 'mname', render: mname => mname || 'N/A' },
        { title: 'Last Name', dataIndex: 'lname', key: 'lname' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Organizations', dataIndex: 'organizations', key: 'organizations', render: orgs => Array.isArray(orgs) ? orgs.join(", ") : 'N/A' },
        { title: 'Departments', dataIndex: 'departments', key: 'departments', render: deps => Array.isArray(deps) ? deps.join(", ") : 'N/A' },
    ];


    return (
        <div className="container-fluid mt-4" style={{ marginTop: '40px' }}>
            {showModal && (
                <div className="modal-overlay d-flex justify-content-center align-items-center">
                    <div className="modal-content p-4" style={{ maxWidth: '600px', width: '100%' }}>
                        <h2>Create Admin</h2>
                        <form onSubmit={handleSubmit} className="row g-3">
                            <div className="col-12 col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="AdminSchollID"
                                    value={adminData.AdminSchollID}
                                    onChange={handleChange}
                                    placeholder=" Admin ID"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="fname"
                                    value={adminData.fname}
                                    onChange={handleChange}
                                    placeholder="First Name"
                                    required
                                    autoComplete="off"

                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="mname"
                                    value={adminData.mname}
                                    onChange={handleChange}
                                    placeholder="Middle Name"
                                    autoComplete="off"

                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="lname"
                                    value={adminData.lname}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                    required
                                    autoComplete="off"

                                />
                            </div>
                            <div className="col-12">
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={adminData.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    required
                                    autoComplete="off"

                                />
                            </div>
                            <div className="col-12">
                                <input
                                    type="password"
                                    className="form-control"
                                    name="password"
                                    value={adminData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            {/* Organizations and Departments Dropdowns */}
                            <div className="col-12 d-flex justify-content-center">
                                <Select
                                    mode="multiple"
                                    placeholder="Select Organizations"
                                    value={adminData.organizations}
                                    onChange={(value) => handleMultiSelectChange(value, 'organizations')}
                                    style={{ width: '200px', marginRight: '10px' }}
                                >
                                    {organizationsList.map((org, index) => (
                                        <Select.Option key={index} value={org}>{org}</Select.Option>
                                    ))}
                                </Select>

                                <Select
                                    mode="multiple"
                                    placeholder="Select Departments"
                                    value={adminData.departments}
                                    onChange={(value) => handleMultiSelectChange(value, 'departments')}
                                    style={{ width: '200px' }}
                                >
                                    {departmentsList.map((dep, index) => (
                                        <Select.Option key={index} value={dep}>{dep}</Select.Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="col-12 d-flex justify-content-center">
                                <Button type="primary" htmlType="submit">Create Admin</Button>
                                <Button type="default" onClick={() => setShowModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <h2 style={{ marginTop: '40px' }}>Existing Admins</h2>
            <Button
                type="primary"
                onClick={() => setShowModal(true)}
                className="my-3"
            >
                Create Admin
            </Button>
            <Table
                columns={columns}
                dataSource={admins}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                style={{ marginTop: '30px' }}
            />
        </div>
    );
};

export default AdminManagement;
