const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getMatchById,
  createMatch,
  startMatch,
  updateScore,
  endInnings,
  getLiveMatch
} = require('../controllers/matchesController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(getAllMatches)
  .post(protect, authorize('admin', 'scorer'), createMatch);

router.get('/:id/live', getLiveMatch);
router.post('/:id/start', protect, authorize('admin', 'scorer'), startMatch);
router.post('/:id/score', protect, authorize('admin', 'scorer'), updateScore);
router.post('/:id/end-innings', protect, authorize('admin', 'scorer'), endInnings);

router.route('/:id')
  .get(getMatchById);

module.exports = router;
