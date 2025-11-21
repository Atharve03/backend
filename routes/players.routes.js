const express = require('express');
const router = express.Router();
const {
  getAllPlayers,
  getPlayersByTeam,
  getPlayerStats,
  createPlayer,
  updatePlayer,
  deletePlayer
} = require('../controllers/playerscontroller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(getAllPlayers)
  .post(protect, authorize('admin', 'scorer'), createPlayer);

router.get('/team/:teamId', getPlayersByTeam);
router.get('/:id/stats', getPlayerStats);

router.route('/:id')
  .put(protect, authorize('admin', 'scorer'), updatePlayer)
  .delete(protect, authorize('admin'), deletePlayer);

module.exports = router;
