const Round = require('../models/Round');
const Room = require('../models/Room');

// Shuffle array helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// @desc    Create a new round
// @route   POST /api/rounds
// @access  Public
const createRound = async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get last round number
    const lastRound = await Round.findOne({ roomId }).sort({ roundNumber: -1 });
    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    // Create assignments (each player gets a unique target, not themselves)
    const playerIds = room.players.map(p => p.playerId);
    
    // For even number of players, ensure everyone gets a unique target
    // Use a derangement algorithm - shift everyone by 1
    const assignments = playerIds.map((playerId, index) => {
      const targetIndex = (index + 1) % playerIds.length;
      return {
        playerId,
        targetId: playerIds[targetIndex]
      };
    });

    const round = await Round.create({
      roomId,
      roundNumber,
      assignments,
      phase: 'prediction'
    });

    // Update room status
    room.status = 'in-progress';
    room.currentRoundId = round._id;
    await room.save();

    res.status(201).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get round by ID
// @route   GET /api/rounds/:id
// @access  Public
const getRoundById = async (req, res) => {
  try {
    const round = await Round.findById(req.params.id)
      .populate('roomId', 'code')
      .populate('assignments.playerId', 'name')
      .populate('assignments.targetId', 'name');

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    res.json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update round phase
// @route   PUT /api/rounds/:id/phase
// @access  Public
const updateRoundPhase = async (req, res) => {
  try {
    const { phase } = req.body;
    
    const round = await Round.findById(req.params.id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    round.phase = phase;
    
    // If moving to observation phase, set start time
    if (phase === 'observation') {
      round.observationStartTime = new Date();
    }

    await round.save();

    const updatedRound = await Round.findById(round._id)
      .populate('assignments.playerId', 'name')
      .populate('assignments.targetId', 'name');

    res.json(updatedRound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRound,
  getRoundById,
  updateRoundPhase
};
