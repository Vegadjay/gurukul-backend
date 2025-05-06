const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.post('/message', chatController.sendMessage);
router.get('/getchat', chatController.getChat);
router.delete('/delete/:chatId/:messageId', chatController.deleteMessage);

module.exports = router;
