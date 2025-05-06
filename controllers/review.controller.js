const Review = require('../models/review.model');
const Guru = require('../models/guru.model');
const Student = require('../models/student.model');
const Session = require("../models/sessions.model");

const validateReview = async ({ student, guru, rating }) => {
	if (!student || !guru || !rating) return 'Student, Guru, and Rating are required.';

	if (rating < 0 || rating > 5) return 'Rating must be between 1 and 5.';

	const [studentExists, guruExists] = await Promise.all([
		Student.findById(student),
		Guru.findById(guru)
	]);

	if (!studentExists) return 'Student not found.';
	if (!guruExists) return 'Guru not found.';

	return null;
};

const createReview = async (req, res) => {
	const { student, guru, rating, comment } = req.body;
	try {
		const error = await validateReview({ student, guru, rating });
		if (error) return res.status(400).json({ success: false, error: 1, message: error, data: null });
		
		let isValidUser = await Session.findOne({
			guru:guru,
			student:student,
			status:"completed"
		})

		if (!isValidUser){
			return res.status(403).json({
				success: false,
				error: 1,
				message: 'Review can only be submitted after completing a session with the guru',
				data: null,
			});
		}

		let dbguru = await Guru.findById(guru);
		if (!dbguru) {
			return res.status(404).json({
				success: false,
				error: 1,
				message: 'Guru not found',
				data: null,
			});
		}

		const review = new Review({ student, guru, rating, comment });
		const savedReview = await review.save();

		// guru have a field names "rating" so make average with rating came from body
		const avgRev = parseInt(dbguru?.rating + rating) / 2;
		dbguru.rating = avgRev;
		await dbguru.save();

		return res.status(201).json({
			success: true,
			error: 0,
			message: 'Review submitted successfully',
			data: savedReview,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			error: 1,
			message: 'Failed to create review',
			data: null,
		});
	}
};

const getAllReviews = async (req, res) => {
	try {
		const reviews = await Review.find()
			.populate('student', 'username')
			.populate('guru', 'username');

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Reviews fetched successfully',
			data: reviews,
		});
	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: 'Error fetching reviews', data: null });
	}
};

const getReviewsByGuruId = async (req, res) => {
	const guruId = req.params.guruId;
	try {
		const reviews = await Review.find({ guru: guruId })
			.populate('student', 'username');

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Reviews for guru fetched',
			data: reviews,
		});
	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: 'Error fetching guru reviews', data: null });
	}
};

const getReviewsByStudentId = async (req, res) => {
	const studentId = req.params.studentId;
	try {
		const reviews = await Review.find({ student: studentId })
			.populate('guru', 'username');

		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Student reviews fetched',
			data: reviews,
		});
	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: 'Error fetching student reviews', data: null });
	}
};

const updateReview = async (req, res) => {
	const id = req.params.id;
	const { rating, comment } = req.body;
	try {
		const review = await Review.findById(id);
		if (!review) {
			return res.status(404).json({ success: false, error: 1, message: 'Review not found' });
		}
		if (rating) review.rating = rating;
		if (comment) review.comment = comment;
		const updatedReview = await review.save();
		return res.status(200).json({
			success: true,
			error: 0,
			message: 'Review updated successfully',
			data: updatedReview,
		});

	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: 'Error updating review' });
	}
}

const deleteReview = async (req, res) => {
	const id = req.params.id;
	try {
		const deleted = await Review.findByIdAndDelete(id);
		if (!deleted) {
			return res.status(404).json({ success: false, error: 1, message: 'Review not found' });
		}
		return res.status(200).json({ success: true, error: 0, message: 'Review deleted successfully' });
	} catch (err) {
		return res.status(500).json({ success: false, error: 1, message: 'Error deleting review' });
	}
};

module.exports = {
	createReview,
	getAllReviews,
	getReviewsByGuruId,
	getReviewsByStudentId,
	deleteReview,
	updateReview
};
