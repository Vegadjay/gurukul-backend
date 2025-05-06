const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
	student: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Student',
		required: true,
	},
	guru: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Guru',
		required: true,
	},
	rating: {
		type: Number,
		min: 1,
		max: 5,
		required: true,
	},
	comment: {
		type: String,
		maxlength: 1000,
	}
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
