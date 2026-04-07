const express = require('express');
const router = express.Router();
const { createRoom, getRooms, getRoomById, saveVersion, getVersions } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRoom);
router.get('/', protect, getRooms);
router.get('/:roomId', protect, getRoomById);
router.post('/:roomId/save', protect, saveVersion);
router.get('/:roomId/versions', protect, getVersions);

module.exports = router;