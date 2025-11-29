const express = require('express');
const router = express.Router();
const { loginPlayer, verifyToken } = require('../controllers/authController');

router.post('/login', loginPlayer);
router.get('/verify', verifyToken);

module.exports = router;
