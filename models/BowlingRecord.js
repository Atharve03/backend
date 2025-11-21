const mongoose = require('mongoose');

const bowlingRecordSchema = new mongoose.Schema({
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
  oversBowled: {
    type: Number,
    default: 0,
    min: 0
  },
  ballsBowled: {
    type: Number,
    default: 0,
    min: 0
  },
  runsConceded: {
    type: Number,
    default: 0,
    min: 0
  },
  wicketsTaken: {
    type: Number,
    default: 0,
    min: 0
  },
  maidens: {
    type: Number,
    default: 0,
    min: 0
  },
  wides: {
    type: Number,
    default: 0,
    min: 0
  },
  noBalls: {
    type: Number,
    default: 0,
    min: 0
  },
  economyRate: {
    type: Number,
    default: 0,
    get: function() {
      if (this.oversBowled === 0) return 0;
      return (this.runsConceded / this.oversBowled).toFixed(2);
    }
  },
  bowlingAverage: {
    type: Number,
    default: 0,
    get: function() {
      if (this.wicketsTaken === 0) return 0;
      return (this.runsConceded / this.wicketsTaken).toFixed(2);
    }
  },
  strikeRate: {
    type: Number,
    default: 0,
    get: function() {
      if (this.wicketsTaken === 0) return 0;
      return (this.ballsBowled / this.wicketsTaken).toFixed(2);
    }
  },
  isCurrentBowler: {
    type: Boolean,
    default: false
  },
  dots: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for faster queries
bowlingRecordSchema.index({ innings: 1, player: 1 });
bowlingRecordSchema.index({ match: 1 });
bowlingRecordSchema.index({ player: 1 });

// Virtual for calculating complete overs (e.g., 3.4 overs)
bowlingRecordSchema.virtual('completeOvers').get(function() {
  const fullOvers = Math.floor(this.ballsBowled / 6);
  const remainingBalls = this.ballsBowled % 6;
  return parseFloat(`${fullOvers}.${remainingBalls}`);
});

// Virtual for calculating economy rate
bowlingRecordSchema.virtual('calculatedEconomyRate').get(function() {
  if (this.ballsBowled === 0) return 0;
  const overs = this.ballsBowled / 6;
  return parseFloat((this.runsConceded / overs).toFixed(2));
});

// Method to update bowling statistics
bowlingRecordSchema.methods.updateStats = function(runs, balls, wickets = 0, wides = 0, noBalls = 0, dots = 0) {
  this.ballsBowled += balls;
  this.runsConceded += runs;
  this.wicketsTaken += wickets;
  this.wides += wides;
  this.noBalls += noBalls;
  this.dots += dots;
  
  // Calculate overs
  this.oversBowled = parseFloat((this.ballsBowled / 6).toFixed(2));
  
  // Calculate economy rate
  if (this.oversBowled > 0) {
    this.economyRate = parseFloat((this.runsConceded / this.oversBowled).toFixed(2));
  }
  
  // Calculate bowling average
  if (this.wicketsTaken > 0) {
    this.bowlingAverage = parseFloat((this.runsConceded / this.wicketsTaken).toFixed(2));
  }
  
  // Calculate strike rate
  if (this.wicketsTaken > 0) {
    this.strikeRate = parseFloat((this.ballsBowled / this.wicketsTaken).toFixed(2));
  }
  
  return this.save();
};

// Method to record a maiden over
bowlingRecordSchema.methods.recordMaiden = function() {
  this.maidens += 1;
  return this.save();
};

// Static method to get best bowlers for an innings
bowlingRecordSchema.statics.getBestBowlers = function(inningsId, limit = 5) {
  return this.find({ innings: inningsId })
    .populate('player', 'name')
    .sort({ wicketsTaken: -1, economyRate: 1 })
    .limit(limit);
};

// Static method to get player's bowling record for a match
bowlingRecordSchema.statics.getPlayerRecord = function(matchId, playerId) {
  return this.findOne({ match: matchId, player: playerId })
    .populate('player', 'name team');
};

// Static method to get current bowler for an innings
bowlingRecordSchema.statics.getCurrentBowler = function(inningsId) {
  return this.findOne({ innings: inningsId, isCurrentBowler: true })
    .populate('player', 'name team');
};

module.exports = mongoose.model('BowlingRecord', bowlingRecordSchema);
