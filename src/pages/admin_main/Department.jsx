import React, { useState, useEffect } from 'react';
import { FIRESTORE_DB } from '../../firebaseutil/firebase_main';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import {
  Button,
  Select,
  Input,
  Steps,
  Spin,
  notification,
  Table,
  Popconfirm,
} from 'antd';
import './generalstyles.css';


const { Option } = Select;
const { Step } = Steps;

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
        notification.error({
          message: 'Error',
          description: 'Failed to fetch departments.',
        });
      }
      setLoading(false);
    };

    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    if (!departmentName) {
      notification.warning({
        message: 'Warning',
        description: 'Department name must be provided if you wish to add a department.',
      });
      return;
    }
    try {
      setLoading(true);
      const departmentRef = await addDoc(collection(FIRESTORE_DB, 'departments'), {
        name: departmentName,
      });
      setDepartments([...departments, { id: departmentRef.id, name: departmentName }]);
      setDepartmentName('');
      notification.success({
        message: 'Success',
        description: 'Department added successfully!',
      });
      setTimeout(() => goToNextStep(), 500); // Automatically go to next step after a short delay
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to add department.',
      });
    }
    setLoading(false);
  };

  const addCourse = async () => {
    if (!selectedDepartment) {
      notification.warning({
        message: 'Warning',
        description: 'Please select a department.',
      });
      return;
    }
    if (!courseName) {
      notification.warning({
        message: 'Warning',
        description: 'Course name must be provided if you wish to add a course.',
      });
      return;
    }
    try {
      setLoading(true);
      const courseRef = doc(collection(FIRESTORE_DB, `departments/${selectedDepartment.id}/courses`));
      await setDoc(courseRef, { name: courseName });
      setCourses([...courses, { id: courseRef.id, name: courseName }]);
      setCourseName('');
      notification.success({
        message: 'Success',
        description: 'Course added successfully!',
      });
      setTimeout(() => goToNextStep(), 500); // Automatically go to next step after a short delay
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to add course.',
      });
    }
    setLoading(false);
  };

  const addMajor = async () => {
    if (!selectedCourse) {
      notification.warning({
        message: 'Warning',
        description: 'Please select a course.',
      });
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
        setMajors([...majors, { id: majorRef.id, name: majorName }]);
        setMajorName('');
        notification.success({
          message: 'Success',
          description: 'Major added successfully!',
        });
      } else {
        notification.info({
          message: 'Info',
          description: 'Course added successfully without a major.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to add major.',
      });
    }
    setLoading(false);
  };

  const deleteCourse = async (courseId) => {
    try {
      const courseRef = doc(FIRESTORE_DB, "courses", courseId); // Adjust the path if necessary
      await deleteDoc(courseRef);
      setCourses(courses.filter(course => course.id !== courseId)); // Update state to remove the deleted course
    } catch (error) {
      console.error("Error deleting course: ", error);
    }
  };

  const deleteMajor = async (majorId) => {
    try {
      const majorRef = doc(FIRESTORE_DB, "majors", majorId); // Adjust the path if necessary
      await deleteDoc(majorRef);
      setMajors(majors.filter(major => major.id !== majorId)); // Update state to remove the deleted major
    } catch (error) {
      console.error("Error deleting major: ", error);
    }
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

  const editDepartment = async (id, newName) => {
    try {
      setLoading(true);
      const departmentRef = doc(FIRESTORE_DB, 'departments', id);
      await updateDoc(departmentRef, { name: newName });
      setDepartments(departments.map((dept) => (dept.id === id ? { ...dept, name: newName } : dept)));
      notification.success({ message: 'Success', description: 'Department updated successfully!' });
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to update department.' });
    }
    setLoading(false);
  };

  const deleteDepartment = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(doc(FIRESTORE_DB, 'departments', id));
      setDepartments(departments.filter((dept) => dept.id !== id));
      notification.success({ message: 'Success', description: 'Department deleted successfully!' });
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to delete department.' });
    }
    setLoading(false);
  };

  // Table columns for departments
  const departmentColumns = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      render: (text, record) => (
        <Input
          defaultValue={text}
          onBlur={(e) => editDepartment(record.id, e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this department?"
          onConfirm={() => deleteDepartment(record.id)}
        >
          <Button type="link" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h2>Manage Departments, Courses, and Majors</h2>

      {/* Step Indicator */}
      <Steps current={activeStep} >
        {steps.map((step) => (
          <Step key={step} title={step} />
        ))}
      </Steps>

      {/* Step Navigation */}
      <div style={{ margin: '20px 0' }}>
        <Button onClick={goToPreviousStep} disabled={activeStep === 0} style={{ marginRight: '10px' }}>
          Back
        </Button>
        <Button type="primary" onClick={goToNextStep} disabled={activeStep === steps.length - 1}>
          Next
        </Button>
      </div>

      {/* Loading indicator */}
      {loading && <Spin />}

      {/* Step Content */}
      <div className="step-content">
        {activeStep === 0 && (
          <div>
            <h3>Add Department</h3>
            <Input
              placeholder="Enter Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
            <Button type="primary" onClick={addDepartment} style={{ marginTop: '10px' }}>
              Add Department
            </Button>

            <h3 style={{ marginTop: '20px' }}>Existing Departments</h3>
            <Table
              dataSource={departments}
              columns={departmentColumns}
              rowKey="id"
              pagination={{ pageSize: 3 }}
            />
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <h3>Add Course to Department</h3>
            <Select
              placeholder="Select Department First"
              value={selectedDepartment?.id}
              onChange={(value) => handleDepartmentSelect(departments.find((dept) => dept.id === value))}
              style={{ width: '400px', marginBottom: '10px' }}
              className="select-department"

            >
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Enter Course Name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
            <Button type="primary" onClick={addCourse} style={{ marginTop: '10px' }}>
              Add Course
            </Button>
            <h3 style={{ marginTop: '20px' }}>Existing Courses</h3>
            <Table
              dataSource={courses}
              columns={[
                {
                  title: 'Course Name',
                  dataIndex: 'name',
                  render: (text, record) => (
                    <Input
                      defaultValue={text}
                      onBlur={(e) => editCourse(record.id, e.target.value)}
                    />
                  ),
                },
                {
                  title: 'Actions',
                  render: (_, record) => (
                    <Popconfirm
                      title="Are you sure to delete this course?"
                      onConfirm={() => deleteCourse(record.id)}
                    >
                      <Button type="link" danger>
                        Delete
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h3>Add Major to Course</h3>
            <Select
              placeholder="Select Course First"
              value={selectedCourse?.id}
              onChange={(value) => setSelectedCourse(courses.find((course) => course.id === value))}
              style={{ width: '400px', marginBottom: '10px' }}
              className="select-department"
            >
              {courses.map((course) => (
                <Option key={course.id} value={course.id}>
                  {course.name}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Enter Major Name"
              value={majorName}
              onChange={(e) => setMajorName(e.target.value)}
            />
            <Button type="primary" onClick={addMajor} style={{ marginTop: '10px' }}>
              Add Major
            </Button>
            <h3 style={{ marginTop: '20px' }}>Existing Majors</h3>
            <Table
              dataSource={majors}
              columns={[
                {
                  title: 'Major Name',
                  dataIndex: 'name',
                  render: (text, record) => (
                    <Input
                      defaultValue={text}
                      onBlur={(e) => editMajor(record.id, e.target.value)}
                    />
                  ),
                },
                {
                  title: 'Actions',
                  render: (_, record) => (
                    <Popconfirm
                      title="Are you sure to delete this major?"
                      onConfirm={() => deleteMajor(record.id)}
                    >
                      <Button type="link" danger>
                        Delete
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentCourseMajorManager;
