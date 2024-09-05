// src/components/EventModal.jsx

import React from 'react';
import './component.css'; // Ensure styling is included

const EventModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{event.name}</h2>
        <p><strong>Description:</strong> {event.description || 'Description Unavailable'}</p>
        <p><strong>Start Date:</strong> {new Date(event.startDate?.toDate()).toLocaleDateString() || 'Date Unavailable'}</p>
        <p><strong>End Date:</strong> {new Date(event.endDate?.toDate()).toLocaleDateString() || 'Date Unavailable'}</p>
        <p><strong>Venue:</strong> {event.venue || 'Venue Unavailable'}</p>
        <p><strong>Organizations:</strong> {event.organizations?.length ? event.organizations.join(', ') : 'No Organizations'}</p>
        <p><strong>Year Levels:</strong> {event.year?.length ? event.year.join(', ') : 'No Year Levels'}</p>
        <div>
          <strong>Selected Departments:</strong>
          <ul>
            {Object.keys(event.selectedDepartments || {}).map(department => (
              <li key={department}>
                <strong>{department}</strong>
                <ul>
                  {Object.keys(event.selectedDepartments[department] || {}).map(course => (
                    <li key={course}>
                      <strong>{course}</strong>
                      <ul>
                        {Array.isArray(event.selectedDepartments[department][course])
                          ? event.selectedDepartments[department][course].map(major => (
                              <li key={major}>{major}</li>
                            ))
                          : 'No Majors'}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
