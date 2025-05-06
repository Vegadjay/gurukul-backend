const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
	const token = req.cookies.jwt || req.header("Authorization")?.replace("Bearer ", "");

	if (!token) {
		return res.json({ msg: "Token not found", success: false, temp: req.cookies });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		return res.json({ msg: "Invalid Token", success: false });
	}
};
module.exports = auth;