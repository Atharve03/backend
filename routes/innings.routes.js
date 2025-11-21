const express = require('express');
const router = express.Router();
const Innings = require('../models/Innings');
const { protect, authorize } = require('../middleware/auth.middleware');

// Update innings (set batsmen and bowler)
router.put('/:id', protect, authorize('admin', 'scorer'), async (req, res) => {
  try {
    const innings = await Innings.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('battingTeam', 'name shortName')
      .populate('bowlingTeam', 'name shortName')
      .populate('currentBatsmen.player', 'name role')
      .populate('currentBowler.player', 'name role');
    
    if (!innings) {
      return res.status(404).json({
        success: false,
        message: 'Innings not found'
      });
    }

    res.json({ 
      success: true, 
      data: innings 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
