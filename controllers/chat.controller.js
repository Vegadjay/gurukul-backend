const Chat = require('../models/chat.model');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendMessage = async (req, res) => {
	try {
		const { guruId, studentId, sender, message } = req.body;

		if (!guruId || !studentId || !sender || !message) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'please provide required fileds.',
				data: null
			});
		}

		if (!isValidObjectId(guruId) || !isValidObjectId(studentId)) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Invalid given data.',
				data: null
			});
		}

		if (!['guru', 'student'].includes(sender)) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Sender must be "guru" or "student".',
				data: null
			});
		}

		if (typeof message !== 'string' || message.trim() === '') {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Message must be a non-empty string.',
				data: null
			});
		}

		let chat = await Chat.findOne({ guru: guruId, student: studentId });

		if (!chat) {
			chat = new Chat({
				guru: guruId,
				student: studentId,
				messages: []
			});
		}

		chat.messages.push({ sender, message });
		await chat.save();

		return res.status(201).json({
			success: true,
			error: 0,
			message: 'Message sent successfully.',
			data: chat
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: true,
			message: 'Error sending message.',
			data: err.message
		});
	}
};

const getChat = async (req, res) => {
	try {
		const { guruId, studentId } = req.query;

		if (!guruId || !studentId) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'guruId and studentId are required.',
				data: null
			});
		}

		if (!isValidObjectId(guruId) || !isValidObjectId(studentId)) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Invalid guruId or studentId.',
				data: null
			});
		}

		const chat = await Chat.findOne({ guru: guruId, student: studentId })
			.populate('guru', 'username')
			.populate('student', 'username');

		if (!chat) {
			return res.status(404).json({
				success: false,
				error: true,
				message: 'No chat found between the guru and student.',
				data: null
			});
		}

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Chat retrieved successfully.',
			data: chat
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error fetching chat messages.',
			data: err.message
		});
	}
};

const deleteMessage = async (req, res) => {
	try {
		const { chatId, messageId } = req.params;

		if (!isValidObjectId(chatId) || !isValidObjectId(messageId)) {
			return res.status(400).json({
				success: false,
				error: 1,
				message: 'Invalid chatId or messageId.',
				data: null
			});
		}

		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Chat not found.',
				data: null
			});
		}

		const messageIndex = chat.messages.findIndex(msg => msg._id.toString() === messageId);
		if (messageIndex === -1) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Message not found.',
				data: null
			});
		}

		chat.messages.splice(messageIndex, 1);
		await chat.save();

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Message deleted successfully.',
			data: null
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error deleting message.',
			data: null
		});
	}
};

module.exports = {
	sendMessage,
	getChat,
	deleteMessage
};
