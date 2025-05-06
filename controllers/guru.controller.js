const Guru = require('../models/guru.model');
const Student = require('../models/student.model');
const Session = require('../models/sessions.model');
const Transaction = require("../models/transaction.model");
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const validateBody = (body) => {
	if (!body.username || typeof body.username !== 'string' || body.username.length < 3) {
		return 'Username is required and must be at least 3 characters long.';
	}

	if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
		return 'A valid email is required.';
	}

	// if (!body.password || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(body.password)) {
	// 	return 'Password must be at least 8 characters long and contain at least one letter and one number.';
	// }

	if (!body.phone || !/^\+\d{1,3}\d{10,13}$/.test(body.phone)) {
		return 'Phone number is required and must include a country code, with a total length of 10 to 13 digits.';
	}
	if (body.profileImage && !/\.(jpg|jpeg|png|svg|webp)$/i.test(body.profileImage)) {
		return 'Profile image must be a valid file with extensions .jpg, .jpeg, .png, .svg, or .webp.';
	}
	if (
		!body.address ||
		!body.address.city ||
		!body.address.state ||
		!body.address.country ||
		!body.address.zipCode
	) {
		return 'Complete address (city, state, country, zipCode) is required.';
	}

	return null;
};

const validateUpdateBody = (body) => {
	if (body.username && (typeof body.username !== 'string' || body.username.length < 3)) {
		return 'Username must be at least 3 characters long.';
	}

	if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
		return 'A valid email is required.';
	}

	if (body.password && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(body.password)) {
		return 'Password must be at least 8 characters long and contain at least one letter and one number.';
	}

	if (body.phone && !/^\+\d{1,3}\d{10,13}$/.test(body.phone)) {
		return 'Phone number must include a country code, with a total length of 10 to 13 digits.';
	}

	if (body.profileImage && !/\.(jpg|jpeg|png|svg|webp)$/i.test(body.profileImage)) {
		return 'Profile image must be a valid file with extensions .jpg, .jpeg, .png, .svg, or .webp.';
	}

	if (body.address) {
		if (
			(body.address.city && typeof body.address.city !== 'string') ||
			(body.address.state && typeof body.address.state !== 'string') ||
			(body.address.country && typeof body.address.country !== 'string') ||
			(body.address.zipCode && typeof body.address.zipCode !== 'string')
		) {
			return 'Address fields (city, state, country, zipCode) must be valid strings.';
		}
	}

	return null;
}

const createGuru = async (req, res) => {
	const body = req.body;
	const error = validateBody(body);

	if (error) {
		if (req.file) {
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

		// Process education data
		let educationData = [];
		if (body.education) {
			// Check if education is already an array of objects
			if (Array.isArray(body.education) && typeof body.education[0] === 'object') {
				educationData = body.education;
			}
			// If it's a string, convert it to a proper object format
			else if (typeof body.education === 'string') {
				educationData = [{
					degree: body.education,
					institutionName: body.institutionName || '',
					startDate: body.educationStartDate || '',
					endDate: body.educationEndDate || ''
				}];
			}
		}

		// Process availableTimes data
		let availableTimesData = [];
		if (body.availableTimes) {
			// Check if availableTimes is already an array of objects
			if (Array.isArray(body.availableTimes) && typeof body.availableTimes[0] === 'object') {
				availableTimesData = body.availableTimes;
			}
			// If it's a string, parse it into a proper format
			else if (typeof body.availableTimes === 'string') {
				// Example format: "Mon-Fri: 9AM - 5AM"
				// Parse this into proper day/time objects
				const daysMapping = {
					'Mon': 'Monday',
					'Tue': 'Tuesday',
					'Wed': 'Wednesday',
					'Thu': 'Thursday',
					'Fri': 'Friday',
					'Sat': 'Saturday',
					'Sun': 'Sunday'
				};

				// Simple parsing - this should be improved based on your actual format
				const parts = body.availableTimes.split(':');
				if (parts.length >= 2) {
					const daysPart = parts[0].trim();
					const timePart = parts.slice(1).join(':').trim();

					// Handle day ranges like "Mon-Fri"
					if (daysPart.includes('-')) {
						const [startDay, endDay] = daysPart.split('-').map(d => d.trim());
						const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
						const startIndex = days.indexOf(startDay);
						const endIndex = days.indexOf(endDay);

						if (startIndex !== -1 && endIndex !== -1) {
							for (let i = startIndex; i <= endIndex; i++) {
								availableTimesData.push({
									day: daysMapping[days[i]],
									time: timePart
								});
							}
						}
					} else {
						// Single day
						const dayCode = daysPart.trim();
						if (daysMapping[dayCode]) {
							availableTimesData.push({
								day: daysMapping[dayCode],
								time: timePart
							});
						}
					}
				}
			}
		}

		// Create the Guru object with properly formatted data
		const guruData = {
			...body,
			password: hashedPassword,
			profileImage: profileImagePath,
			education: educationData,
			availableTimes: availableTimesData
		};

		const guru = new Guru(guruData);

		// Save the Guru
		const savedGuru = await guru.save();

		return res.status(201).json({
			success: true,
			error: 0,
			message: 'Guru created successfully',
			data: savedGuru,
		});
	} catch (err) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: 'Error while creating guru',
			data: null,
		});
	}
};

