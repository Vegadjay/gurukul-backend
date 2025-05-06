const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const upload = require('../multer/storage');

router.post('/', upload.single('profileImage'), studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.get('/booklesson', studentController.getBookLesson);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.put('/:id/profile-image', upload.single('profileImage'), studentController.updateProfileImage);
router.delete('/:id', studentController.deleteStudent);
router.get('/online/:id', studentController.setOnlineStudents);
router.get('/offline/:id', studentController.setOfflineStudents);
router.get('/enrolled/:id', studentController.getEnrolledStudents);


module.exports = router;
