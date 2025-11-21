const mongoose = require('mongoose');

const battingRecordSchema = new mongoose.Schema({
  innings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Innings',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  battingPosition: {
    type: Number,
    min: 1,
    max: 11
  },
  runsScored: {
    type: Number,
    default: 0,
    min: 0
  },
  ballsFaced: {
    type: Number,
    default: 0,
    min: 0
  },
  fours: {
    type: Number,
    default: 0,
    min: 0
  },
  sixes: {
    type: Number,
    default: 0,
    min: 0
  },
  strikeRate: {
    type: Number,
    default: 0,
    get: function() {
      if (this.ballsFaced === 0) return 0;
      return ((this.runsScored / this.ballsFaced) * 100).toFixed(2);
    }
  },
  dismissalType: {
    type: String,
    enum: [
      'not_out',
      'bowled',
      'caught',
      'lbw',
      'run_out',
      'stumped',
      'hit_wicket',
      'obstructing_field',
      'handled_ball',
      'timed_out'
    ],
    default: 'not_out'
  },
  dismissedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  isOnStrike: {
    type: Boolean,
    default: false
  },
  isOut: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for faster queries
battingRecordSchema.index({ innings: 1, player: 1 });
battingRecordSchema.index({ match: 1 });
battingRecordSchema.index({ player: 1 });

// Virtual for calculating strike rate
battingRecordSchema.virtual('calculatedStrikeRate').get(function() {
  if (this.ballsFaced === 0) return 0;
  return parseFloat(((this.runsScored / this.ballsFaced) * 100).toFixed(2));
});

// Method to update batting statistics
battingRecordSchema.methods.updateStats = function(runs, balls, fours = 0, sixes = 0) {
  this.runsScored += runs;
  this.ballsFaced += balls;
  this.fours += fours;
  this.sixes += sixes;
  
  if (this.ballsFaced > 0) {
    this.strikeRate = parseFloat(((this.runsScored / this.ballsFaced) * 100).toFixed(2));
  }
  
  return this.save();
};

// Method to record dismissal
battingRecordSchema.methods.recordDismissal = function(dismissalType, dismissedBy = null, fielder = null) {
  this.dismissalType = dismissalType;
  this.isOut = true;
  this.isOnStrike = false;
  
  if (dismissedBy) {
    this.dismissedBy = dismissedBy;
  }
  
  if (fielder) {
    this.fielder = fielder;
  }
  
  return this.save();
};

// Static method to get top scorers for an innings
battingRecordSchema.statics.getTopScorers = function(inningsId, limit = 5) {
  return this.find({ innings: inningsId })
    .populate('player', 'name')
    .sort({ runsScored: -1 })
    .limit(limit);
};

// Static method to get player's batting record for a match
battingRecordSchema.statics.getPlayerRecord = function(matchId, playerId) {
  return this.findOne({ match: matchId, player: playerId })
    .populate('player', 'name team')
    .populate('dismissedBy', 'name')
    .populate('fielder', 'name');
};

module.exports = mongoose.model('BattingRecord', battingRecordSchema);
