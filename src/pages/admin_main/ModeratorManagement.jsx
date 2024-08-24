import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const ModeratorManagement = () => {
    const [moderatorData, setModeratorData] = useState({
        idNumber: "",
        email: "",
        password: "",
        fullName: "",
        organization: ""
    });

    const [organizationsList, setOrganizationsList] = useState([]);

    useEffect(() => {
        // Fetch organizations from Firestore
        const fetchOrganizations = async () => {
            const orgsSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
            const orgs = orgsSnapshot.docs.map(doc => doc.data().name); // Retrieve the 'name' field from each document
            setOrganizationsList(orgs);
        };

        fetchOrganizations();
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
        </div>
    );
};

export default ModeratorManagement;
