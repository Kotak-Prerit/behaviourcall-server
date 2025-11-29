const Prediction = require('../models/Prediction');

// @desc    Create a new prediction
// @route   POST /api/predictions
// @access  Public
const createPrediction = async (req, res) => {
  try {
    const { roundId, predictorId, targetId, text } = req.body;

    if (!roundId || !predictorId || !targetId || !text) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const prediction = await Prediction.create({
      roundId,
      predictorId,
      targetId,
      text
    });

    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get predictions by round
// @route   GET /api/predictions/round/:roundId
// @access  Public
const getPredictionsByRound = async (req, res) => {
  try {
    const predictions = await Prediction.find({ roundId: req.params.roundId })
      .populate('predictorId', 'name')
      .populate('targetId', 'name');

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prediction by player in a round
// @route   GET /api/predictions/round/:roundId/player/:playerId
// @access  Public
const getPredictionByPlayer = async (req, res) => {
  try {
    const { roundId, playerId } = req.params;

    const prediction = await Prediction.findOne({
      roundId,
      predictorId: playerId
    })
      .populate('predictorId', 'name')
      .populate('targetId', 'name');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark prediction as happened
// @route   PUT /api/predictions/:id/happened
// @access  Public
const markPredictionHappened = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('roundId')
      .populate('predictorId', 'name score');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    const Round = require('../models/Round');
    const Player = require('../models/Player');
    
    const round = await Round.findById(prediction.roundId);
    
    // Check if someone already won this round
    if (round.winnerId) {
      return res.status(400).json({ 
        message: 'Game already won by another player',
        isWinner: false,
        winnerId: round.winnerId
      });
    }

    // Mark this player as winner
    round.winnerId = prediction.predictorId._id;
    round.completedAt = new Date();
    round.phase = 'completed';
    await round.save();

    // Award points to the player
    const player = await Player.findById(prediction.predictorId._id);
    player.score += 10;
    await player.save();

    // Mark prediction as happened
    prediction.happened = true;
    prediction.points = 10;
    await prediction.save();

    // Emit socket event to notify all players
    const Room = require('../models/Room');
    const room = await Room.findById(round.roomId);
    const io = req.app.get('io');
    if (io && room) {
      io.to(room.code).emit('round-won', { 
        winnerId: player._id,
        winnerName: player.name,
        roundId: round._id
      });
    }

    res.json({
      ...prediction.toObject(),
      isWinner: true,
      totalScore: player.score
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPrediction,
  getPredictionsByRound,
  getPredictionByPlayer,
  markPredictionHappened
};
