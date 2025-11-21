const Match = require('../models/Match');
const Innings = require('../models/Innings');
const BallByBall = require('../models/BallByBall');
const Team = require('../models/Team');
const Player = require('../models/Player');

// Get all matches
exports.getAllMatches = async (req, res, next) => {
  try {
    const matches = await Match.find()
      .populate('team1', 'name shortName')
      .populate('team2', 'name shortName')
      .populate('winner', 'name shortName')
      .sort({ matchDate: -1 });

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// Get match by ID
exports.getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('team1', 'name shortName')
      .populate('team2', 'name shortName')
      .populate('winner', 'name shortName')
      .populate('tossWinner', 'name shortName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get innings data
    const innings = await Innings.find({ match: match._id })
      .populate('battingTeam', 'name shortName')
      .populate('bowlingTeam', 'name shortName')
      .populate('currentBatsmen.player', 'name')
      .populate('currentBowler.player', 'name')
      .sort({ inningsNumber: 1 });

    res.json({
      success: true,
      data: {
        ...match.toObject(),
        innings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new match
exports.createMatch = async (req, res, next) => {
  try {
    const { team1, team2, venue, matchDate, matchType, oversPerInnings } = req.body;

    // Validate teams exist
    const team1Exists = await Team.findById(team1);
    const team2Exists = await Team.findById(team2);

    if (!team1Exists || !team2Exists) {
      return res.status(400).json({
        success: false,
        message: 'One or both teams not found'
      });
    }

    // Create match
    const match = await Match.create({
      team1,
      team2,
      venue,
      matchDate,
      matchType,
      oversPerInnings
    });

    // Create innings documents
    await Innings.create([
      {
        match: match._id,
        battingTeam: team1,
        bowlingTeam: team2,
        inningsNumber: 1
      },
      {
        match: match._id,
        battingTeam: team2,
        bowlingTeam: team1,
        inningsNumber: 2
      }
    ]);

    await match.populate(['team1', 'team2'], 'name shortName');

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// Start match
exports.startMatch = async (req, res, next) => {
  try {
    const { tossWinner, tossDecision } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        status: 'live',
        tossWinner,
        tossDecision,
        currentInnings: 1
      },
      { new: true }
    ).populate(['team1', 'team2', 'tossWinner'], 'name shortName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Update first innings status
    await Innings.findOneAndUpdate(
      { match: match._id, inningsNumber: 1 },
      { status: 'in_progress' }
    );

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('match-started', match);

    res.json({
      success: true,
      message: 'Match started successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// Update score
// Update score
// ✅ COMPLETE FIXED UPDATE SCORE FUNCTION
exports.updateScore = async (req, res, next) => {
  try {
    const { 
      inningsId, 
      striker, 
      nonStriker, 
      bowler, 
      runs, 
      extras, 
      extraType, 
      wicket, 
      dismissalType 
    } = req.body;

    console.log('📊 Updating score:', { striker, bowler, runs, wicket }); // ✅ DEBUG

    const innings = await Innings.findById(inningsId);
    if (!innings) {
      return res.status(404).json({
        success: false,
        message: 'Innings not found'
      });
    }

    // Check if innings is already over (10 wickets)
    if (innings.totalWickets >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Innings already over - 10 wickets have fallen'
      });
    }

    // Calculate ball details
    const overNumber = Math.floor(innings.totalBalls / 6) + 1;
    const ballNumber = (innings.totalBalls % 6) + 1;

    // Create ball-by-ball record
    await BallByBall.create({
      innings: inningsId,
      overNumber,
      ballNumber,
      striker,
      nonStriker,
      bowler,
      runsScored: runs,
      extras,
      extraType,
      wicketTaken: wicket,
      dismissalType,
      commentary: `${runs} runs scored`
    });

    // Update innings totals
    const totalRuns = runs + extras;
    const ballsToAdd = (extraType === 'wide' || extraType === 'noball') ? 0 : 1;

    innings.totalRuns += totalRuns;
    innings.totalBalls += ballsToAdd;
    innings.extras += extras;
    
    if (wicket) {
      innings.totalWickets += 1;
    }

    // Calculate run rate
    if (innings.totalBalls > 0) {
      innings.currentRunRate = (innings.totalRuns / innings.totalBalls) * 6;
    }

    // ✅ UPDATE CURRENT BATSMEN STATS
    if (innings.currentBatsmen && innings.currentBatsmen.length > 0) {
      const strikerBatsman = innings.currentBatsmen.find(b => b.isOnStrike);
      
      if (strikerBatsman) {
        strikerBatsman.runs = (strikerBatsman.runs || 0) + runs;
        strikerBatsman.balls = (strikerBatsman.balls || 0) + ballsToAdd;
        
        if (runs === 4) {
          strikerBatsman.fours = (strikerBatsman.fours || 0) + 1;
        } else if (runs === 6) {
          strikerBatsman.sixes = (strikerBatsman.sixes || 0) + 1;
        }
      }
    }

    // ✅ UPDATE CURRENT BOWLER STATS
    if (innings.currentBowler) {
      innings.currentBowler.balls = (innings.currentBowler.balls || 0) + ballsToAdd;
      innings.currentBowler.runs = (innings.currentBowler.runs || 0) + totalRuns;
      
      if (wicket) {
        innings.currentBowler.wickets = (innings.currentBowler.wickets || 0) + 1;
      }
    }

    await innings.save();

    // ✅ UPDATE PLAYER STATS IN DATABASE
    // Update striker batting stats
    if (striker) {
      const strikerUpdate = {
        $inc: {
          'stats.matchesPlayed': 1,
          'stats.totalBalls': ballsToAdd,
          'stats.totalRuns': runs
        }
      };

      // Add fours and sixes
      if (runs === 4) {
        strikerUpdate.$inc['stats.fours'] = 1;
      } else if (runs === 6) {
        strikerUpdate.$inc['stats.sixes'] = 1;
      }

      await Player.findByIdAndUpdate(striker, strikerUpdate);

      // ✅ Recalculate striker averages
      const strikerData = await Player.findById(striker);
      if (strikerData && strikerData.stats.totalBalls > 0) {
        strikerData.stats.battingAverage = strikerData.stats.totalRuns / strikerData.stats.totalBalls;
        strikerData.stats.strikeRate = (strikerData.stats.totalRuns / strikerData.stats.totalBalls) * 100;
        await strikerData.save();
      }

      console.log(`✅ Updated ${strikerData.name}: ${strikerData.stats.totalRuns} runs`);
    }

    // ✅ Update bowler bowling stats
    if (bowler) {
      const bowlerUpdate = {
        $inc: {
          'stats.matchesPlayed': 1,
          'stats.ballsBowled': ballsToAdd,
          'stats.runsGiven': totalRuns
        }
      };

      if (wicket) {
        bowlerUpdate.$inc['stats.totalWickets'] = 1;
      }

      await Player.findByIdAndUpdate(bowler, bowlerUpdate);

      // ✅ Recalculate bowler averages
      const bowlerData = await Player.findById(bowler);
      if (bowlerData && bowlerData.stats.ballsBowled > 0) {
        const overs = Math.floor(bowlerData.stats.ballsBowled / 6) + (bowlerData.stats.ballsBowled % 6) / 10;
        bowlerData.stats.bowlingAverage = bowlerData.stats.totalWickets > 0 ? bowlerData.stats.runsGiven / bowlerData.stats.totalWickets : 0;
        bowlerData.stats.economyRate = overs > 0 ? bowlerData.stats.runsGiven / overs : 0;
        await bowlerData.save();
      }

      console.log(`✅ Updated ${bowlerData.name}: ${bowlerData.stats.runsGiven} runs given`);
    }

    // Get updated match and innings data
    const match = await Match.findById(innings.match)
      .populate(['team1', 'team2'], 'name shortName');

    const updatedInnings = await Innings.findById(inningsId)
      .populate('battingTeam', 'name shortName')
      .populate('bowlingTeam', 'name shortName')
      .populate('currentBatsmen.player', 'name')
      .populate('currentBowler.player', 'name');

    // Check if innings should end (10 wickets)
    if (innings.totalWickets >= 10) {
      await Innings.findByIdAndUpdate(inningsId, { status: 'completed' });
      console.log('⚠️ INNINGS OVER - 10 WICKETS');
    }

    // ✅ Emit socket event for real-time update
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('score-update', {
      match,
      innings: updatedInnings,
      lastBall: { runs, extras, wicket }
    });

    // ✅ Emit wicket-fall event if wicket taken
    if (wicket) {
      io.to(`match-${match._id}`).emit('wicket-fall', {
        wicketNumber: innings.totalWickets,
        dismissalType,
        match
      });
    }

    res.json({
      success: true,
      message: 'Score updated successfully',
      data: updatedInnings
    });

  } catch (error) {
    console.error('❌ Error in updateScore:', error);
    next(error);
  }
};

// End innings
exports.endInnings = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // End current innings
    await Innings.findOneAndUpdate(
      { match: match._id, inningsNumber: match.currentInnings },
      { status: 'completed' }
    );

    if (match.currentInnings === 1) {
      // Start second innings
      match.currentInnings = 2;
      await match.save();

      await Innings.findOneAndUpdate(
        { match: match._id, inningsNumber: 2 },
        { status: 'in_progress' }
      );

      // Emit socket event
      const io = req.app.get('io');
      io.to(`match-${match._id}`).emit('innings-end', { match, inningsNumber: 1 });

      res.json({
        success: true,
        message: 'First innings ended, second innings started',
        data: match
      });
    } else {
      // Complete match
      match.status = 'completed';
      await match.save();

      const io = req.app.get('io');
      io.to(`match-${match._id}`).emit('match-complete', match);

      res.json({
        success: true,
        message: 'Match completed',
        data: match
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get live match data
exports.getLiveMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate(['team1', 'team2', 'winner', 'tossWinner'], 'name shortName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get current innings
    const currentInnings = await Innings.findOne({
      match: match._id,
      inningsNumber: match.currentInnings,
      status: 'in_progress'
    })
      .populate('battingTeam', 'name shortName')
      .populate('bowlingTeam', 'name shortName')
      .populate('currentBatsmen.player', 'name')
      .populate('currentBowler.player', 'name');

    // Get recent balls
    const recentBalls = await BallByBall.find({ 
      innings: currentInnings?._id 
    })
      .populate('striker', 'name')
      .populate('bowler', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        match,
        currentInnings,
        recentBalls: recentBalls.reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};