const getAllGurus = async (req, res) => {
	try {
		const gurus = await Guru.find().select('-password')
		return res.status(200).json({
			success: true,
			error: 0,
			message: "Gurus fetched successfully",
			data: gurus,
		});
	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: "Error while fetching data.", data: null });
	}
};

const getGuruById = async (req, res) => {
	const id = req.params.id;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	try {
		const guru = await Guru.findById(id)
			.select('-password')
		if (!guru) return res.status(404).json({ success: false, error: 0, message: 'Guru not found', data: null });

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru fetched successfully',
			data: guru,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while fetching guru',
			data: null,
		});
	}
};

const updateProfileImage = async (req, res) => {
	const id = req.params.id;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	}

	const profileImageName = req.file ? req.file.path : null;
	if (!profileImageName) {
		return res.status(400).json({ success: false, error: 1, message: 'Profile image is required', data: null });
	}

	try {
		try {
			const guru = await Guru.findById(id);
			if (!guru) {
				return res.status(404).json({ success: false, error: 1, message: 'Guru not found', data: null });
			}

			if (guru.profileImage) {
				const oldImagePath = path.join(__dirname, '..', guru.profileImage);
				if (fs.existsSync(oldImagePath)) {
					fs.unlink(oldImagePath, (err) => {
						if (err) {
							console.error('Error deleting old profile image:', err);
						}
					});
				}
			}
		} catch (err) {
			return res.status(500).json({
				success: false,
				error: 1,
				message: 'Error while processing profile image update',
				data: null,
			});
		}
		const updatedGuru = await Guru.findByIdAndUpdate(id, { profileImage: profileImageName }, { new: true });
		if (!updatedGuru) {
			return res.status(404).json({ success: false, error: 1, message: 'Guru not found', data: null });
		}
		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Profile image updated successfully',
			data: updatedGuru,
		});
	}
	catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while updating profile image',
			data: null,
		});
	}

}

const updateGuru = async (req, res) => {
	const id = req.params.id;
	const body = req.body;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	}

	const error = validateUpdateBody(body);
	if (error) {
		return res.status(400).json({ success: false, error: 1, message: error, data: null });
	}

	try {
		// Process education data if present
		if (body.education && typeof body.education === 'string') {
			body.education = [{
				degree: body.education,
				institutionName: body.institutionName || '',
				startDate: body.educationStartDate || '',
				endDate: body.educationEndDate || ''
			}];
		}

		// Process availableTimes data if present
		if (body.availableTimes && typeof body.availableTimes === 'string') {
			const daysMapping = {
				'Mon': 'Monday',
				'Tue': 'Tuesday',
				'Wed': 'Wednesday',
				'Thu': 'Thursday',
				'Fri': 'Friday',
				'Sat': 'Saturday',
				'Sun': 'Sunday'
			};

			let availableTimesData = [];
			const parts = body.availableTimes.split(':');
			if (parts.length >= 2) {
				const daysPart = parts[0].trim();
				const timePart = parts.slice(1).join(':').trim();

				if (daysPart.includes('-')) {
					const [startDay, endDay] = daysPart.split('-').map(d => d.trim());
					const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
					const startIndex = days.indexOf(startDay);
					const endIndex = days.indexOf(endDay);

					if (startIndex !== -1 && endIndex !== -1) {
						for (let i = startIndex; i <= endIndex; i++) {
							availableTimesData.push({
								day: daysMapping[days[i]],
								time: timePart
							});
						}
					}
				} else {
					const dayCode = daysPart.trim();
					if (daysMapping[dayCode]) {
						availableTimesData.push({
							day: daysMapping[dayCode],
							time: timePart
						});
					}
				}

				body.availableTimes = availableTimesData;
			}
		}

		const updatedGuru = await Guru.findByIdAndUpdate(id, body, { new: true });
		if (!updatedGuru) {
			return res.status(404).json({ success: false, error: 1, message: 'Guru not found', data: null });
		}
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru updated successfully',
			data: updatedGuru,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while updating guru',
			data: null,
		});
	}
};

