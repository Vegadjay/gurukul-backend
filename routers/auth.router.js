const express = require('express');
const router = express.Router();
const { loginUser, verifyAndSendUserData } = require('../controllers/auth.controller');

router.post('/login', loginUser);
router.get('/verify', verifyAndSendUserData);

module.exports = router;
