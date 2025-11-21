const mongoose = require('mongoose');

const ballByBallSchema = new mongoose.Schema({
  innings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Innings',
    required: true
  },
  overNumber: {
    type: Number,
    required: true
  },
  ballNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  striker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  nonStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  runsScored: {
    type: Number,
    default: 0,
    min: 0
  },
  extras: {
    type: Number,
    default: 0
  },
  extraType: {
    type: String,
    enum: ['none', 'wide', 'noball', 'bye', 'legbye'],
    default: 'none'
  },
  wicketTaken: {
    type: Boolean,
    default: false
  },
  dismissalType: {
    type: String,
    enum: ['none', 'bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'],
    default: 'none'
  },
  dismissedPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  commentary: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for efficient ball retrieval
ballByBallSchema.index({ innings: 1, overNumber: 1, ballNumber: 1 });

module.exports = mongoose.model('BallByBall', ballByBallSchema);
