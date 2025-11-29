const express = require('express');
const router = express.Router();
const {
  createRound,
  getRoundById,
  updateRoundPhase
} = require('../controllers/roundController');

router.post('/', createRound);
router.get('/:id', getRoundById);
router.put('/:id/phase', updateRoundPhase);

module.exports = router;
