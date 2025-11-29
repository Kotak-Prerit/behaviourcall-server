const express = require('express');
const router = express.Router();
const {
  createPrediction,
  getPredictionsByRound,
  getPredictionByPlayer,
  markPredictionHappened
} = require('../controllers/predictionController');

router.post('/', createPrediction);
router.get('/round/:roundId', getPredictionsByRound);
router.get('/round/:roundId/player/:playerId', getPredictionByPlayer);
router.put('/:id/happened', markPredictionHappened);

module.exports = router;
