const Student = require('../models/student.model');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

const validateBody = (body) => {
	if (!body.username || typeof body.username !== 'string' || body.username.length < 3) {
		return 'Username is required and must be at least 3 characters long.';
	}

	if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
		return 'A valid email is required.';
	}

	if (!body.password || body.password.length < 6) {
		return 'Password must be at least 6 characters long.';
	}

	if (!body.phone || !/^\+\d{1,3}\d{10,13}$/.test(body.phone)) {
		return 'Phone number is required and must include a country code, with a total length of 10 to 13 digits.';
	}

	if (
		body.profileImage &&
		!/\.(jpg|jpeg|png|svg|webp)$/i.test(body.profileImage)
	) {
		return 'Profile image must be a valid image file.';
	}

	return null;
};

const validateUpdateBody = (body) => {
	if (body.username && (typeof body.username !== 'string' || body.username.length < 3)) {
		return 'Username must be at least 3 characters long.';
	}

	if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
		return 'A valid email is required.';
	}

	if (body.password && body.password.length < 6) {
		return 'Password must be at least 6 characters long.';
	}

	if (body.phone && !/^\+\d{1,3}\d{10,13}$/.test(body.phone)) {
		return 'Phone number must include a country code, with a total length of 10 to 13 digits.';
	}

	return null;
};

const createStudent = async (req, res) => {
	const body = req.body;
	const error = validateBody(body);

	// Check if there is an error in the body validation
	if (error) {
		if (req.file) {
			// If a file is uploaded but there is an error, delete the uploaded file
			const uploadedFilePath = req.file.path;
			if (fs.existsSync(uploadedFilePath)) {
				fs.unlink(uploadedFilePath, (err) => {
					if (err) {
						console.error('Error deleting uploaded profile image:', err);
					}
				});
			}
		}
		return res.status(400).json({ success: false, error: 1, message: error, data: null });
	}

	// Handle profile image
	let profileImagePath = null;
	if (req.file) {
		// If a profile image is uploaded, get the file path
		profileImagePath = req.file.path;
	}

	try {
		// Hash the password
		const hashedPassword = await bcrypt.hash(body.password, 10);
		body.password = hashedPassword;

		// Create the Student object and include the profile image if it exists
		const studentData = {
			...body,
			profileImage: profileImagePath, // Add the profile image path to the student data
		};

		// Create the Student document
		const student = new Student(studentData);

		// Save the Student
		const savedStudent = await student.save();

		return res.status(201).json({
			success: true,
			error: 0,
			message: 'Student created successfully',
			data: savedStudent,
		});
	} catch (err) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: 'Error while creating student',
			data: null,
		});
	}
};

const getAllStudents = async (req, res) => {
	try {
		const students = await Student.find().select('-password');
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Students fetched successfully',
			data: students,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while fetching students',
			data: null,
		});
	}
};

const getStudentById = async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });

	try {
		const student = await Student.findById(id).select('-password');
		if (!student) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Student not found',
				data: null,
			});
		}
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Student fetched successfully',
			data: student,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while fetching student',
			data: null,
		});
	}
};

const updateStudent = async (req, res) => {
	const { id } = req.params;
	const body = req.body;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });
	}

	const error = validateUpdateBody(body);
	if (error) {
		return res.status(400).json({ success: false, error: 1, message: error, data: null });
	}

	try {
		// Hash new password if updated
		if (body.password) {
			body.password = await bcrypt.hash(body.password, 10);
		}

		const updatedStudent = await Student.findByIdAndUpdate(id, body, { new: true });
		if (!updatedStudent) {
			return res.status(404).json({ success: false, error: 1, message: 'Student not found', data: null });
		}

		res.status(200).json({
			success: true,
			error: 0,
			message: 'Student updated successfully',
			data: updatedStudent,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while updating student',
			data: null,
		});
	}
};

