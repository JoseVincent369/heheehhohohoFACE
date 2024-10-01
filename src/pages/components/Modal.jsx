import React from 'react';
import './component.css'; // Create a CSS file for modal styles
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component

const Modal = ({ isOpen, onClose, event, onChangeStatus, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {isLoading ? (
                    <LoadingScreen /> 
                ) : (
                    <>
                        <h2>{event.name}</h2>
                        <p>Description: {event.description || 'N/A'}</p>
                        <p>Start Date: {new Date(event.startDate?.seconds * 1000).toLocaleString() || 'N/A'}</p>
                        <p>End Date: {new Date(event.endDate?.seconds * 1000).toLocaleString() || 'N/A'}</p>
                        <p>Venue: {event.venue || 'N/A'}</p>
                        <p>Status: {event.status || 'N/A'}</p>

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
            </div>
        </div>
    );
};

export default Modal;
