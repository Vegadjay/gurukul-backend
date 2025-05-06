const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
	guru: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Guru",
		required: true
	},
	student: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Student",
		required: true
	},
	messages: [
		{
			sender: {
				type: String,

				required: true
			},
			message: {
				type: String,
				required: true
			},
			timestamp: {
				type: Date,
				default: Date.now
			}
		}
	]
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
