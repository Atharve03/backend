const Team = require('../models/Team');
const Player = require('../models/Player');

// Get all teams
exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    
    // Get player count for each team
    const teamsWithCount = await Promise.all(teams.map(async (team) => {
      const playerCount = await Player.countDocuments({ team: team._id });
      return {
        ...team.toObject(),
        playerCount
      };
    }));

    res.json({
      success: true,
      count: teamsWithCount.length,
      data: teamsWithCount
    });
  } catch (error) {
    next(error);
  }
};

// Get team by ID
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get team players
    const players = await Player.find({ team: team._id }).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        players
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new team
exports.createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name or short name already exists'
      });
    }
    next(error);
  }
};

// Update team
exports.updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// Delete team
exports.deleteTeam = async (req, res, next) => {
  try {
    // Check if team has players
    const playerCount = await Player.countDocuments({ team: req.params.id });
    
    if (playerCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team with players. Please delete or reassign players first.'
      });
    }

    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
