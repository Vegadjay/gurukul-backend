const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const upload = require('../multer/storage');

router.post('/', upload.single('contentFile'), contentController.createContent);
router.get('/guru/:guruId', contentController.getContentByGuru);
router.get('/:id', contentController.getContentById);
router.put('/:id', upload.single('contentFile'), contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

module.exports = router;
