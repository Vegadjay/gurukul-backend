const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure folder exists
const ensureDirExists = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let folder = 'uploads';

		if (file.fieldname === 'profileImage') {
			folder = 'uploads/profile';
		} else if (file.fieldname === 'contentFile') {
			folder = 'uploads/content';
		}

		ensureDirExists(folder);
		cb(null, folder);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	}
});

const fileFilter = (req, file, cb) => {
	if (file.fieldname === 'profileImage') {
		const allowedTypes = /\.(png|jpg|jpeg|svg|webp)$/i;
		if (!allowedTypes.test(path.extname(file.originalname))) {
			return cb(new Error('Only .png, .jpg, .jpeg, .svg, and .webp formats are allowed for profile image'), false);
		}
	}
	else if (file.fieldname === 'contentFile') {
		const allowedTypes = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|mp3|mp4|avi|mov|mkv|exe|zip|rar)$/i;
		if (!allowedTypes.test(path.extname(file.originalname))) {
			return cb(new Error('Only .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .mp3, .mp4, .avi, .mov, .mkv, .exe, .zip, and .rar formats are allowed for content files'), false);
		}
	}
	cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
