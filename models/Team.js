const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true
  },
  shortName: {
    type: String,
    required: [true, 'Short name is required'],
    unique: true,
    uppercase: true,
    maxlength: 10
  },
  captain: {
    type: String,
    trim: true
  },
  coach: {
    type: String,
    trim: true
  },
  homeGround: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    matchesTied: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
