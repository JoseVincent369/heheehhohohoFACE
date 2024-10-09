import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import './generalstyles.css';

const StudentManage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();
    
    // Replace this with the logic to get the actual department ID
    const departmentId = "your_department_id_here"; // Make sure this is correctly set

    // Fetch students with course and major
    const fetchStudentsWithCourseAndMajor = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'user'));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const studentsData = [];
            for (const userDoc of querySnapshot.docs) {
                const student = { id: userDoc.id, ...userDoc.data() };

                // Fetch course name
                let courseName = 'N/A';
                if (student.course) {
                    const courseDoc = await getDoc(doc(db, `departments/${departmentId}/courses`, student.course));
                    if (courseDoc.exists()) {
                        courseName = courseDoc.data().name; // Ensure 'name' is the correct field
                    }
                }

                // Fetch major name
                let majorName = 'N/A';
                if (student.major) {
                    const majorDoc = await getDoc(doc(db, `departments/${departmentId}/courses/${student.course}/majors`, student.major));
                    if (majorDoc.exists()) {
                        majorName = majorDoc.data().name; // Ensure 'name' is the correct field
                    }
                }

                // Push student data with course and major names to the array
                studentsData.push({ ...student, courseName, majorName });
            }
            setStudents(studentsData);
            setLoading(false);
        });
        return () => unsubscribe();
    };

    useEffect(() => {
        fetchStudentsWithCourseAndMajor();
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="student-manage">
            <h2>Manage Students</h2>
            <table className="student-table">
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Major</th>
                        <th>Year Level</th>
                        <th>School ID</th>
                        <th>Age</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.fname}</td>
                            <td>{student.lname}</td>
                            <td>{student.email}</td>
                            <td>{student.courseName}</td>
                            <td>{student.majorName}</td>
                            <td>{student.yearLevel}</td>
                            <td>{student.schoolID}</td>
                            <td>{student.age}</td>
                            <td>{student.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentManage;
