const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  matchDate: {
    type: Date,
    required: true
  },
  matchType: {
    type: String,
    enum: ['T20', 'ODI', 'Test'],
    default: 'T20'
  },
  oversPerInnings: {
    type: Number,
    required: true,
    default: 20
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'abandoned'],
    default: 'upcoming'
  },
  tossWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  tossDecision: {
    type: String,
    enum: ['bat', 'bowl']
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  resultType: {
    type: String,
    enum: ['runs', 'wickets', 'tie', 'no_result']
  },
  resultMargin: {
    type: Number
  },
  currentInnings: {
    type: Number,
    default: 1,
    min: 1,
    max: 2
  }
}, {
  timestamps: true
});

// Index for faster queries
matchSchema.index({ status: 1 });
matchSchema.index({ matchDate: -1 });

module.exports = mongoose.model('Match', matchSchema);
