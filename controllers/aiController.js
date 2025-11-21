

const Player = require('../models/Player');
const Team = require('../models/Team');
const Innings = require('../models/Innings');
const Match = require('../models/Match');

// ============================================================
// 🤖 AI FEATURE 1: PLAYER PERFORMANCE PREDICTION
// ============================================================
// Predicts next match performance based on historical stats
// Algorithm: Weighted scoring model using average, strike rate, and form










exports.predictPlayerPerformance = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    
    // Fetch player data
    const player = await Player.findById(playerId).populate('team', 'name shortName');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    const stats = player.stats || {};
    
    // AI ALGORITHM: Calculate performance metrics
    const avgRuns = stats.totalRuns > 0 ? stats.totalRuns / Math.max(stats.matchesPlayed, 1) : 0;
    const strikeRate = stats.strikeRate || 0;
    const battingAverage = stats.battingAverage || 0;
    
    // Form Factor: Boost if recent form is good
    const recentFormFactor = strikeRate > 120 ? 1.2 : strikeRate > 100 ? 1.0 : 0.8;
    
    // AI PREDICTION MODEL: Weighted combination
    // 40% average runs, 35% strike rate, 25% batting average
    const performanceScore = 
      (avgRuns * 0.4) + 
      (strikeRate * 0.35 / 100) + 
      (battingAverage * 0.25);
    
    // Predicted score for next match
    const predictedScore = Math.round(avgRuns * recentFormFactor);
    
    // Confidence level based on matches played
    // More matches = higher confidence
    const confidence = Math.min(100, (stats.matchesPlayed / 20) * 100);
    
    // AI CLASSIFICATION: Determine form status
    let formStatus = 'Average';
    let recommendation = '';
    
    if (avgRuns > 40 && strikeRate > 130) {
      formStatus = 'Excellent Form';
      recommendation = 'High potential, expected to perform well';
    } else if (avgRuns > 25 && strikeRate > 110) {
      formStatus = 'Good Form';
      recommendation = 'Solid performer, likely to contribute';
    } else if (avgRuns > 15) {
      formStatus = 'Average Form';
      recommendation = 'Consistent player, reliable option';
    } else {
      formStatus = 'Poor Form';
      recommendation = 'Consider rotation, needs confidence building';
    }
    
    res.json({
      success: true,
      prediction: {
        playerName: player.name,
        jerseyNumber: player.jerseyNumber,
        role: player.role,
        team: player.team.name,
        
        // AI PREDICTIONS
        expectedScore: predictedScore,
        performanceRating: Math.round(performanceScore * 10), // Out of 100
        confidence: Math.round(confidence),
        formStatus: formStatus,
        formTrend: strikeRate > 120 ? '📈 Improving' : '📉 Declining',
        
        // STATS BREAKDOWN
        statsBreakdown: {
          matchesPlayed: stats.matchesPlayed,
          totalRuns: stats.totalRuns,
          battingAverage: battingAverage.toFixed(2),
          strikeRate: strikeRate.toFixed(2),
          fours: stats.fours || 0,
          sixes: stats.sixes || 0
        },
        
        // AI RECOMMENDATION
        recommendation: recommendation,
        reasoning: `Based on ${stats.matchesPlayed} matches, averaging ${avgRuns.toFixed(1)} runs with strike rate ${strikeRate.toFixed(1)}. Recent form shows ${recentFormFactor > 1 ? 'upward' : 'downward'} trend.`
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🤖 AI FEATURE 2: SMART TEAM RECOMMENDER
// ============================================================
// Recommends optimal playing XI based on match format
// Algorithm: Format-specific scoring with role consideration

exports.recommendTeamXI = async (req, res, next) => {
  try {
    const { teamId, matchFormat } = req.body; // T20, ODI, or Test
    
    if (!teamId || !matchFormat) {
      return res.status(400).json({
        success: false,
        message: 'teamId and matchFormat are required'
      });
    }
    
    // Fetch all team players
    const players = await Player.find({ team: teamId }).sort({ role: 1 });
    
    if (players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No players found in team'
      });
    }
    
    // AI SCORING ALGORITHM: Different weights for different formats
    const scorePlayer = (player) => {
      const stats = player.stats || {};
      const avgRuns = stats.totalRuns / Math.max(stats.matchesPlayed, 1);
      const strikeRate = stats.strikeRate || 0;
      const battingAverage = stats.battingAverage || 0;
      
      let score = 0;
      
      if (matchFormat === 'T20') {
        // T20: Prioritize strike rate (aggressive batting)
        score = (strikeRate * 2) + (avgRuns / 10) + (battingAverage * 0.5);
      } else if (matchFormat === 'ODI') {
        // ODI: Balance between aggression and consistency
        score = (strikeRate * 1.5) + (battingAverage * 1.5) + (avgRuns / 10);
      } else if (matchFormat === 'Test') {
        // Test: Prioritize consistency and average
        score = (battingAverage * 3) + (avgRuns / 10) + (strikeRate * 0.5);
      }
      
      return score;
    };
    
    // Categorize players by role
    const batsmen = players.filter(p => 
      p.role === 'batsman' || p.role === 'all-rounder'
    );
    const bowlers = players.filter(p => 
      p.role === 'bowler' || p.role === 'all-rounder'
    );
    const keepers = players.filter(p => p.role === 'wicket-keeper');
    
    // AI SELECTION: Score and select top performers
    const selectedBatsmen = batsmen
      .map(p => ({
        ...p.toObject(),
        aiScore: scorePlayer(p)
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 6);
    
    const selectedBowlers = bowlers
      .map(p => ({
        ...p.toObject(),
        aiScore: scorePlayer(p)
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 4);
    
    const selectedKeeper = keepers[0];
    
    if (!selectedKeeper) {
      return res.status(400).json({
        success: false,
        message: 'No wicket keeper available'
      });
    }
    
    // Build recommended XI
    const playingXI = [
      ...selectedBatsmen.slice(0, 5).map((p, idx) => ({
        position: idx + 1,
        name: p.name,
        role: p.role,
        jerseyNumber: p.jerseyNumber,
        aiScore: p.aiScore,
        stats: {
          average: ((p.stats?.battingAverage) || 0).toFixed(1),
          strikeRate: ((p.stats?.strikeRate) || 0).toFixed(1),
          runs: p.stats?.totalRuns || 0
        }
      })),
      {
        position: 6,
        name: selectedKeeper.name,
        role: selectedKeeper.role,
        jerseyNumber: selectedKeeper.jerseyNumber,
        aiScore: scorePlayer(selectedKeeper),
        stats: {
          average: ((selectedKeeper.stats?.battingAverage) || 0).toFixed(1),
          strikeRate: ((selectedKeeper.stats?.strikeRate) || 0).toFixed(1),
          runs: selectedKeeper.stats?.totalRuns || 0
        }
      },
      ...selectedBowlers.slice(0, 4).map((p, idx) => ({
        position: 7 + idx,
        name: p.name,
        role: p.role,
        jerseyNumber: p.jerseyNumber,
        aiScore: p.aiScore,
        stats: {
          wickets: p.stats?.totalWickets || 0,
          economy: ((p.stats?.economyRate) || 0).toFixed(2),
          bowlingAverage: ((p.stats?.bowlingAverage) || 0).toFixed(1)
        }
      }))
    ];
    
    // AI INSIGHTS
    const topBatsman = selectedBatsmen[0];
    const topBowler = selectedBowlers[0];
    
    let strategy = '';
    if (matchFormat === 'T20') {
      strategy = 'Aggressive batting lineup with explosive openers. Strong death bowling required.';
    } else if (matchFormat === 'ODI') {
      strategy = 'Balanced team with solid middle order. Mix of pace and spin bowling.';
    } else {
      strategy = 'Experienced batsmen for first innings resilience. Quality spin bowlers essential.';
    }
    
    res.json({
      success: true,
      recommendation: {
        format: matchFormat,
        totalPlayers: playingXI.length,
        playingXI: playingXI,
        captainSuggestion: topBatsman.name,
        viceCaptainSuggestion: topBowler.name,
        aiInsights: {
          strategy: strategy,
          strengths: `${topBatsman.name} (batting) and ${topBowler.name} (bowling) are standout performers`,
          considerations: `Ensure good bowling depth and reliable lower order batting for ${matchFormat}`
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🤖 AI FEATURE 3: MATCH ANOMALY DETECTOR
// ============================================================
// Detects unusual match situations in real-time
// Algorithm: Statistical analysis of scoring patterns

exports.detectMatchAnomalies = async (req, res, next) => {
  try {
    const { matchId, inningsId } = req.params;
    
    const match = await Match.findById(matchId)
      .populate(['team1', 'team2'], 'name shortName');
    
    const innings = await Innings.findById(inningsId)
      .populate(['battingTeam', 'bowlingTeam'], 'name shortName');
    
    if (!match || !innings) {
      return res.status(404).json({
        success: false,
        message: 'Match or Innings not found'
      });
    }
    
    const anomalies = [];
    const overs = Math.floor(innings.totalBalls / 6);
    const runRate = overs > 0 ? (innings.totalRuns / overs) : 0;
    
    // ============================================================
    // ANOMALY 1: BATTING COLLAPSE DETECTION
    // ============================================================
    // Alert when multiple wickets fall quickly
    if (innings.totalWickets >= 5 && overs < 10) {
      anomalies.push({
        type: 'BATTING_COLLAPSE',
        severity: 'HIGH',
        confidence: 95,
        message: `🚨 CRITICAL: Major batting collapse! ${innings.totalWickets} wickets in just ${overs} overs`,
        suggestion: 'Consider taking timeout to rebuild partnership',
        timestamp: new Date()
      });
    }
    
    // ============================================================
    // ANOMALY 2: EXCEPTIONAL SCORING RATE
    // ============================================================
    // Alert on unusually high or low scoring
    if (runRate > 12 && overs > 2) {
      anomalies.push({
        type: 'HIGH_SCORING',
        severity: 'INFO',
        confidence: 90,
        message: `🔥 EXPLOSIVE BATTING: Run rate is ${runRate.toFixed(2)} runs/over! Exceptional scoring detected`,
        suggestion: 'Excellent performance, maintain momentum',
        timestamp: new Date()
      });
    } else if (runRate < 4 && overs > 5) {
      anomalies.push({
        type: 'SLOW_SCORING',
        severity: 'WARNING',
        confidence: 85,
        message: `⚠️ CAUTIOUS APPROACH: Run rate is ${runRate.toFixed(2)} runs/over. Consider accelerating`,
        suggestion: 'Shift gears, increase aggression in shot selection',
        timestamp: new Date()
      });
    }
    
    // ============================================================
    // ANOMALY 3: INDIVIDUAL PLAYER PERFORMANCE ANOMALIES
    // ============================================================
    // Alert on exceptional individual performances
    if (innings.currentBatsmen && innings.currentBatsmen.length > 0) {
      innings.currentBatsmen.forEach(batsman => {
        if (batsman.balls > 10) {
          const strikeRate = (batsman.runs / batsman.balls) * 100;
          
          if (strikeRate > 200) {
            anomalies.push({
              type: 'EXCEPTIONAL_BATTING',
              severity: 'INFO',
              confidence: 92,
              playerName: batsman.player?.name || 'Unknown',
              message: `⚡ OUTSTANDING PERFORMANCE: Strike rate of ${strikeRate.toFixed(0)}! Exceptional batting`,
              suggestion: `Continue aggressive batting, capitalize on momentum`,
              timestamp: new Date()
            });
          } else if (strikeRate < 60 && batsman.balls > 20) {
            anomalies.push({
              type: 'DEFENSIVE_BATTING',
              severity: 'WARNING',
              confidence: 80,
              playerName: batsman.player?.name || 'Unknown',
              message: `🛡️ DEFENSIVE APPROACH: Strike rate of ${strikeRate.toFixed(0)}%. Building innings slowly`,
              suggestion: `Solid approach, support from other end needed`,
              timestamp: new Date()
            });
          }
        }
      });
    }
    
    // ============================================================
    // ANOMALY 4: BOWLING PERFORMANCE ANOMALIES
    // ============================================================
    // Alert on unusually expensive or economical bowling
    if (innings.currentBowler) {
      const bowlerEconomy = innings.currentBowler.overs > 0 
        ? (innings.currentBowler.runs / Math.max(1, innings.currentBowler.overs))
        : 0;
      
      if (bowlerEconomy > 15) {
        anomalies.push({
          type: 'EXPENSIVE_BOWLING',
          severity: 'WARNING',
          confidence: 88,
          message: `💔 COSTLY SPELL: Economy rate of ${bowlerEconomy.toFixed(2)} runs/over. Under pressure`,
          suggestion: `Consider changing bowler or shift to defensive field placement`,
          timestamp: new Date()
        });
      } else if (bowlerEconomy < 3 && innings.currentBowler.overs > 2) {
        anomalies.push({
          type: 'ECONOMICAL_BOWLING',
          severity: 'INFO',
          confidence: 85,
          message: `✅ EXCELLENT BOWLING: Economy rate of ${bowlerEconomy.toFixed(2)} runs/over. Tight spell`,
          suggestion: `Maintain length and lines, excellent control`,
          timestamp: new Date()
        });
      }
    }
    
    // ============================================================
    // ANOMALY 5: MATCH PROGRESSION PREDICTION
    // ============================================================
    // Predict likely match outcome based on current run rate
    if (overs > 5 && overs < 18) {
      const projectedTotal = (runRate * 20); // Project to 20 overs
      
      if (projectedTotal > 200) {
        anomalies.push({
          type: 'PROJECTED_TOTAL_HIGH',
          severity: 'INFO',
          confidence: 75,
          message: `📊 PROJECTED TOTAL: ${Math.round(projectedTotal)} runs at current run rate! Likely to be total above 200`,
          suggestion: `Strong batting performance expected, bowling needs tightening`,
          timestamp: new Date()
        });
      } else if (projectedTotal < 120) {
        anomalies.push({
          type: 'PROJECTED_TOTAL_LOW',
          severity: 'WARNING',
          confidence: 75,
          message: `📊 PROJECTED TOTAL: ${Math.round(projectedTotal)} runs at current run rate. Below par performance`,
          suggestion: `Batting needs acceleration, bowling has been effective`,
          timestamp: new Date()
        });
      }
    }
    
    // Determine overall match status
    const overallStatus = anomalies.some(a => a.severity === 'HIGH') 
      ? 'CRITICAL' 
      : anomalies.some(a => a.severity === 'WARNING')
      ? 'WARNING'
      : 'NORMAL';
    
    res.json({
      success: true,
      anomalyReport: {
        matchStatus: overallStatus,
        totalAnomalies: anomalies.length,
        
        inningsSnapshot: {
          runs: innings.totalRuns,
          wickets: innings.totalWickets,
          balls: innings.totalBalls,
          overs: overs,
          runRate: runRate.toFixed(2),
          battingTeam: innings.battingTeam?.name,
          bowlingTeam: innings.bowlingTeam?.name
        },
        
        anomalies: anomalies.sort((a, b) => {
          const severityOrder = { HIGH: 0, WARNING: 1, INFO: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        
        generatedAt: new Date()
      }
    });
    
  } catch (error) {
    next(error);
  }
};







exports.getAIInsights = async (req, res, next) => {
  try {
    const players = await Player.find().limit(5);
    
    const insights = {
      totalPlayers: await Player.countDocuments(),
      totalTeams: await Team.countDocuments(),
      totalMatches: await Match.countDocuments(),
      topPerformers: players
        .sort((a, b) => (b.stats?.totalRuns || 0) - (a.stats?.totalRuns || 0))
        .slice(0, 3)
        .map(p => ({
          name: p.name,
          role: p.role,
          runs: p.stats?.totalRuns,
          average: (p.stats?.battingAverage || 0).toFixed(2)
        }))
    };
    
    res.json({
      success: true,
      insights
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
