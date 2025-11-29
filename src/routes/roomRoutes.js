const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoomByCode,
  joinRoom,
  updateReadyStatus,
  leaveRoom
} = require('../controllers/roomController');

router.post('/', createRoom);
router.get('/:code', getRoomByCode);
router.post('/:code/join', joinRoom);
router.put('/:code/ready', updateReadyStatus);
router.post('/:code/leave', leaveRoom);

module.exports = router;
