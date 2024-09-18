import React from 'react';
import './component.css'; // Ensure you have styles for the modal

const EventModal = ({ selectedEvent, handleCloseModal, changeEventStatus, organizations, departments, courses, majors }) => {
    if (!selectedEvent) return null;

    const handleApprove = () => {
        changeEventStatus(selectedEvent.id, 'approved');
        handleCloseModal();
    };

    const handleReject = () => {
        changeEventStatus(selectedEvent.id, 'rejected');
        handleCloseModal();
    };

    return (
        <div className="event-modal-overlay" onClick={handleCloseModal}>
            <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="event-modal-close" onClick={handleCloseModal}>
                    &times;
                </span>
                <h2>{selectedEvent.name}</h2>
                <div className="event-modal-details">
                    <p><strong>Description:</strong> {selectedEvent.description || 'N/A'}</p>
                    <p><strong>Start Date:</strong> {selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleString() : 'N/A'}</p>
                    <p><strong>End Date:</strong> {selectedEvent.endDate ? new Date(selectedEvent.endDate).toLocaleString() : 'N/A'}</p>
                    <p><strong>Venue:</strong> {selectedEvent.venue || 'N/A'}</p>

                    {/* Display Organizations */}
                    <div className="event-modal-organizations">
                        <strong>Organizations:</strong>
                        <ul>
                            {selectedEvent.organizations && selectedEvent.organizations.length > 0 ? (
                                selectedEvent.organizations.map((orgId) => {
                                    const org = organizations.find(o => o.id === orgId);
                                    return <li key={orgId}>{org?.name || 'Unknown Organization'}</li>;
                                })
                            ) : (
                                <li>No Organizations</li>
                            )}
                        </ul>
                    </div>

                    {/* Display Selected Departments */}
                    <div className="event-modal-departments">
                        <strong>Selected Departments:</strong>
                        <p>
                            {selectedEvent.selectedDepartments?.map(departmentId =>
                                departments.find(dept => dept.id === departmentId)?.name || 'N/A'
                            ).join(', ') || 'N/A'}
                        </p>
                    </div>

                    {/* Display Courses */}
                    <div className="event-modal-courses">
                        <strong>Courses:</strong>
                        <ul>
                            {courses.map((course) => (
                                <li key={course.id}>{course.name}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Display Majors */}
                    <div className="event-modal-majors">
                        <strong>Majors:</strong>
                        <ul>
                            {majors.map((major) => (
                                <li key={major.id}>{major.name}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="event-modal-actions">
                    <button className="approve-btn" onClick={handleApprove}>Approve</button>
                    <button className="reject-btn" onClick={handleReject}>Reject</button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
