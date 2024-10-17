import React, { useEffect, useState } from 'react';
import { Modal as AntdModal, Table, Spin } from 'antd';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main'; 
import { collection, getDocs, query, where } from "firebase/firestore";
import './component.css';
import LoadingScreen from './LoadingScreen';

const Modal = ({ isOpen, onClose, event, onChangeStatus, isLoading }) => {
    const [moderators, setModerators] = useState([]);
    const [loadingModerators, setLoadingModerators] = useState(true);

    useEffect(() => {
        const fetchModerators = async () => {
            setLoadingModerators(true); // Start loading
            try {
                const moderatorsRef = collection(FIRESTORE_DB, 'users'); // Use collection function
                const q = query(moderatorsRef, where('role', '==', 'moderator')); // Create a query
                const snapshot = await getDocs(q); // Get documents with the query
                const moderatorsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setModerators(moderatorsData);
            } catch (error) {
                console.error("Error fetching moderators: ", error);
            } finally {
                setLoadingModerators(false); // End loading
            }
        };

        if (isOpen) {
            fetchModerators();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Define columns for the Ant Design Table
    const columns = [
        { title: 'Organization', dataIndex: 'organization', key: 'organization' },
        { title: 'Courses', dataIndex: 'courses', key: 'courses' },
        { title: 'Majors', dataIndex: 'majors', key: 'majors' },
        { title: 'Moderators', dataIndex: 'moderators', key: 'moderators' },
    ];

    // Prepare the data source for the Table
    const dataSource = [
        {
            key: '1',
            organization: event.organization || 'N/A',
            courses: event.courses?.length ? (
                <ul>
                    {event.courses.map(course => (
                        <li key={course}>{course}</li>
                    ))}
                </ul>
            ) : 'N/A',
            majors: event.majors?.length ? (
                <ul>
                    {event.majors.map(major => (
                        <li key={major}>{major}</li>
                    ))}
                </ul>
            ) : 'N/A',
            moderators: event.moderators?.length ? (
                <ul>
                    {event.moderators.map(moderatorId => {
                        const moderator = moderators.find(m => m.id === moderatorId);
                        return moderator ? (
                            <li key={moderatorId}>
                                {moderator.fullName} ({moderator.email})
                            </li>
                        ) : null; // Avoid displaying null if moderator is not found
                    })}
                </ul>
            ) : 'N/A',
        },
    ];
    

    return (
        <AntdModal
            title={event.name}
            open={isOpen} // Change this line
            onCancel={onClose}
            footer={null}
            width={800}
        >
            {isLoading || loadingModerators ? (
                <Spin size="large" />
            ) : (
                <>
                    {/* Table to display organizations, courses, majors, and moderators */}
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        pagination={false}
                        style={{ marginTop: '20px' }}
                    />

                    {/* Conditional rendering of Accept and Reject buttons */}
                    {event.status !== 'accepted' && event.status !== 'rejected' && (
                        <>
                            <button onClick={() => onChangeStatus('accepted')}>Accept</button>
                            <button onClick={() => onChangeStatus('rejected')}>Reject</button>
                        </>
                    )}

                    <button onClick={onClose}>Close</button>
                </>
            )}
        </AntdModal>
    );
};

export default Modal;
