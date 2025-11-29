const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  players: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    isReady: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'finished'],
    default: 'waiting'
  },
  currentRoundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
