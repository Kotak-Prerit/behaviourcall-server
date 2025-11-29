const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  currentRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: 'avatar1.webp'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', playerSchema);
