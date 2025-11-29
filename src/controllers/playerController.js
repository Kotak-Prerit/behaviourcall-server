const Player = require('../models/Player');

// @desc    Create a new player (guest)
// @route   POST /api/players
// @access  Public
const createPlayer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const player = await Player.create({ name });
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all online players
// @route   GET /api/players/online
// @access  Public
const getOnlinePlayers = async (req, res) => {
  try {
    const players = await Player.find({ isOnline: true }).select('-__v');
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all players
// @route   GET /api/players
// @access  Public
const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().select('-__v').sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get player by ID
// @route   GET /api/players/:id
// @access  Public
const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update player status
// @route   PUT /api/players/:id
// @access  Public
const updatePlayer = async (req, res) => {
  try {
    const { socketId, isOnline, currentRoomId } = req.body;
    
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { socketId, isOnline, currentRoomId },
      { new: true, runValidators: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Public
const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json({ message: 'Player removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPlayer,
  getAllPlayers,
  getOnlinePlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer
};
