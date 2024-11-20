import React, { useEffect, useState } from 'react';
import { Modal as AntdModal, Table, Spin } from 'antd';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, getDocs, query, where } from "firebase/firestore";
import './component.css';
import LoadingScreen from './LoadingScreen';

const Modal = ({ isOpen, onClose, event, onChangeStatus, isLoading }) => {
    const [moderators, setModerators] = useState([]);
    const [usersInCharge, setUsersInCharge] = useState([]);
    const [loadingModerators, setLoadingModerators] = useState(true);
    const [loadingUsersInCharge, setLoadingUsersInCharge] = useState(true);

    useEffect(() => {
        const fetchModerators = async () => {
            setLoadingModerators(true);
            try {
                const moderatorsRef = collection(FIRESTORE_DB, 'users');
                const q = query(moderatorsRef, where('role', '==', 'moderator'));
                const snapshot = await getDocs(q);
                const moderatorsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setModerators(moderatorsData);
            } catch (error) {
                console.error("Error fetching moderators: ", error);
            } finally {
                setLoadingModerators(false);
            }
        };

        const fetchUsersInCharge = async () => {
            setLoadingUsersInCharge(true);
            try {
                const usersRef = collection(FIRESTORE_DB, 'users');
                const snapshot = await getDocs(usersRef);
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUsersInCharge(usersData);
            } catch (error) {
                console.error("Error fetching users in charge: ", error);
            } finally {
                setLoadingUsersInCharge(false);
            }
        };

        if (isOpen) {
            fetchModerators();
            fetchUsersInCharge();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const itemList = (items) => {
        if (!items || items.length === 0) {
            return "N/A";
        }
        return items.map((item, index) => <li key={index}>{item}</li>);
    };

    return (
        <AntdModal
            title={event.name}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width="90%" // Make width responsive
            style={{ maxWidth: '900px', margin: '0 auto' }} // Max width with auto margin
            bodyStyle={{ overflowX: 'auto' }} // Ensure body scrolls on overflow
        >
            {isLoading || loadingModerators || loadingUsersInCharge ? (
                <Spin size="large" />
            ) : (
                <>
                    {/* Modal for Event Details */}
                    <div className="modal-content">
                        <h3>{event.name}</h3>
                        <strong>Description:</strong>{" "}
                        <textarea disabled className="form-control" value={event.description || "N/A"} />

                        <div className="row">
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <p>
                                    <strong>Start Date:</strong>{" "}
                                    {new Date(event.startDate?.seconds * 1000).toLocaleString() || "N/A"}
                                </p>
                            </div>
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <p>
                                    <strong>End Date:</strong>{" "}
                                    {new Date(event.endDate?.seconds * 1000).toLocaleString() || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <p>
                                    <strong>Venue:</strong> {event.venue || "N/A"}
                                </p>
                            </div>
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <p>
                                    <strong>Status:</strong>{" "}
                                    {event.status?.toUpperCase() || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <h5>Department</h5>
                                <ol className="list-group list-group-numbered">
                                    {itemList(event.courses)}
                                </ol>
                            </div>
                            <div className="col-sm-12 col-md-6 col-lg-6">
                                <h5>Organization</h5>
                                <ol className="list-group list-group-numbered">
                                    {itemList(event.organizations)}
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Table to display moderators, courses, majors, and user in charge */}
                    <Table
                        columns={[
                            { title: 'Organization', dataIndex: 'organization', key: 'organization' },
                            { title: 'Courses', dataIndex: 'courses', key: 'courses' },
                            { title: 'Majors', dataIndex: 'majors', key: 'majors' },
                            { title: 'Moderators', dataIndex: 'moderators', key: 'moderators' },
                            { title: 'User in Charge', dataIndex: 'userInCharge', key: 'userInCharge' }
                        ]}
                        dataSource={[
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
                                            ) : null;
                                        })}
                                    </ul>
                                ) : 'N/A',
                                userInCharge: event.userInCharge && event.userInCharge.length > 0 ? (
                                    <ul className="list-group">
                                        {event.userInCharge.map((userId) => {
                                            const user = usersInCharge.find((user) => user.id === userId);
                                            return (
                                                <li key={userId} className="list-group-item">
                                                    {user ? `${user.fname} ${user.lname} (${user.email})` : `Unknown User (ID: ${userId})`}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : 'N/A'
                            }
                        ]}
                        pagination={false}
                        style={{ marginTop: '20px', width: '100%' }}
                    />

                    {/* Conditional rendering of Accept and Reject buttons */}
                    {event.status !== 'done' && event.status !== 'accepted' && event.status !== 'rejected' && (
                        <>
                            <button className='accept-button' onClick={() => onChangeStatus('accepted')}>Accept</button>
                            <button className='reject-button' onClick={() => onChangeStatus('rejected')}>Reject</button>
                        </>
                    )}

                    <button onClick={onClose}>Close</button>
                </>
            )}
        </AntdModal>
    );
};

export default Modal;
