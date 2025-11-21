const mongoose = require('mongoose');

const inningsSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  bowlingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  inningsNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  totalWickets: {
    type: Number,
    default: 0
  },
  totalOvers: {
    type: Number,
    default: 0
  },
  totalBalls: {
    type: Number,
    default: 0
  },
  extras: {
    type: Number,
    default: 0
  },
  currentRunRate: {
    type: Number,
    default: 0
  },
  requiredRunRate: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  currentBatsmen: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    isOnStrike: { type: Boolean, default: false }
  }],
  currentBowler: {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Innings', inningsSchema);
