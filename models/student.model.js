const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 3,
		maxlength: 50,

	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		validate: {
			validator: function (v) {
				return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
			},
			message: (props) => `${props.value} is not a valid email!`,
		},
	},
	password: {
		type: String,
		required: true,
		minlength: 6,
	},
	phone: {
		type: String,
		required: true,
		unique: true,
		validate: {
			validator: function (v) {
				return /^\+\d{1,3}\d{10,13}$/.test(v);
			},
			message: (props) => `${props.value} is not a valid phone number!`
		}

	},
	address: {
		city: {
			type: String,
		},
		state: {
			type: String,
		},
		country: {
			type: String,
		},
		zipCode: {
			type: String,
		},
	},
	isOnline: {
		type: Boolean,
		default: false,
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
	languages: {
		type: [String],
	},
	enrolledGurus: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Guru',
		},
	],
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;