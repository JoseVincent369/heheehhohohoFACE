import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import Modal from '../components/Modal'; // Import the modal component
import './generalstyles.css';

const DepartmentCourseMajorManager = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [majorName, setMajorName] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const steps = ['Department', 'Course', 'Major'];

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const departmentSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
        const departmentList = departmentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDepartments(departmentList);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setMessage('Failed to fetch departments.');
        setShowModal(true);
      }
      setLoading(false);
    };

    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    if (!departmentName) {
      setMessage('Department name is not required but must be provided if you wish to add a department.');
      setShowModal(true);
      return;
    }
    try {
      setLoading(true);
      const departmentRef = await addDoc(collection(FIRESTORE_DB, 'departments'), {
        name: departmentName,
      });
      setDepartments([...departments, { id: departmentRef.id, name: departmentName }]);
      setDepartmentName('');
      setMessage('Department added successfully!');
      setShowModal(true);
      setTimeout(() => goToNextStep(), 500); // Automatically go to next step after a short delay
    } catch (error) {
      console.error('Error adding department:', error);
      setMessage('Failed to add department.');
      setShowModal(true);
    }
    setLoading(false);
  };

  const addCourse = async () => {
    if (!selectedDepartment) {
      setMessage('Please select a department.');
      setShowModal(true);
      return;
    }
    if (!courseName) {
      setMessage('Course name is not required but must be provided if you wish to add a course.');
      setShowModal(true);
      return;
    }
    try {
      setLoading(true);
      const courseRef = doc(collection(FIRESTORE_DB, `departments/${selectedDepartment.id}/courses`));
      await setDoc(courseRef, { name: courseName });
      setCourses([...courses, { id: courseRef.id, name: courseName }]);
      setCourseName('');
      setSelectedCourse({ id: courseRef.id, name: courseName });
      setMessage('Course added successfully!');
      setShowModal(true);
      setTimeout(() => goToNextStep(), 500); // Automatically go to next step after a short delay
    } catch (error) {
      console.error('Error adding course:', error);
      setMessage('Failed to add course.');
      setShowModal(true);
    }
    setLoading(false);
  };

  const addMajor = async () => {
    if (!selectedCourse) {
      setMessage('Please select a course.');
      setShowModal(true);
      return;
    }
    if (!majorName && !window.confirm('No major name provided. Do you want to skip adding a major for this course?')) {
      return;
    }
    try {
      setLoading(true);
      const majorRef = doc(collection(FIRESTORE_DB, `departments/${selectedDepartment.id}/courses/${selectedCourse.id}/majors`));
      if (majorName) {
        await setDoc(majorRef, { name: majorName });
        setMajorName('');
        setMessage('Major added successfully! You can continue adding majors to the selected course.');
      } else {
        setMessage('Course added successfully without a major.');
      }
      setShowModal(true);
    } catch (error) {
      console.error('Error adding major:', error);
      setMessage('Failed to add major.');
      setShowModal(true);
    }
    setLoading(false);
  };

  const handleDepartmentSelect = async (department) => {
    setSelectedDepartment(department);
    setSelectedCourse(null);

    const coursesSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${department.id}/courses`));
    const courseList = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCourses(courseList);
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="container">
      <h2>Manage Departments, Courses, and Majors</h2>

      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div key={index} className={`step ${activeStep === index ? 'active' : ''}`}>
            {step}
          </div>
        ))}
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        <button onClick={goToPreviousStep} disabled={activeStep === 0}>
          &larr; Back
        </button>
        <button onClick={goToNextStep} disabled={activeStep === steps.length - 1}>
          Next &rarr;
        </button>
      </div>

      {/* Loading indicator */}
      {loading && <div>Loading...</div>}

      {/* Step Content */}
      <div className="step-content">
        {activeStep === 0 && (
          <div>
            <h3>Add Department</h3>
            <input
              type="text"
              placeholder="Enter Department Name (Optional)"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
            <button onClick={addDepartment}>Add Department</button>
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <h3>Add Course to Department</h3>
            <select
              value={selectedDepartment?.id || ''}
              onChange={(e) =>
                handleDepartmentSelect(departments.find((dept) => dept.id === e.target.value))
              }
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter Course Name (Optional)"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
            <button onClick={addCourse}>Add Course</button>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h3>Add Major to Course (Optional)</h3>
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) =>
                setSelectedCourse(courses.find((course) => course.id === e.target.value))
              }
              disabled={!selectedDepartment}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter Major Name (Optional)"
              value={majorName}
              onChange={(e) => setMajorName(e.target.value)}
            />
            <button onClick={addMajor}>Add Major</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal message={message} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default DepartmentCourseMajorManager;