const deleteGuru = async (req, res) => {
	const id = req.params.id;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	try {
		const deletedGuru = await Guru.findByIdAndDelete(id);
		if (!deletedGuru) return res.status(404).json({ success: false, error: 0, message: 'Guru not found', data: null });
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru deleted successfully',
			data: null,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while deleting guru',
			data: null,
		});
	}
};

const setOnlineGurus = async (req, res) => {
	const id = req.params.id;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	try {
		const guru = await Guru.findByIdAndUpdate(id, { isOnline: true }, { new: true });
		if (!guru) return res.status(404).json({ success: false, error: 0, message: 'Guru not found', data: null });
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru set to online successfully',
			data: guru,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while setting guru to online',
			data: null,
		});
	}
}

const setOfflineGurus = async (req, res) => {
	const id = req.params.id;
	if (!id) return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	try {
		const guru = await Guru.findByIdAndUpdate(id, { isOnline: false }, { new: true });
		if (!guru) return res.status(404).json({ success: false, error: 0, message: 'Guru not found', data: null });
		res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru set to offline successfully',
			data: guru,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while setting guru to offline',
			data: null,
		});
	}
}

const handlePaymentTransfer = async (req, res) => {
	//get sender, reciever, amount from body, and deduct money from senderID, conduct money in reciever
	const { receiverId, amount, transactionId } = req.body;
	const senderId = process.env.ADMIN_ID;

	if (!senderId || !receiverId || !amount || amount <= 0 || !transactionId) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: 'Sender ID, Receiver ID, Transaction ID and a valid amount are required',
			data: null,
		});
	}

	try {
		// Fetch sender and receiver
		const sender = await Guru.findById(senderId);
		const receiver = await Guru.findById(receiverId);
		const transaction = await Transaction.findById(transactionId);

		if (!sender) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Sender not found',
				data: null,
			});
		}

		if (!receiver) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Receiver not found',
				data: null,
			});
		}
		if (!transaction) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Transaction not found',
				data: null,
			});
		}


		if (sender.earnings < amount) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Insufficient balance',
				data: null,
			});
		}

		// Deduct amount from sender and add to receiver
		transaction.paidToTeacher = true;
		sender.earnings -= amount;
		receiver.earnings += amount;

		// Save updated data
		await transaction.save();
		await sender.save();
		await receiver.save();

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Payment processed successfully',
			data: { sender, receiver },
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while processing payment',
			data: null,
		});
	}
}

const handlePaymentAdd = async (req, res) => {
	const id = process.env.ADMIN_ID;
	const { amount } = req.body;
	if (!id || !amount || amount <= 0) {
		return res.status(400).json({
			success: false,
			error: 1,
			message: 'Admin ID and a valid amount are required',
			data: null,
		});
	}

	try {
		const admin = await Guru.findById(id);

		if (!admin) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Admin not found',
				data: null,
			});
		}

		admin.earnings += amount;

		await admin.save();

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Earnings added successfully',
			data: admin,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while adding earnings',
			data: null,
		});
	}
}

const getStats = async (req, res) => {
	const id = req.params.id;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	}

	try {
		const guru = await Guru.findById(id);
		if (!guru) {
			return res.status(404).json({ success: false, error: 1, message: 'Guru not found', data: null });
		}

		const totalSessions = await Session.countDocuments({ guru: id });
		const totalStudents = await Student.countDocuments({ enrolledGurus: id });

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Stats fetched successfully',
			data: {
				totalStudents,
				totalSessions,
				rating: guru.rating,
			},
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while fetching stats',
			data: null,
		});
	}
};

const verifyGuru = async (req, res) => {
	const id = req.params.id;

	if (!id) {
		return res.status(400).json({ success: false, error: 1, message: 'Guru ID is required', data: null });
	}

	try {
		const updatedGuru = await Guru.findByIdAndUpdate(id, { verified: true }, { new: true });
		if (!updatedGuru) {
			return res.status(404).json({ success: false, error: 1, message: 'Guru not found', data: null });
		}
		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Guru verified successfully',
			data: updatedGuru,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error while verifying guru',
			data: null,
		});
	}
};

module.exports = {
	createGuru,
	getAllGurus,
	getGuruById,
	updateGuru,
	deleteGuru,
	updateProfileImage,
	setOnlineGurus,
	setOfflineGurus,
	handlePaymentTransfer,
	handlePaymentAdd,
	getStats,
	verifyGuru
};