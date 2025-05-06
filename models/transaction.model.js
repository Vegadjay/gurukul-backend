const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
	guruId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Guru',
		required: true
	},
	studentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Student',
		required: true
	},
	transactionId: {
		type: String,
		required: true,
		unique: true
	},
	date: {
		type: Date,
		default: Date.now
	},
	paidToTeacher: {
		type: Boolean,
		default: false
	},
	amount: {
		type: Number,
		required: true,
		min: 0
	}
});

module.exports = mongoose.model('Transaction', transactionSchema);
