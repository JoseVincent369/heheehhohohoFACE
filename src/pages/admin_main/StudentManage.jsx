import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Table, Input, Button, Modal, Upload, message } from 'antd';
import LoadingScreen from '../components/LoadingScreen';

const StudentManage = () => {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();
    const navigate = useNavigate();
    const storage = getStorage();

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'user'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const studentsData = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ id: doc.id, ...doc.data() });
            });
            setStudents(studentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
    };

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
                    delete updatedStudent[field];
                }
            }

            await updateDoc(studentRef, updatedStudent);
            setEditingStudent(null);
            message.success('Student information updated successfully!');
        } catch (error) {
            console.error('Error updating student:', error);
            message.error('Failed to update student. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'users', id));
            message.success('Student deleted successfully!');
        } catch (error) {
            console.error('Error deleting student:', error);
            message.error('Failed to delete student. Please try again.');
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

    const columns = [
        { title: 'First Name', dataIndex: 'fname' },
        { title: 'Middle Name', dataIndex: 'mname' },
        { title: 'Last Name', dataIndex: 'lname' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'Course', dataIndex: 'course' },
        { title: 'Major', dataIndex: 'major' },
        { title: 'Year Level', dataIndex: 'yearLevel' },
        { title: 'School ID', dataIndex: 'schoolID' },
        { title: 'Age', dataIndex: 'age' },
        { title: 'Role', dataIndex: 'role' },
        {
            title: 'Front Photo',
            dataIndex: 'photos',
            render: (photos) => <a href={photos.front} target="_blank" rel="noopener noreferrer">View</a>
        },
        {
            title: 'Left Photo',
            dataIndex: 'photos',
            render: (photos) => <a href={photos.left} target="_blank" rel="noopener noreferrer">View</a>
        },
        {
            title: 'Right Photo',
            dataIndex: 'photos',
            render: (photos) => <a href={photos.right} target="_blank" rel="noopener noreferrer">View</a>
        },
        {
            title: 'Actions',
            render: (_, record) => (
                <>
                    <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
                    <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
                </>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h2>Manage Students</h2>
            <Input.Search
                placeholder="Search students..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ marginBottom: '20px' }}
            />
            <Table dataSource={filteredStudents} columns={columns} rowKey="id" />

            <Modal
                visible={!!editingStudent}
                title="Edit Student Information"
                onCancel={() => setEditingStudent(null)}
                footer={null}
            >
                <div>
                    <Input placeholder="First Name" value={editingStudent?.fname} onChange={(e) => setEditingStudent({ ...editingStudent, fname: e.target.value })} />
                    <Input placeholder="Middle Name" value={editingStudent?.mname} onChange={(e) => setEditingStudent({ ...editingStudent, mname: e.target.value })} />
                    <Input placeholder="Last Name" value={editingStudent?.lname} onChange={(e) => setEditingStudent({ ...editingStudent, lname: e.target.value })} />
                    <Input placeholder="Email" value={editingStudent?.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                    <Input placeholder="Course" value={editingStudent?.course} onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })} />
                    <Input placeholder="Major" value={editingStudent?.major} onChange={(e) => setEditingStudent({ ...editingStudent, major: e.target.value })} />
                    <Input placeholder="Year Level" value={editingStudent?.yearLevel} onChange={(e) => setEditingStudent({ ...editingStudent, yearLevel: e.target.value })} />
                    <Input placeholder="School ID" value={editingStudent?.schoolID} onChange={(e) => setEditingStudent({ ...editingStudent, schoolID: e.target.value })} />
                    <Input placeholder="Age" value={editingStudent?.age} onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })} />
                    <Input placeholder="Role" value={editingStudent?.role} onChange={(e) => setEditingStudent({ ...editingStudent, role: e.target.value })} />

                    <div>
                        <label>Front Photo:</label>
                        <Upload beforeUpload={(file) => { setEditingStudent((prev) => ({ ...prev, frontPhoto: file })); return false; }}>
                            <Button>Upload</Button>
                        </Upload>
                    </div>
                    <div>
                        <label>Left Photo:</label>
                        <Upload beforeUpload={(file) => { setEditingStudent((prev) => ({ ...prev, leftPhoto: file })); return false; }}>
                            <Button>Upload</Button>
                        </Upload>
                    </div>
                    <div>
                        <label>Right Photo:</label>
                        <Upload beforeUpload={(file) => { setEditingStudent((prev) => ({ ...prev, rightPhoto: file })); return false; }}>
                            <Button>Upload</Button>
                        </Upload>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <Button type="primary" onClick={() => handleSave(editingStudent.id)}>Save</Button>
                        <Button onClick={() => setEditingStudent(null)} style={{ marginLeft: '10px' }}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentManage;
