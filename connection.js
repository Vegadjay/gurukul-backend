const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = () => {
	return new Promise((resolve, reject) => {
		mongoose
			.connect(process.env.MONGO_URI || "")
			.then(() => {
				console.log("MongoDB connected successfully");
				resolve();
			})
			.catch((error) => {
				console.error("MongoDB connection failed:", error.message);
				reject(error);
			});
	});
};

module.exports = connectDB;