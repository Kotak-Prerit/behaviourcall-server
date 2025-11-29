const Player = require('../models/Player');
const Room = require('../models/Room');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Player joins global lobby
    socket.on('join-lobby', async (playerId) => {
      try {
        // Update player's socket ID
        await Player.findByIdAndUpdate(playerId, { 
          socketId: socket.id, 
          isOnline: true 
        });

        // Broadcast updated online players list
        const onlinePlayers = await Player.find({ isOnline: true }).select('_id name');
        io.emit('lobby-players-updated', onlinePlayers);

        console.log(`Player ${playerId} joined lobby`);
      } catch (error) {
        console.error('Error joining lobby:', error);
      }
    });

    // Player joins a room
    socket.on('join-room', async ({ playerId, roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() })
          .populate('hostId', 'name')
          .populate('players.playerId', 'name isOnline');

        if (!room) {
          socket.emit('room-error', { message: 'Room not found' });
          return;
        }

        // Join socket room
        socket.join(roomCode);

        // Broadcast to everyone in the room
        io.to(roomCode).emit('room-updated', room);

        console.log(`Player ${playerId} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('room-error', { message: 'Failed to join room' });
      }
    });

    // Player updates ready status
    socket.on('update-ready', async ({ roomCode, playerId, isReady }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' });
          return;
        }

        const playerIndex = room.players.findIndex(
          p => p.playerId.toString() === playerId
        );

        if (playerIndex !== -1) {
          room.players[playerIndex].isReady = isReady;
          await room.save();

          const updatedRoom = await Room.findById(room._id)
            .populate('hostId', 'name')
            .populate('players.playerId', 'name isOnline');

          io.to(roomCode).emit('room-updated', updatedRoom);

          // Check if all players are ready
          const allReady = updatedRoom.players.every(p => p.isReady);
          if (allReady && updatedRoom.players.length >= 2) {
            io.to(roomCode).emit('all-players-ready');
          }
        }
      } catch (error) {
        console.error('Error updating ready status:', error);
        socket.emit('room-error', { message: 'Failed to update ready status' });
      }
    });

    // Game phase changes
    socket.on('start-round', async ({ roomCode, roundId }) => {
      try {
        io.to(roomCode).emit('round-started', { roundId });
      } catch (error) {
        console.error('Error starting round:', error);
      }
    });

    socket.on('phase-change', async ({ roomCode, phase, roundId }) => {
      try {
        io.to(roomCode).emit('phase-updated', { phase, roundId });
      } catch (error) {
        console.error('Error changing phase:', error);
      }
    });

    // Prediction submitted
    socket.on('prediction-submitted', async ({ roomCode, playerId }) => {
      try {
        io.to(roomCode).emit('player-prediction-submitted', { playerId });
      } catch (error) {
        console.error('Error broadcasting prediction:', error);
      }
    });

    // Prediction happened
    socket.on('prediction-happened', async ({ roomCode, predictionId }) => {
      try {
        io.to(roomCode).emit('prediction-marked', { predictionId });
      } catch (error) {
        console.error('Error broadcasting prediction happened:', error);
      }
    });

    // Leave room
    socket.on('leave-room', async ({ playerId, roomCode }) => {
      try {
        socket.leave(roomCode);

        const room = await Room.findOne({ code: roomCode.toUpperCase() })
          .populate('hostId', 'name')
          .populate('players.playerId', 'name isOnline');

        if (room) {
          io.to(roomCode).emit('room-updated', room);
        }

        console.log(`Player ${playerId} left room ${roomCode}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      try {
        // Find player by socket ID and mark offline
        const player = await Player.findOne({ socketId: socket.id });
        
        if (player) {
          player.isOnline = false;
          player.socketId = null;
          await player.save();

          // Broadcast updated online players list
          const onlinePlayers = await Player.find({ isOnline: true }).select('_id name');
          io.emit('lobby-players-updated', onlinePlayers);

          console.log(`Player ${player._id} disconnected`);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

module.exports = setupSocketHandlers;
