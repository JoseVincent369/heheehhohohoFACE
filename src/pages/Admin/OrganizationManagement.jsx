import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, onSnapshot, where } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebaseutil/firebase_main';
import './localstyles.css';

const OrganizationManagement = () => {
    const [organizations, setOrganizations] = useState([]);
    const [newOrganization, setNewOrganization] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth(FIREBASE_APP);
    const db = getFirestore(FIREBASE_APP);

    useEffect(() => {
        // Fetch User Details
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false); // Set loading to false after user is fetched
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (!user) return; // Exit if no user is logged in

        // Fetch Organizations Created by Admin
        const q = query(collection(db, 'organizations'), where('createdBy', '==', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const organizationsData = [];
            querySnapshot.forEach((doc) => {
                organizationsData.push({ id: doc.id, ...doc.data() });
            });
            setOrganizations(organizationsData);
        });

        return () => unsubscribe();
    }, [db, user]);

    const handleOrganizationChange = (e) => {
        setNewOrganization(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newOrganization.trim()) {
            alert('Organization name cannot be empty');
            return;
        }

        if (!user) {
            alert('User not authenticated. Please log in again.');
            return;
        }

        try {
            await addDoc(collection(db, 'organizations'), {
                name: newOrganization,
                createdBy: user.uid,
            });
            alert('Organization added successfully!');
            setNewOrganization(''); // Reset the input field
        } catch (error) {
            console.error('Error adding organization:', error);
            alert('Failed to add organization. Please try again.');
        }
    };

    const handleLogout = () => {
        signOut(auth).catch((error) => {
            console.error('Error logging out: ', error);
        });
    };

    // Display a loading message while user data is being fetched
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="organization-management">

            <div className="main-content">
                <div className="create-organization-form">
                    <h4>Create New Organization</h4>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="organizationName"
                            placeholder="Organization Name"
                            value={newOrganization}
                            onChange={handleOrganizationChange}
                            required
                        />
                        <button type="submit">Create Organization</button>
                    </form>
                </div>

                <div className="organization-list">
                    <h4>Your Organizations</h4>
                    <ul>
                        {organizations.length > 0 ? (
                            organizations.map((org) => (
                                <li key={org.id}>{org.name}</li>
                            ))
                        ) : (
                            <li>No organizations created yet.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default OrganizationManagement;
