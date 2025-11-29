const Room = require('../models/Room');
const Player = require('../models/Player');

// Generate random 6-character room code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Public
const createRoom = async (req, res) => {
  try {
    const { hostId } = req.body;

    if (!hostId) {
      return res.status(400).json({ message: 'Host ID is required' });
    }

    const host = await Player.findById(hostId);
    if (!host) {
      return res.status(404).json({ message: 'Host player not found' });
    }

    let code = generateRoomCode();
    let existingRoom = await Room.findOne({ code });

    // Ensure unique code
    while (existingRoom) {
      code = generateRoomCode();
      existingRoom = await Room.findOne({ code });
    }

    const room = await Room.create({
      code,
      hostId,
      players: [{ playerId: hostId, isReady: false }]
    });

    // Update player's current room
    await Player.findByIdAndUpdate(hostId, { currentRoomId: room._id });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get room by code
// @route   GET /api/rooms/:code
// @access  Public
const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('hostId', 'name')
      .populate('players.playerId', 'name isOnline');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a room
// @route   POST /api/rooms/:code/join
// @access  Public
const joinRoom = async (req, res) => {
  try {
    const { playerId } = req.body;
    const code = req.params.code.toUpperCase();

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Room is not accepting new players' });
    }

    const alreadyInRoom = room.players.some(p => p.playerId.toString() === playerId);
    if (alreadyInRoom) {
      return res.status(400).json({ message: 'Player already in room' });
    }

    room.players.push({ playerId, isReady: false });
    await room.save();

    // Update player's current room
    await Player.findByIdAndUpdate(playerId, { currentRoomId: room._id });

    const updatedRoom = await Room.findById(room._id)
      .populate('hostId', 'name')
      .populate('players.playerId', 'name isOnline');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update player ready status
// @route   PUT /api/rooms/:code/ready
// @access  Public
const updateReadyStatus = async (req, res) => {
  try {
    const { playerId, isReady } = req.body;
    const code = req.params.code.toUpperCase();

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const playerIndex = room.players.findIndex(p => p.playerId.toString() === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not in room' });
    }

    room.players[playerIndex].isReady = isReady;
    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('hostId', 'name')
      .populate('players.playerId', 'name isOnline');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave room
// @route   POST /api/rooms/:code/leave
// @access  Public
const leaveRoom = async (req, res) => {
  try {
    const { playerId } = req.body;
    const code = req.params.code.toUpperCase();

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.players = room.players.filter(p => p.playerId.toString() !== playerId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      await Room.findByIdAndDelete(room._id);
      await Player.findByIdAndUpdate(playerId, { currentRoomId: null });
      return res.json({ message: 'Room closed' });
    }

    // If host left, assign new host
    if (room.hostId.toString() === playerId) {
      room.hostId = room.players[0].playerId;
    }

    await room.save();
    await Player.findByIdAndUpdate(playerId, { currentRoomId: null });

    const updatedRoom = await Room.findById(room._id)
      .populate('hostId', 'name')
      .populate('players.playerId', 'name isOnline');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoom,
  getRoomByCode,
  joinRoom,
  updateReadyStatus,
  leaveRoom
};
