const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  roundNumber: {
    type: Number,
    required: true,
    default: 1
  },
  assignments: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  }],
  phase: {
    type: String,
    enum: ['prediction', 'observation', 'reveal', 'completed'],
    default: 'prediction'
  },
  observationStartTime: {
    type: Date,
    default: null
  },
  observationDuration: {
    type: Number,
    default: 300000 // 5 minutes in milliseconds
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Round', roundSchema);
