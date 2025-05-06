const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
	guru: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Guru",
		required: true,
	},
	student: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Student",
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	time: {
		type: String,
		required: true,
	},
	duration: {
		type: Number,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		enum: ["completed", "pending"],
		default: "pending",
	},
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
