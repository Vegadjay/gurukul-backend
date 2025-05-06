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

const allowedOrigins = ["http://localhost:8081", "https://guruqool.vercel.app"];

const corsOptions = {
	origin: function (origin, callback) {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use("/uploads", express.static("./uploads"));
app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
	next();
});

const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/api/payment/create-order", async (req, res) => {
	try {
		const { amount } = req.body;

		const options = {
			amount: amount * 100, // Razorpay expects amount in paise
			currency: "INR",
			receipt: crypto.randomBytes(10).toString("hex"),
		};

		const order = await razorpay.orders.create(options);
		return res.status(200).json({ success: true, data: order });
	} catch (error) {
		console.error("Order creation error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error!" });
	}
});

const io = socketIO(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	},
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

	socket.on("disconnect", () => {
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	connectDB();
});
