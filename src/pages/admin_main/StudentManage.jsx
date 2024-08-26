import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import './generalstyles.css';

const StudentManage = () => {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        // Fetch only users (exclude moderators)
        const q = query(collection(db, 'users'), where('role', '==', 'user'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const studentsData = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ id: doc.id, ...doc.data() });
            });
            setStudents(studentsData);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
    };

    const handleSave = async (id) => {
        try {
            const studentRef = doc(db, 'users', id);
            await updateDoc(studentRef, editingStudent);
            setEditingStudent(null);
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
                            {editingStudent?.id === student.id ? (
                                <>
                                    <td><input type="text" value={editingStudent.fname} onChange={(e) => setEditingStudent({ ...editingStudent, fname: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.mname} onChange={(e) => setEditingStudent({ ...editingStudent, mname: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.lname} onChange={(e) => setEditingStudent({ ...editingStudent, lname: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.course} onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.major} onChange={(e) => setEditingStudent({ ...editingStudent, major: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.yearLevel} onChange={(e) => setEditingStudent({ ...editingStudent, yearLevel: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.schoolID} onChange={(e) => setEditingStudent({ ...editingStudent, schoolID: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.age} onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })} /></td>
                                    <td><input type="text" value={editingStudent.role} onChange={(e) => setEditingStudent({ ...editingStudent, role: e.target.value })} /></td>
                                    <td><a href={student.photos['front.jpg']} target="_blank" rel="noopener noreferrer">Front</a></td>
                                    <td><a href={student.photos['left.jpg']} target="_blank" rel="noopener noreferrer">Left</a></td>
                                    <td><a href={student.photos['right.jpg']} target="_blank" rel="noopener noreferrer">Right</a></td>
                                    <td>
                                        <button onClick={() => handleSave(student.id)}>Save</button>
                                        <button onClick={() => setEditingStudent(null)}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{student.fname}</td>
                                    <td>{student.mname}</td>
                                    <td>{student.lname}</td>
                                    <td>{student.email}</td>
                                    <td>{student.course}</td>
                                    <td>{student.major}</td>
                                    <td>{student.yearLevel}</td>
                                    <td>{student.schoolID}</td>
                                    <td>{student.age}</td>
                                    <td>{student.role}</td>
                                    <td><a href={student.photos['front.jpg']} target="_blank" rel="noopener noreferrer">Front</a></td>
                                    <td><a href={student.photos['left.jpg']} target="_blank" rel="noopener noreferrer">Left</a></td>
                                    <td><a href={student.photos['right.jpg']} target="_blank" rel="noopener noreferrer">Right</a></td>
                                    <td>
                                        <button onClick={() => handleEdit(student)}>Edit</button>
                                        <button onClick={() => handleDelete(student.id)}>Delete</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentManage;
