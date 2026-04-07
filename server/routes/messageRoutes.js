const express = require('express');
const router = express.Router();
const { getRoomMessages, saveMessage, markMessagesSeen } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:roomId', protect, getRoomMessages);
router.post('/:roomId', protect, saveMessage);
router.post('/:roomId/seen', protect, markMessagesSeen);

module.exports = router;