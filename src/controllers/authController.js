const jwt = require('jsonwebtoken');
const Player = require('../models/Player');

// @desc    Login or register a player
// @route   POST /api/auth/login
// @access  Public
const loginPlayer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if name already exists and is online (duplicate prevention)
    const existingOnlinePlayer = await Player.findOne({ 
      name: name.trim(), 
      isOnline: true 
    });
    
    if (existingOnlinePlayer) {
      return res.status(400).json({ 
        message: 'This username is already taken. Please choose a different name.' 
      });
    }

    // Find or create player
    let player = await Player.findOne({ name: name.trim() });
    
    if (!player) {
      player = await Player.create({ name: name.trim(), isOnline: true });
    } else {
      player.isOnline = true;
      await player.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        playerId: player._id,
        name: player.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      player: {
        _id: player._id,
        name: player.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Public
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const player = await Player.findById(decoded.playerId);

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json({
      player: {
        _id: player._id,
        name: player.name
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  loginPlayer,
  verifyToken
};
