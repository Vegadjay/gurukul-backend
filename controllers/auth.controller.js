const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Guru = require('../models/guru.model');
const Student = require('../models/student.model');

const generateToken = (id, role) => {
	return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '3h' });
};

const loginUser = async (req, res) => {
	const { role, email, password } = req.body;

	if (!role || !email || !password) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: 'All fields are required',
			data: null
		});
	}

	try {
		let user;

		if (role === 'guru') {
			user = await Guru.findOne({ email });
		} else if (role === 'student') {
			user = await Student.findOne({ email });
		}
		else if(role === "admin"){
			user = await Guru.findOne({ email, role: "admin" });
		} else {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Invalid role',
				data: null
			});
		}

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'User not found',
				data: null
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Invalid password',
				data: null
			});
		}

		const token = generateToken(user._id, role);

		const { password: _, ...userWithoutPassword } = user.toObject();

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Login successful',
			data: {
				token,
				user: userWithoutPassword
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Server error',
			data: null
		});
	}
};

const verifyAndSendUserData = async (req, res) => {
	const token = req.header('Authorization')?.replace('Bearer ', '');

	if (!token) {
		return res.status(401).json({
			success: false,
			error: 1,
			message: 'Authorization token is required',
			data: null
		});
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		let user;
		if (decoded.role === 'guru') {
			user = await Guru.findById(decoded.id);
		} else if (decoded.role === 'student') {
			user = await Student.findById(decoded.id);
		}

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'User not found',
				data: null
			});
		}

		const { password, ...userData } = user.toObject();

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'User data fetched successfully',
			data: userData
		});
	} catch (err) {
		console.error('Error verifying token:', err);
		return res.status(401).json({
			success: false,
			error: 1,
			message: 'Invalid or expired token',
			data: null
		});
	}
};

module.exports = { loginUser, verifyAndSendUserData };
