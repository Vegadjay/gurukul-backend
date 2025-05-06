const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
	guru: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Gurus',
		required: true,
	},
	title: {
		type: String,
		required: true,
		maxlength: 100,
	},
	description: {
		type: String,
		maxlength: 500,
	},
	file: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
	},
},{timestamps: true});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
