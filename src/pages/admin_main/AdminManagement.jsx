import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import './generalstyles.css';


const AdminManagement = () => {
    const [adminData, setAdminData] = useState({
        idNumber: "",
        email: "",
        password: "",
        fullName: "",
        organization: ""
    });

    const [organizationsList, setOrganizationsList] = useState([]);
    const [admins, setAdmins] = useState([]);

    const navigate = useNavigate(); // Initialize navigate for navigation

    useEffect(() => {
        // Fetch organizations from Firestore
        const fetchOrganizations = async () => {
            const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
            const orgs = orgsSnapshot.docs.map(doc => doc.data().name); // Retrieve the 'name' field from each document
            setOrganizationsList(orgs);
        };

        // Fetch admins from Firestore
        const fetchAdmins = async () => {
            const adminsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const admins = adminsSnapshot.docs
                .filter(doc => doc.data().role === 'admin') // Filter only admins
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(admins);
        };

        fetchOrganizations();
        fetchAdmins();
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
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                FIREBASE_AUTH,
                adminData.email,
                adminData.password
            );

            const userId = userCredential.user.uid;

            // Set the document in Firestore with the UID as the document ID
            await setDoc(doc(FIRESTORE_DB, "users", userId), {
                idNumber: adminData.idNumber,
                fullName: adminData.fullName,
                email: adminData.email,
                organization: adminData.organization,
                role: "admin"
            });

            alert('Admin account created successfully!');

            // Refresh the list of admins
            const updatedAdminsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const updatedAdmins = updatedAdminsSnapshot.docs
                .filter(doc => doc.data().role === 'admin')
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(updatedAdmins);
        } catch (error) {
            console.error('Error creating admin:', error);
            alert(`Failed to create admin account: ${error.message}`);
        }
    };

    return (
        <div className="admin-management">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate('/superadmin')}>
                &lt; Back
            </button>

            <h2>Create Admin</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="idNumber" placeholder="ID Number" onChange={handleChange} required />
                <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                
                <select name="organization" onChange={handleChange} required>
                    <option value="">Select Organization</option>
                    {organizationsList.map((org, index) => (
                        <option key={index} value={org}>
                            {org}
                        </option>
                    ))}
                </select>
                
                <button type="submit">Create Admin</button>
            </form>

            <h2>Existing Admins</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID Number</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Organization</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map(admin => (
                        <tr key={admin.id}>
                            <td>{admin.idNumber}</td>
                            <td>{admin.fullName}</td>
                            <td>{admin.email}</td>
                            <td>{admin.organization}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminManagement;
