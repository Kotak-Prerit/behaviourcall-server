require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const playerRoutes = require('./routes/playerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roundRoutes = require('./routes/roundRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const setupSocketHandlers = require('./sockets/gameHandlers');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://behaviourcall.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/predictions', predictionRoutes);

// Setup Socket.io handlers
setupSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
