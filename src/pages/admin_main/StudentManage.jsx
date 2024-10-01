import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingScreen from '../components/LoadingScreen';
import Modal from 'react-modal';
import './generalstyles.css';

const StudentManage = () => {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null); // Modal state
    const db = getFirestore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentsWithCourseAndMajor = async () => {
            const q = query(collection(db, 'users'), where('role', '==', 'user'));
            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                const studentsData = [];
    
                for (const userDoc of querySnapshot.docs) {
                    const student = { id: userDoc.id, ...userDoc.data() };
    
                    // Fetch course name
                    let courseName = 'N/A';
                    if (student.course) {
                        const courseDoc = await getDoc(doc(db, 'departments/departmentId/courses', student.course));
                        if (courseDoc.exists()) {
                            courseName = courseDoc.data().name;
                        }
                    }
    
                    // Fetch major name
                    let majorName = 'N/A';
                    if (student.major) {
                        const majorDoc = await getDoc(doc(db, `departments/departmentId/courses/${student.course}/majors`, student.major));
                        if (majorDoc.exists()) {
                            majorName = majorDoc.data().name;
                        }
                    }
    
                    studentsData.push({ ...student, courseName, majorName });
                }
    
                setStudents(studentsData);
                setLoading(false);
            });
    
            return () => unsubscribe();
        };
    
        fetchStudentsWithCourseAndMajor();
    }, [db]);
    

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleEdit = (student) => {
        setEditingStudent(student); // Open modal with selected student
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setEditingStudent((prev) => ({
                ...prev,
                [field]: file
            }));
        }
    };

    const storage = getStorage();

    const uploadPhoto = async (file, userId, photoType) => {
        const storageRef = ref(storage, `users/${userId}/${photoType}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    };

    const handleSave = async (id) => {
        try {
            const studentRef = doc(db, 'users', id);
            const updatedStudent = { ...editingStudent };

            const photoFields = ['frontPhoto', 'leftPhoto', 'rightPhoto'];
            for (const field of photoFields) {
                if (updatedStudent[field] instanceof File) {
                    const url = await uploadPhoto(updatedStudent[field], id, field);
                    updatedStudent.photos[field.replace('Photo', '')] = url;
                    delete updatedStudent[field]; // Remove file from the object
                }
            }

            await updateDoc(studentRef, updatedStudent);
            setEditingStudent(null); // Close modal
            alert('Student information updated successfully!');
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'users', id));
            alert('Student deleted successfully!');
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student. Please try again.');
        }
    };
 
    const filteredStudents = students.filter(student => {
        return (
            student.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.schoolID.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="student-manage">
            <h2>Manage Students</h2>
            <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-bar"
            />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}></div>
            <table className="student-table">
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Middle Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Major</th>
                        <th>Year Level</th>
                        <th>School ID</th>
                        <th>Age</th>
                        <th>Role</th>
                        <th>Front Photo</th>
                        <th>Left Photo</th>
                        <th>Right Photo</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    {filteredStudents.map(student => (
        <tr key={student.id}>
            <td>{student.fname}</td>
            <td>{student.mname}</td>
            <td>{student.lname}</td>
            <td>{student.email}</td>
            <td> {student.major} </td>
            <td> {student.course} </td>
            <td>{student.yearLevel}</td>
            <td>{student.schoolID}</td>
            <td>{student.age}</td>
            <td>{student.role}</td>
            <td><a href={student.photos.front} target="_blank" rel="noopener noreferrer">Front</a></td>
            <td><a href={student.photos.left} target="_blank" rel="noopener noreferrer">Left</a></td>
            <td><a href={student.photos.right} target="_blank" rel="noopener noreferrer">Right</a></td>
            <td>
                <button onClick={() => handleEdit(student)}>Edit</button>
                <button onClick={() => handleDelete(student.id)}>Delete</button>
            </td>
        </tr>
    ))}
</tbody>

            </table>

            {editingStudent && (
                <Modal
    isOpen={!!editingStudent}
    onRequestClose={() => setEditingStudent(null)}
    contentLabel="Edit Student"
    ariaHideApp={false}
    style={{
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            marginTop: '40px',
            maxHeight: '80vh', // Maximum height for scroll
            overflowY: 'auto', // Enable vertical scroll
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional for a dim background effect
        },
    }}
>
    <h2>Edit Student Information</h2>
    <div className="edit-modal-content">
        <label>First Name</label>
        <input type="text" value={editingStudent.fname} onChange={(e) => setEditingStudent({ ...editingStudent, fname: e.target.value })} placeholder="First Name" />
        
        <label>Middle Name</label>
        <input type="text" value={editingStudent.mname} onChange={(e) => setEditingStudent({ ...editingStudent, mname: e.target.value })} placeholder="Middle Name" />
        
        <label>Last Name</label>
        <input type="text" value={editingStudent.lname} onChange={(e) => setEditingStudent({ ...editingStudent, lname: e.target.value })} placeholder="Last Name" />
        
        <label>Email</label>
        <input type="text" value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} placeholder="Email" />
        
        <label>Course</label>
        <input type="text" value={editingStudent.course} onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })} placeholder="Course" />
        
        <label>Major</label>
        <input type="text" value={editingStudent.major} onChange={(e) => setEditingStudent({ ...editingStudent, major: e.target.value })} placeholder="Major" />
        
        <label>Year Level</label>
        <input type="text" value={editingStudent.yearLevel} onChange={(e) => setEditingStudent({ ...editingStudent, yearLevel: e.target.value })} placeholder="Year Level" />
        
        <label>School ID</label>
        <input type="text" value={editingStudent.schoolID} onChange={(e) => setEditingStudent({ ...editingStudent, schoolID: e.target.value })} placeholder="School ID" />
        
        <label>Age</label>
        <input type="text" value={editingStudent.age} onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })} placeholder="Age" />
        
        <label>Role</label>
        <input type="text" value={editingStudent.role} onChange={(e) => setEditingStudent({ ...editingStudent, role: e.target.value })} placeholder="Role" />
        
        <label>Front Photo</label>
<div className="file-input-container">
    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'frontPhoto')} />
    <span>{editingStudent.frontPhoto ? editingStudent.frontPhoto.name : ""}</span>
</div>

<label>Left Photo</label>
<div className="file-input-container">
    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'leftPhoto')} />
    <span>{editingStudent.leftPhoto ? editingStudent.leftPhoto.name : ""}</span>
</div>

<label>Right Photo</label>
<div className="file-input-container">
    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'rightPhoto')} />
    <span>{editingStudent.rightPhoto ? editingStudent.rightPhoto.name : ""}</span>
</div>

        <div className="modal-buttons">
            <button onClick={() => handleSave(editingStudent.id)}>Save</button>
            <button onClick={() => setEditingStudent(null)}>Cancel</button>
        </div>
    </div>
</Modal>

            )}
        </div>
    );
};

export default StudentManage;
