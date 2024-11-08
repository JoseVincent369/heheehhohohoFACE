import React, { useState, useEffect, useRef  } from 'react';
import { Container, Row, Col, Button, Form, Alert, Image } from 'react-bootstrap';
import Webcam from 'react-webcam'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import './generalstyles.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    mname: "",
    nameExtension: "", // Added name extension
    yearLevel: "",
    email: "",
    age: "",
    course: "",
    major: "",
    schoolID: "",
    password: "",
    organization: [], 
    department: "", 
    isIP: false,
  });

  const [photos, setPhotos] = useState({
    front: null,
    left: null,
    right: null,
  });

    // Separate refs for each webcam
    const frontWebcamRef = useRef(null);
    const leftWebcamRef = useRef(null);
    const rightWebcamRef = useRef(null);

    const [isFrontWebcamActive, setFrontWebcamActive] = useState(true);
    const [isLeftWebcamActive, setLeftWebcamActive] = useState(true);
    const [isRightWebcamActive, setRightWebcamActive] = useState(true);


  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const yearLevels = [
    { id: "1st", name: "1st Year" },
    { id: "2nd", name: "2nd Year" },
    { id: "3rd", name: "3rd Year" },
    { id: "4th", name: "4th Year" }
  ];
  


  const navigate = useNavigate();

  const fetchOrganizations = async () => {
    const orgSnapshot = await getDocs(collection(FIRESTORE_DB, 'organizations'));
    const orgs = orgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrganizations(orgs.sort((a, b) => a.name.localeCompare(b.name))); // Sort by name
  };

  const fetchDepartments = async () => {
    const deptSnapshot = await getDocs(collection(FIRESTORE_DB, 'departments'));
    const deps = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDepartments(deps.sort((a, b) => a.name.localeCompare(b.name))); // Sort by name
  };

  const fetchCourses = async (departmentId) => {
    const courseSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses`));
    const coursesData = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(coursesData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const fetchMajors = async (departmentId, courseId) => {
    const majorSnapshot = await getDocs(collection(FIRESTORE_DB, `departments/${departmentId}/courses/${courseId}/majors`));
    const majorsData = majorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMajors(majorsData.sort((a, b) => a.name.localeCompare(b.name)));
  };



  useEffect(() => {
    fetchOrganizations();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;


    if (name === "organization") {
      // Handle multiple organizations
      const selectedOrgs = [...formData.organization];
      if (e.target.checked) {
        selectedOrgs.push(value);
      } else {
        const index = selectedOrgs.indexOf(value);
        if (index > -1) selectedOrgs.splice(index, 1);
      }
      setFormData({
        ...formData,
        organization: selectedOrgs,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (name === 'department') {
        fetchCourses(value);
      }
      

      if (name === 'course') {
        fetchMajors(formData.department, value);
      }
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    
    
    }
  };

  const capturePhoto = (photoType) => {
    let imageSrc = null;
    if (photoType === 'front') {
      imageSrc = frontWebcamRef.current.getScreenshot();
      setFrontWebcamActive(false); // Hide only the front webcam
    } else if (photoType === 'left') {
      imageSrc = leftWebcamRef.current.getScreenshot();
      setLeftWebcamActive(false); // Hide only the left webcam
    } else if (photoType === 'right') {
      imageSrc = rightWebcamRef.current.getScreenshot();
      setRightWebcamActive(false); // Hide only the right webcam
    }
  
    if (imageSrc) {
      setPhotos((prev) => ({
        ...prev,
        [photoType]: imageSrc, // Store base64 image directly
      }));
    }
  };

  const retakePhoto = (photoType) => {
    setPhotos((prev) => ({
      ...prev,
      [photoType]: null,
    }));
  
    // Reactivate the relevant webcam
    if (photoType === 'front') {
      setFrontWebcamActive(true);
    } else if (photoType === 'left') {
      setLeftWebcamActive(true);
    } else if (photoType === 'right') {
      setRightWebcamActive(true);
    }
    
  };
  
  
  

  const handlePhotoChange = (e) => {
    setPhotos({
      ...photos,
      [e.target.name]: e.target.files[0],
    });
  };

  const uploadPhotos = async (userId) => {
    const photoURLs = {};
    
    for (const [key, photo] of Object.entries(photos)) {
      if (photo) {
        const photoRef = ref(STORAGE, `users/${userId}/${key}`);
        let blob;
  
        // Check if the photo is a base64 image (from webcam) or a file (from input)
        if (typeof photo === 'string') {
          // If it's a base64 image, convert it to a Blob
          const response = await fetch(photo);
          blob = await response.blob();
        } else if (photo instanceof File) {
          // If it's a File object (from input)
          blob = photo;
        } else {
          console.error(`Unexpected photo type: ${typeof photo}`);
          continue; // Skip this photo if it's not a recognized type
        }
  
        // Proceed to upload the blob
        await uploadBytes(photoRef, blob); // Upload the blob
        const downloadURL = await getDownloadURL(photoRef); // Get download URL
        photoURLs[key] = downloadURL; // Save the URL in the object
      }
    }
    
    return photoURLs;
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
  
    try {
      // Fetch names for course, major, yearLevel, and organization
      const courseDoc = await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}/courses/${formData.course}`));
      const courseName = courseDoc.exists() ? courseDoc.data().name : "";
  
      const majorDoc = formData.major
        ? await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}/courses/${formData.course}/majors/${formData.major}`))
        : null;
      const majorName = majorDoc?.exists() ? majorDoc.data().name : "";
  
      const orgPromises = formData.organization.map(async (orgId) => {
        const orgDoc = await getDoc(doc(FIRESTORE_DB, `organizations/${orgId}`));
        return orgDoc.exists() ? orgDoc.data().name : "";
      });
      const organizationNames = await Promise.all(orgPromises);
  
      // Fetch department name
      const departmentDoc = await getDoc(doc(FIRESTORE_DB, `departments/${formData.department}`));
      const departmentName = departmentDoc.exists() ? departmentDoc.data().name : "";
  
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );
  
      const userId = userCredential.user.uid;
      const photoURLs = await uploadPhotos(userId);
      
      // Save user data in Firestore
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        fname: formData.fname,
        lname: formData.lname,
        mname: formData.mname,
        nameExtension: formData.nameExtension,
        yearLevel: formData.yearLevel, 
        email: formData.email,
        age: formData.age,
        course: courseName,
        major: majorName,
        organization: organizationNames,
        department: departmentName,
        schoolID: formData.schoolID,
        role: "user",
        photos: photoURLs,
        isIP: formData.isIP,
      });
  
      setSuccess("User registered successfully!");
      
  
    } catch (error) {
      console.error("Sign-up failed:", error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError("The email address is already in use by another account.");
          break;
        case 'auth/invalid-email':
          setError("The email address is invalid.");
          break;
        case 'auth/operation-not-allowed':
          setError("Email/password accounts are not enabled.");
          break;
        case 'auth/weak-password':
          setError("The password is too weak. Please use a stronger password.");
          break;
        default:
          setError("Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
<Container fluid="md">
  <h2 className="my-4 text-center">Sign Up</h2>
  {error && <Alert variant="danger">{error}</Alert>}
  {success && <Alert variant="success">{success}</Alert>}
  {loading ? (
    <LoadingScreen />
  ) : (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formFname">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formMname">
            <Form.Label>Middle Name</Form.Label>
            <Form.Control
              type="text"
              name="mname"
              value={formData.mname}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formLname">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formNameExtension">
            <Form.Label>Name Extension (e.g., Jr., Sr.)</Form.Label>
            <Form.Control
              type="text"
              name="nameExtension"
              value={formData.nameExtension}
              onChange={handleChange}
            />



          </Form.Group>
        </Col>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formAge">
            <Form.Label>Age</Form.Label>
            <Form.Control
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              style={{ marginTop: '15px' }}
            />
          </Form.Group>
        </Col>


        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formYearLevel">
            <Form.Label>Year Level</Form.Label>
            <Form.Control
              as="select"
              name="yearLevel"
              value={formData.yearLevel}
              onChange={handleChange}
              required
              style={{ marginTop: '15px' }}
            >
              <option value="">Select Year Level</option>
              {yearLevels.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="formSchoolID" className="mb-3">
        <Form.Label>School ID</Form.Label>
        <Form.Control
          type="text"
          name="schoolID"
          value={formData.schoolID}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group controlId="formEmail" className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </Form.Group>
      
      <Form.Group controlId="formPassword" className="mb-3">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </Form.Group>
      
      <Row>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formDepartment">
            <Form.Label>Department</Form.Label>
            <Form.Control
              as="select"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>




        
        
        
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formCourse">
            <Form.Label>Course</Form.Label>
            <Form.Control
              as="select"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="formMajor">
            <Form.Label>Major</Form.Label>
            <Form.Control
              as="select"
              name="major"
              value={formData.major}
              onChange={handleChange}
            >
              <option value="">Select Major</option>
              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>




<Form.Group controlId="formOrganization" className="mb-3">
  <Form.Label>Organizations</Form.Label>
  <div className="organization-checkboxes">
    {organizations.map((organization) => (
      <div key={organization.id} className="checkbox-container">
        <Form.Check
          type="checkbox"
          id={`organization-${organization.id}`}
          name="organization"
          value={organization.id}
          label={organization.name}
          checked={formData.organization.includes(organization.id)}
          onChange={handleChange}
          className="custom-checkbox"
          style={{ display: 'flex', marginRight: '10px',  alignItems: 'center', justifyContent: 'center',  gap: '8px' }}
        />
      </div>
    ))}
  </div>
</Form.Group>




      <h3>Capture Front Photo</h3>
      {isFrontWebcamActive ? (
        <>
          <Webcam
            audio={false}
            ref={frontWebcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => capturePhoto("front")}>Capture</Button>
          </div>
        </>
      ) : (
        <>
          <Image
            src={photos.front}
            alt="Front view"
            fluid
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => retakePhoto("front")}>Retake</Button>
          </div>
        </>
      )}

<Form.Group controlId="formFrontPhoto" className="mb-3">
  <Form.Label style={{ marginTop: '20px' }}>Or Upload Front Photo</Form.Label>
  <div className="d-flex justify-content-center">
    <Form.Control
      type="file"
      name="front"
      accept="image/*"
      onChange={handlePhotoChange}
      style={{ alignItems: 'center' }} // Adjust the width to your preference
    />
  </div>
</Form.Group>

      <h3>Capture Left Photo</h3>
      {isLeftWebcamActive ? (
        <>
          <Webcam
            audio={false}
            ref={leftWebcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => capturePhoto("left")}>Capture</Button>
          </div>
        </>
      ) : (
        <>
          <Image
            src={photos.left}
            alt="Front view"
            fluid
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => retakePhoto("left")}>Retake</Button>
          </div>
        </>
      )}

<Form.Group controlId="formLeftPhoto" className="mb-3">
  <Form.Label style={{ marginTop: '20px' }}>Or Upload Left Photo</Form.Label>
  <div className="d-flex justify-content-center">
    <Form.Control
      type="file"
      name="left"
      accept="image/*"
      onChange={handlePhotoChange}
      style={{ alignItems: 'center' }}
    />
  </div>
</Form.Group>

      <h3>Capture Right Photo</h3>
      {isRightWebcamActive ? (
        <>
          <Webcam
            audio={false}
            ref={rightWebcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => capturePhoto("right")}>Capture</Button>
          </div>
        </>
      ) : (
        <>
          <Image
            src={photos.right}
            alt="Front view"
            fluid
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="text-center mt-2">
            <Button onClick={() => retakePhoto("right")}>Retake</Button>
          </div>
        </>
      )}

<Form.Group controlId="formRightPhoto" className="mb-3">
  <Form.Label style={{ marginTop: '20px' }}>Or Upload Right Photo</Form.Label>
  <div className="d-flex justify-content-center">
    <Form.Control
      type="file"
      name="right"
      accept="image/*"
      onChange={handlePhotoChange}
      style={{ alignItems: 'center' }}
    />
  </div>
</Form.Group>

<Form.Group
  controlId="formIsIP"
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30px',
  }}
>
  <Form.Check
    type="checkbox"
    name="isIP"
    label="Are you an Indigenous Person (IP)?"
    checked={formData.isIP}
    onChange={handleChange}
  />
</Form.Group>


      <Form.Group controlId="formSubmit" className="mb-3">
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form.Group>
    </Form>
  
  )}
</Container>

  );
};

export default SignUp;