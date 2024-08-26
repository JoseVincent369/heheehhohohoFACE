import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import './generalstyles.css';

const ModeratorManagement = () => {
    const [moderatorData, setModeratorData] = useState({
        idNumber: "",
        email: "",
        password: "",
        fullName: "",
        organization: ""
    });

    const [organizationsList, setOrganizationsList] = useState([]);
    const [moderators, setModerators] = useState([]);

    useEffect(() => {
        // Fetch organizations from Firestore
        const fetchOrganizations = async () => {
            const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
            const orgs = orgsSnapshot.docs.map(doc => doc.data().name); // Retrieve the 'name' field from each document
            setOrganizationsList(orgs);
        };

        // Fetch moderators from Firestore
        const fetchModerators = async () => {
            const moderatorsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const mods = moderatorsSnapshot.docs
                .filter(doc => doc.data().role === 'moderator') // Filter only moderators
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setModerators(mods);
        };

        fetchOrganizations();
        fetchModerators();
    }, []);

    const handleChange = (e) => {
        setModeratorData({
            ...moderatorData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check if idNumber is unique
            const idNumberDoc = await getDoc(doc(FIRESTORE_DB, "users", moderatorData.idNumber));
            if (idNumberDoc.exists()) {
                alert('ID number already exists. Please use a unique ID number.');
                return;
            }
    
            const userCredential = await createUserWithEmailAndPassword(
                FIREBASE_AUTH,
                moderatorData.email,
                moderatorData.password
            );
    
            const userId = userCredential.user.uid;
            await setDoc(doc(FIRESTORE_DB, "users", moderatorData.idNumber), {
                idNumber: moderatorData.idNumber,
                fullName: moderatorData.fullName,
                email: moderatorData.email,
                organization: moderatorData.organization,
                role: "moderator"
            });
    
            alert('Moderator account created successfully!');
            // Refresh the list of moderators
            const updatedModsSnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
            const updatedMods = updatedModsSnapshot.docs
                .filter(doc => doc.data().role === 'moderator')
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setModerators(updatedMods);
        } catch (error) {
            console.error('Error creating moderator:', error);
            alert(`Failed to create moderator account: ${error.message}`);
        }
    };

    return (
        <div className="moderator-management">
            <h2>Create Moderator</h2>
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
                
                <button type="submit">Create Moderator</button>
            </form>

            <h2>Existing Moderators</h2>
            <table className="moderator-table">
                <thead>
                    <tr>
                        <th>ID Number</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Organization</th>
                    </tr>
                </thead>
                <tbody>
                    {moderators.map(moderator => (
                        <tr key={moderator.id}>
                            <td>{moderator.idNumber}</td>
                            <td>{moderator.fullName}</td>
                            <td>{moderator.email}</td>
                            <td>{moderator.organization}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ModeratorManagement;
