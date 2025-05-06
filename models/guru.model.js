
const mongoose = require('mongoose');

const GuruSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 3,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true
	},
	phone: {
		type: String,
		required: true,
	},
	address: {
		city: {
			type: String,
			required: true,
		},
		state: {
			type: String,
			required: true,
		},
		country: {
			type: String,
			required: true,
		},
		zipCode: {
			type: String,
			required: true,
		},
	},
	profileImage: {
		type: String,
	},
	aboutMe: {
		type: String,
		maxlength: 500,
		validate: {
			validator: function (v) {
				return v && v.length <= 500;
			},
			message: 'About Me must not exceed 500 characters.',
		},
	},
	teachingMode: {
		type: String,
		enum: ['Online', 'Offline', 'Hybrid']
	},
	skills: [String],
	education: [{
		degree: String,
		instituionName: String,
		startDate: String,
		endDate: String,
	}],
	experience: Number,
	languages: [String],
	socialLinks: [{
		platform: String,
		link: String,
	}],
	isOnline: {
		type: Boolean,
		default: false,
	},
	verified: {
		type: Boolean,
		default: false,
	},
	role: {
		type: String,
		enum: ['guru', 'admin'],
		default: 'guru',
	},
	earnings: {
		type: Number,
		default: 0,
		min: 0
	},
	rating: {
		type: Number,
		default: 0,
		min: 0,
		max: 5
	},
	availableTimes: [{
		day: {
			type: String,
			enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		},
		time: {
			type: String
		}
	}],
	category: String,
	perHourRate: {
		type: Number
	}
}, { timestamps: true });

const Guru = mongoose.model('Guru', GuruSchema);

module.exports = Guru;