const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guru.controller');
const upload = require('../multer/storage');

router.post('/', upload.single('profileImage'), guruController.createGuru);
router.get('/', guruController.getAllGurus);
router.get('/:id', guruController.getGuruById);
router.put('/:id', guruController.updateGuru);
router.put('/:id/profile-image', upload.single('profileImage'), guruController.updateProfileImage);
router.delete('/:id', guruController.deleteGuru);
router.post('/transfer-payment', guruController.handlePaymentTransfer);
router.post('/add-payment', guruController.handlePaymentAdd);
router.get('/online/:id', guruController.setOnlineGurus);
router.get('/offline/:id', guruController.setOfflineGurus);
router.get('/stats/:id', guruController.getStats);
router.get('/verify/:id', guruController.verifyGuru)

module.exports = router;
