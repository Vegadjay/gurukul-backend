const Transaction = require('../models/transaction.model');
const mongoose = require('mongoose');
const Razorpay = require("razorpay");
const crypto = require("crypto");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createTransaction = async (req, res) => {
	const { guruId, studentId, transactionId, date, amount } = req.body;

	if (!guruId || !isValidObjectId(guruId)) {
		return res.status(400).json({
			message: 'Invalid or missing guruId',
			error: 1,
			data: null,
		});
	}

	if (!studentId || !isValidObjectId(studentId)) {
		return res.status(400).json({
			message: 'Invalid or missing studentId',
			error: 1,
			data: null,
		});
	}

	if (!transactionId || typeof transactionId !== 'string') {
		return res.status(400).json({
			message: 'Invalid or missing transactionId',
			error: 1,
			data: null,
		});
	}

	if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
		return res.status(400).json({
			message: 'Invalid or missing amount',
			error: 1,
			data: null,
		});
	}

	try {
		const existing = await Transaction.findOne({ transactionId });
		if (existing) {
			return res.status(409).json({
				success: false,
				message: 'Transaction ID already exists',
				error: 1,
				data: null,
			});
		}

		const transaction = new Transaction({
			guruId,
			studentId,
			transactionId,
			date: date ? new Date(date) : undefined,
			amount
		});

		const saved = await transaction.save();
		return res.status(201).json({
			success: true,
			message: 'Transaction created successfully',
			error: 0,
			data: saved,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Error creating transaction',
			error: 1,
			data: null,
		});
	}
};

const getAllTransactions = async (req, res) => {
	try {
		const transactions = await Transaction.find()
			.populate('guruId', 'username')
			.populate('studentId', 'username');
		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Transactions fetched successfully',
			data: transactions,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Error fetching transactions',
			data: null,
		});
	}
}

const makeTransactionToTeacher = async (req, res) => {
	const id = req.params.id;
	try {

		if (!isValidObjectId(id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid or missing transaction ID',
				error: 1,
				data: null,
			});
		}

		const transaction = await Transaction.findById(id);
		if (!transaction) {
			return res.status(404).json({
				success: false,
				message: 'Transaction not found',
				error: 1,
				data: null,
			});
		}

		const amount = transaction.amount;

		const options = {
			amount: amount,
			currency: "INR",
			receipt: crypto.randomBytes(10).toString("hex"),
		};

		const razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});

		const order = await new Promise((resolve, reject) => {
			razorpay.orders.create(options, (error, order) => {
				if (error) {
					reject(error);
				} else {
					resolve(order);
				}
			});
		});
		if (order) {
			return res.status(200).json({
				success: true,
				message: 'Transaction order created successfully',
				error: 0,
				data: order,
			});
		} else {
			return res.status(500).json({
				success: false,
				message: 'Failed to create transaction order',
				error: 1,
				data: null,
			});
		}
	}
	catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Error processing transaction',
			error: 1,
			data: null,
		});
	}
}

module.exports = {
	createTransaction,
	getAllTransactions,
	makeTransactionToTeacher
}