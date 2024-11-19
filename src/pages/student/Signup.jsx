import React, { useState, useEffect, useRef  } from 'react';
import { Container, Row, Col, Button, Form, Alert, Image, Modal  } from 'react-bootstrap';
import { Select } from 'antd'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB, STORAGE } from '../../firebaseutil/firebase_main';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import './generalstyles.css';
import Terms from './Terms';

const { Option } = Select;

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
    gender: "" ,
    preferredTitle: "Mr.",
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
  const [showPassword, setShowPassword] = useState(false);
  const yearLevels = [
    { id: "1st", name: "1st Year" },
    { id: "2nd", name: "2nd Year" },
    { id: "3rd", name: "3rd Year" },
    { id: "4th", name: "4th Year" }
  ];
  

  const [showTerms, setShowTerms] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleTermsClose = () => setShowTerms(false);
  const handleTermsShow = () => setShowTerms(true);

  const handleCheckboxChange = (e) => {
    setAgreeToTerms(e.target.checked);
  };

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


  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

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
  
  const handleOrganizationChange = (selectedOrgs) => {
    setFormData({
      ...formData,
      organization: selectedOrgs,
    });
  };

  const handleTitleChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      preferredTitle: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeToTerms) {
      alert('Please agree to the Terms and Conditions.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
  
    // Email domain validation
    const emailDomain = "@nbsc.edu.ph";
    if (!formData.email.endsWith(emailDomain)) {
      const errorMessage = `Please use an email address with the domain ${emailDomain}.`;
      setError(errorMessage);
      window.alert(errorMessage); // Display alert at the top of the screen
      setLoading(false);
      return;
    }
  
  
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
        gender: formData.gender
        
      });
  
      setSuccess("User registered successfully!");
      window.alert("User registered successfully!"); // Display alert for success
  
    } catch (error) {
      console.error("Sign-up failed:", error);
      let errorMessage = "Failed to create an account. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "The email address is already in use by another account.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is invalid.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled.";
          break;
        case 'auth/weak-password':
          errorMessage = "The password is too weak. Please use a stronger password.";
          break;
        default:
          errorMessage = "Failed to create an account. Please try again.";
      }
      setError(errorMessage);
      window.alert(errorMessage); // Display alert for errors
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
<Container fluid="md" style={{ marginTop: '40px' }}>
  <h2 className="my-4 text-center" >Sign Up</h2>
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
        <Col md={6} lg={4} className="mb-3">
      <Form.Group controlId="formSchoolID" className="mb-3">
        <Form.Label>School ID</Form.Label>
        <Form.Control
          type="text"
          name="schoolID"
          value={formData.schoolID}
          onChange={handleChange}
          required
          autoComplete="off"
        />
      </Form.Group>
      </Col>

      <Col md={6} lg={4} className="mb-3">
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
        </Col>

        
        <Col md={6} lg={4} className="mb-3">
  <Form.Group controlId="formGender">
    <Form.Label>Gender</Form.Label>
    <Form.Control
      as="select"
      name="gender"
      value={formData.gender}
      onChange={handleChange}
      required
      style={{ marginTop: '15px' }}
    >
      <option value="">Select Gender</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </Form.Control>
  </Form.Group>
</Col>
        </Row>


            <Form.Group controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <div className="password-input-container" style={{ position: 'relative' }}>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '40px' }} // add space for icon
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  onClick={handlePasswordToggle}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </Form.Group>
    
            <Form.Group controlId="formPreferredTitle" style={{ marginTop: '30px' }}>
              <Form.Label>Preferred Title</Form.Label>
              <Select
                defaultValue="Mr." // Default title
                value={formData.preferredTitle}
                onChange={handleTitleChange}
                style={{ width: '100%' }}
              >
                <Select.Option value="Mr.">Mr.</Select.Option>
                <Select.Option value="Ms.">Ms.</Select.Option>
                <Select.Option value="Mrs.">Mrs.</Select.Option>
              </Select>
            </Form.Group>
      
      <Form.Group controlId="formOrganization" className="mb-3" style={{ marginTop: '30px' }}>
            <Form.Label>Organization</Form.Label>
            <Select
              mode="multiple" // Enables multi-select
              placeholder="Select organization(s)"
              value={formData.organization}
              onChange={handleOrganizationChange}
              style={{ width: '100%' }}
            >
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Group>
      
      <Row>
        <Col md={6} lg={4} className="mb-3" style={{ marginTop: '30px' }}>
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




        
        
        
        <Col md={6} lg={4} className="mb-3" style={{ marginTop: '30px' }}>
          <Form.Group controlId="formCourse">
            <Form.Label>Course</Form.Label>
            <Form.Control
              as="select"
              name="course"
              value={formData.course}
              onChange={handleChange}
              
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
        <Col md={6} lg={4} className="mb-3" style={{ marginTop: '30px' }}>
        <Form.Group controlId="formMajor">
          <Form.Label>Major</Form.Label>
          <Form.Control
            as="select"
            name="major"
            value={formData.major}
            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            
          >
            <option value="">Select Major</option>
            {majors.map(major => (
              <option key={major.id} value={major.id}>{major.name}</option>
            ))}
          </Form.Control>
        </Form.Group>
        </Col>
      </Row>








      <h3 style={{ marginTop: "100px" }}>Capture Front Photo</h3>
      {isFrontWebcamActive ? (
        <>
          <Webcam
            audio={false}
            ref={frontWebcamRef}
            screenshotFormat="image/jpeg"
            style={{
              width: "100%",
              maxWidth: "700px", // Adjust max width as needed
              aspectRatio: "4 / 3", // Keeps a 4:3 aspect ratio
              transform: "scaleX(-1)"
            }}
          />
          <div className="text-center mt-5">
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
          <div className="text-center mt-5">
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
            style={{
              width: "100%",
              maxWidth: "700px", // Adjust max width as needed
              aspectRatio: "4 / 3", // Keeps a 4:3 aspect ratio
              transform: "scaleX(-1)"
            }}
          />
          <div className="text-center mt-5">
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
          <div className="text-center mt-5">
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
            style={{
              width: "100%",
              maxWidth: "700px", // Adjust max width as needed
              aspectRatio: "4 / 3", // Keeps a 4:3 aspect ratio
              transform: "scaleX(-1)"
            }}
          />
          <div className="text-center mt-5">
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
          <div className="text-center mt-5">
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

          {/* Terms and Conditions Checkbox with Link */}
          <Form.Group controlId="formTerms" style={{ marginTop: '20px' }}>
            <Form.Check
              type="checkbox"
              label={<span>I agree to the <a href="#" onClick={handleTermsShow}>Terms and Conditions</a></span>}
              checked={agreeToTerms}
              onChange={handleCheckboxChange}
              required
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '30px',
              }}
            />
          </Form.Group>

          <Modal
  show={showTerms}
  onHide={handleTermsClose}
  size="lg"
  aria-labelledby="terms-modal-title"
  centered
  backdrop={false}  // Removes the gray backdrop
  keyboard={true}   // Allows closing the modal with the Escape key (optional)
>
  <Modal.Header closeButton>
    <Modal.Title id="terms-modal-title">Terms and Conditions</Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}> {/* Enable scrolling */}
    <Terms />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleTermsClose}>
      Close
    </Button>
  </Modal.Footer>
</Modal>



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