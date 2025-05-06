const Session = require("../models/sessions.model");
const Transaction = require("../models/transaction.model");
const Student = require("../models/student.model");

const getAllSessions = async (req, res) => {
	try {
		const items = await Session.find().populate('guru', 'username').populate('student', 'username');
		res.status(200).json({ error: 0, data: items, message: "Fetched all sessions" });
	} catch (err) {
		res.status(500).json({ error: 1, data: null, message: "Failed to fetch sessions" });
	}
};

const getSessionById = async (req, res) => {
	try {
		const item = await Session.findById(req.params.id);
		if (!item) {
			return res.status(404).json({ error: "Session not found", data: null, message: "No data found" });
		}
		res.status(200).json({ error: 0, data: item, message: "Fetched session by ID" });
	} catch (err) {
		res.status(500).json({ error: 1, data: null, message: "Failed to fetch session" });
	}
};

const createSession = async (req, res) => {
	try {
		const transactionId = "TXN" + Math.floor(Math.random() * 1000001);

		const data = new Session(req.body);
		await data.save();

		const { guru, student, price } = req.body;
		const studentData = await Student.findById(student);
		if (!student) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: "Student not found",
				data: null,
			});
		}
		const transaction = new Transaction({
			guruId: guru,
			studentId: student,
			transactionId,
			date: new Date(),
			paidToTeacher: false,
			amount: price
		});

		if (!studentData.enrolledGurus.includes(guru)) {
			studentData.enrolledGurus.push(guru);
			await studentData.save();
		}
		await transaction.save();

		res.status(201).json({ error: 0, data: data, message: "Session created successfully" });
	} catch (err) {
		res.status(400).json({ error: 1, data: null, message: "Failed to create session" });
	}
};

const updateSession = async (req, res) => {
	try {
		const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!updated) {
			return res.status(404).json({ error: "Session not found", data: null, message: "Update failed" });
		}
		res.status(200).json({ error: 0, data: updated, message: "Session updated successfully" });
	} catch (err) {
		res.status(400).json({ error: 1, data: null, message: "Failed to update session" });
	}
};

const deleteSession = async (req, res) => {
	try {
		const deleted = await Session.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Session not found", data: null, message: "Delete failed" });
		}
		res.status(200).json({ error: 0, data: deleted, message: "Session deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: 1, data: null, message: "Failed to delete session" });
	}
};

const makeSessionComplete = async (req, res) => {
	try {
		let item = await Session.findById(req.params.id);
		if (!item) {
			return res.status(404).json({ error: "Session not found", data: null, message: "No data found" });
		}
		item.status = "completed";
		item.save();
		res.status(200).json({ error: 0, data: item, message: "session updated to 'completed'" });
	} catch (err) {
		res.status(500).json({ error: 1, data: null, message: "Failed to fetch session" });
	}
};


module.exports = {
	getAllSessions,
	getSessionById,
	createSession,
	updateSession,
	deleteSession,
	makeSessionComplete
};
