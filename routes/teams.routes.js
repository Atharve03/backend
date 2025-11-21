const express = require('express');
const router = express.Router();
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teamscontroller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(getAllTeams)
  .post(protect, authorize('admin', 'scorer'), createTeam);

router.route('/:id')
  .get(getTeamById)
  .put(protect, authorize('admin', 'scorer'), updateTeam)
  .delete(protect, authorize('admin'), deleteTeam);

module.exports = router;