const updateProfileImage = async (req, res) => {
	const id = req.params.id;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });
	}

	const profileImageName = req.file ? req.file.path : null;

	if (!profileImageName) {
		return res.status(400).json({ success: false, error: 1, message: 'Profile image is required', data: null });
	}

	try {
		const student = await Student.findById(id);
		if (!student) {
			return res.status(404).json({ success: false, error: 1, message: 'Student not found', data: null });
		}

		if (student.profileImage) {
			const oldImagePath = path.join(__dirname, '..', student.profileImage);
			if (fs.existsSync(oldImagePath)) {
				fs.unlink(oldImagePath, (err) => {
					if (err) {
						console.error('Error deleting old profile image:', err);
					}
				});
			}
		}

		const updatedStudent = await Student.findByIdAndUpdate(id, { profileImage: profileImageName }, { new: true });
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Profile image updated successfully',
			data: updatedStudent,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while updating profile image',
			data: null,
		});
	}
};

const deleteStudent = async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });

	try {
		const deletedStudent = await Student.findByIdAndDelete(id);
		if (!deletedStudent) {
			return res.status(404).json({ success: false, error: 1, message: 'Student not found', data: null });
		}
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Student deleted successfully',
			data: null,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while deleting student',
			data: null,
		});
	}
};

const setOnlineStudents = async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });

	try {
		const updatedStudent = await Student.findByIdAndUpdate(id, { isOnline: true }, { new: true });
		if (!updatedStudent) {
			return res.status(404).json({ success: false, error: 1, message: 'Student not found', data: null });
		}
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Student set to online successfully',
			data: updatedStudent,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while setting student to online',
			data: null,
		});
	}
}

const setOfflineStudents = async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Student ID is required', data: null });

	try {
		const updatedStudent = await Student.findByIdAndUpdate(id, { isOnline: false }, { new: true });
		if (!updatedStudent) {
			return res.status(404).json({ success: false, error: 1, message: 'Student not found', data: null });
		}
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Student set to offline successfully',
			data: updatedStudent,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while setting student to offline',
			data: null,
		});
	}
}

const getEnrolledStudents = async (req, res) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: "Guru ID is required",
			data: null,
		});
	}

	try {
		const students = await Student.find({ enrolledGurus: { $exists: true, $not: { $size: 0 } } }).select('username email phone enrolledGurus profileImage');

		if (!students || students.length === 0) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: "No students found for this guru",
				data: students.map(student => ({
					username: student.username,
					phone: student.phone
				})),
			});
		}

		const enrolledStudents = students
			.filter((student) => student.enrolledGurus.includes(id))
			.map((student) => ({ phone: student.phone, username: student.username }));
		if (enrolledStudents.length === 0) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: "No students found for this guru",
				data: null,
			});
		}

		res.status(200).json({
			success: true,
			error: 0,
			message: "Enrolled students fetched successfully",
			data: students,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: "Error while fetching enrolled students",
			data: null,
		});
	}
};

const getBookLesson = async (req, res) => {
	const { studentId, guruId } = req.query;

	if (!studentId || !guruId) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: "Both studentId and guruId are required",
			data: null,
		});
	}

	if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(guruId)) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: "Invalid studentId or guruId",
			data: null,
		});
	}

	try {
		const student = await Student.findById(studentId);
		if (!student) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: "Student not found",
				data: null,
			});
		}

		const guruObjectId = guruId;

		if (!student.enrolledGurus.includes(guruObjectId)) {
			student.enrolledGurus.push(guruObjectId);
			await student.save();
		} else {
			return res.status(400).json({
				success: false,
				error: 2,
				message: "Student is already subscribed to this guru",
				data: null,
			});
		}

		res.status(200).json({
			success: true,
			error: 0,
			message: "Guru successfully added to student's enrolledGurus",
			data: {
				username: student.username,
				enrolledGurus: student.enrolledGurus,
			},
		});
	} catch (err) {
		console.error("Error booking lesson:", err);
		res.status(500).json({
			success: false,
			error: 1,
			message: "Internal server error",
			data: null,
		});
	}
};

module.exports = {
	createStudent,
	getAllStudents,
	getStudentById,
	updateStudent,
	updateProfileImage,
	deleteStudent,
	setOnlineStudents,
	setOfflineStudents,
	getEnrolledStudents,
	getBookLesson
};
