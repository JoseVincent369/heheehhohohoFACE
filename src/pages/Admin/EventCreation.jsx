import React, { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../firebaseutil/firebase_main';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
//import nodemailer from 'nodemailer'; // Assuming you're using nodemailer for sending emails
import './localstyles.css';

const CreateEvent = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [yearLevels] = useState(["Year 1", "Year 2", "Year 3", "Year 4"]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
    const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const coursesSnapshot = await getDocs(query(collection(FIREBASE_DB, 'users'), where('courses', '!=', null)));
        const majorsSnapshot = await getDocs(query(collection(FIREBASE_DB, 'users'), where('majors', '!=', null)));

        const courseOptions = coursesSnapshot.docs.map(doc => doc.data().courses).flat();
        const majorOptions = majorsSnapshot.docs.map(doc => doc.data().majors).flat();

        setCourses([...new Set(courseOptions)]);
        setMajors([...new Set(majorOptions)]);
      } catch (error) {
        console.error('Error fetching options:', error);
        setError('Failed to load options.');
      }
    };

    fetchOptions();
  }, []);

  const handleCheckboxChange = (setter) => (e) => {
    const { value, checked } = e.target;
    setter(prev =>
      checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };

  const handleYearCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (value === "selectAllYears") {
      setSelectedYearLevels(checked ? yearLevels : []);
    } else {
      setSelectedYearLevels(prev =>
        checked ? [...prev, value] : prev.filter(level => level !== value)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const user = FIREBASE_AUTH.currentUser;

    if (!user) {
      setError('User not authenticated.');
      return;
    }

    try {
      const eventRef = collection(FIREBASE_DB, 'events');
      await addDoc(eventRef, {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        venue,
        organizations,
        courses: selectedCourses,
        majors: selectedMajors,
        yearLevels: selectedYearLevels,
        createdBy: user.uid,
      });

      await sendEmails(); // Function to send emails

      setSuccess('Event created successfully!');
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setVenue('');
      setOrganizations([]);
      setSelectedCourses([]);
      setSelectedMajors([]);
      setSelectedYearLevels([]);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event.');
    }
  };

  const sendEmails = async () => {
    // Function to send emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    });

    const usersSnapshot = await getDocs(query(collection(FIREBASE_DB, 'users'), where('courses', 'in', selectedCourses)));
    const users = usersSnapshot.docs.map(doc => doc.data());

    const emails = users.map(user => user.email);

    await Promise.all(emails.map(email =>
      transporter.sendMail({
        from: 'your-email@gmail.com',
        to: email,
        subject: 'New Event Created',
        text: `A new event "${name}" has been created.`,
      })
    ));
  };

  return (
        <div className="create-event-container">
          {/* Back Button */}
          <button className="back-button" onClick={() => navigate('/localadmin')}>
            &lt; Back
          </button>
      <h2>Create Event</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEventName">
          <Form.Label>Event Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        
        <Form.Group controlId="formEventDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>
        
        <Form.Group controlId="formStartDate">
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formEndDate">
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formVenue">
          <Form.Label>Venue</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formCourses">
          <Form.Label>Courses</Form.Label>
          {courses.map(course => (
            <Form.Check
              key={course}
              type="checkbox"
              label={course}
              value={course}
              checked={selectedCourses.includes(course)}
              onChange={handleCheckboxChange(setSelectedCourses)}
            />
          ))}
        </Form.Group>

        <Form.Group controlId="formMajors">
          <Form.Label>Majors</Form.Label>
          {majors.map(major => (
            <Form.Check
              key={major}
              type="checkbox"
              label={major}
              value={major}
              checked={selectedMajors.includes(major)}
              onChange={handleCheckboxChange(setSelectedMajors)}
            />
          ))}
        </Form.Group>

        <Form.Group controlId="formYearLevels">
          <Form.Label>Year Levels</Form.Label>
          <Form.Check
            type="checkbox"
            id="selectAllYears"
            value="selectAllYears"
            label="Select All"
            checked={selectedYearLevels.length === yearLevels.length}
            onChange={handleYearCheckboxChange}
          />
          {yearLevels.map((yearLevel, index) => (
            <Form.Check
              key={index}
              type="checkbox"
              id={`year-${index}`}
              value={yearLevel}
              label={yearLevel}
              checked={selectedYearLevels.includes(yearLevel)}
              onChange={handleYearCheckboxChange}
            />
          ))}
        </Form.Group>

        <Button variant="primary" type="submit">
          Create Event
        </Button>
      </Form>
    </div>
  );
};

export default CreateEvent;
