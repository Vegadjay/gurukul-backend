require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const connectDB = require("./connection");

const authRouter = require("./routers/auth.router");
const guruRouter = require("./routers/guru.router");
const studentRouter = require("./routers/student.router");
const reviewRouter = require("./routers/review.router");
const contentRouter = require("./routers/content.router");
const chatRouter = require("./routers/chat.router");
const transactionRouter = require("./routers/transaction.router");
const sessionRouter = require("./routers/session.router");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
	cors: {
		origin: ["https://guruqool.vercel.app/"],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},
});

const PORT = process.env.PORT || 5000;

const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const corsOptions = {
	origin: ["https://guruqool.vercel.app/"],
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 30 * 60 * 1000, max: 200 }));
app.use("/uploads", express.static("./uploads"));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/payment/create-order", async (req, res) => {
	try {
		const { amount } = req.body;

		const options = {
			amount: amount * 100,
			currency: "INR",
			receipt: crypto.randomBytes(10).toString("hex"),
		};

		const order = await new Promise((resolve, reject) => {
			razorpay.orders.create(options, (error, order) => {
				if (error) {
					reject(error);
				} else {
					resolve(order);
				}
			});
		});

		return res.status(200).json({ success: true, data: order });
	} catch (error) {
		return res.status(500).json({ success: false, message: "Internal Server Error!" });
	}
});

io.on("connection", (socket) => {

	socket.on("joinRoom", ({ chatId }) => {
		socket.join(chatId);
	});

	socket.on("sendMessage", ({ chatId, senderId, message }) => {
		const msgData = {
			sender: senderId,
			message,
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		};
		socket.to(chatId).emit("receiveMessage", msgData);
	});
});

app.get("/", (req, res) => res.send("Welcome to Gurukul API"));
app.use("/api/auth", authRouter);
app.use("/api/guru", guruRouter);
app.use("/api/student", studentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/content", contentRouter);
app.use("/api/chat", chatRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/session", sessionRouter);

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	connectDB();
});
