const Content = require('../models/content.model');
const fs = require('fs');
const path = require('path');

const createContent = async (req, res) => {
	try {
		const { guru, title, description } = req.body;
		const file = req.file;

		if (!guru || !title || !file) {
			return res.status(400).json({ success: false, message: 'Guru, title, and file are required.' });
		}

		const content = new Content({
			guru,
			title,
			description,
			file: file.path,
			size: Math.round((file.size / 1024) * 100) / 100, // Keep only 2 decimal places
		});

		await content.save();

		res.status(201).json({ success: true, message: 'Content created successfully.', data: content });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error creating content.', error: err });
	}
};

const getContentByGuru = async (req, res) => {
	try {
		const guruId = req.params.guruId;
		const contents = await Content.find({ guru: guruId });

		if (!contents || contents.length === 0) {
			return res.status(404).json({ success: false, message: 'No content found for this guru.' });
		}

		res.status(200).json({ success: true, data: contents });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error fetching content.', error: err });
	}
};

const getContentById = async (req, res) => {
	try {
		const contentId = req.params.id;
		const content = await Content.findById(contentId);

		if (!content) {
			return res.status(404).json({ success: false, message: 'Content not found.' });
		}

		res.status(200).json({ success: true, data: content });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error fetching content.', error: err });
	}
};

const updateContent = async (req, res) => {
	try {
		const contentId = req.params.id;
		const { title, description } = req.body;
		const file = req.file;

		const content = await Content.findById(contentId);
		if (!content) {
			return res.status(404).json({ success: false, message: 'Content not found.' });
		}

		if (title) content.title = title;
		if (description) content.description = description;
		if (file) {
			// Remove the old file if it exists
			const oldFilePath = path.join(__dirname, '..', content.file);
			if (fs.existsSync(oldFilePath)) {
				fs.unlinkSync(oldFilePath);
			}

			content.file = file.path;
			content.size = Math.round((file.size / 1024) * 100) / 100; // Keep only 2 decimal places
		}

		await content.save();

		res.status(200).json({ success: true, message: 'Content updated successfully.', data: content });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error updating content.', error: err });
	}
};

const deleteContent = async (req, res) => {
	try {
		const contentId = req.params.id;

		const content = await Content.findById(contentId);
		if (!content) {
			return res.status(404).json({ success: false, message: 'Content not found.' });
		}

		const filePath = path.join(__dirname, '..', content.file);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		await content.deleteOne();
		res.status(200).json({ success: true, message: 'Content deleted successfully.' });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error deleting content.', error: err });
	}
};

module.exports = {
	createContent,
	getContentByGuru,
	getContentById,
	updateContent,
	deleteContent,
};
