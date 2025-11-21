const Player = require('../models/Player');

// Get all players
exports.getAllPlayers = async (req, res, next) => {
  try {
    const players = await Player.find()
      .populate('team', 'name shortName')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// Get players by team
exports.getPlayersByTeam = async (req, res, next) => {
  try {
    const players = await Player.find({ team: req.params.teamId })
      .populate('team', 'name shortName')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// Get player statistics
exports.getPlayerStats = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'name shortName');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

// Create new player
exports.createPlayer = async (req, res, next) => {
  try {
    const player = await Player.create(req.body);
    await player.populate('team', 'name shortName');

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: player
    });
  } catch (error) {
    next(error);
  }
};

// Update player
exports.updatePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('team', 'name shortName');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      message: 'Player updated successfully',
      data: player
    });
  } catch (error) {
    next(error);
  }
};

// Delete player
exports.deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
