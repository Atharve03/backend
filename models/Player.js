const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  jerseyNumber: {
    type: Number,
    min: 1,
    max: 999
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
    required: true
  },
  battingStyle: {
    type: String,
    enum: ['right_hand', 'left_hand'],
    default: 'right_hand'
  },
  bowlingStyle: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    bowlingAverage: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    economyRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
playerSchema.index({ team: 1 });
playerSchema.index({ name: 1 });

module.exports = mongoose.model('Player', playerSchema);
