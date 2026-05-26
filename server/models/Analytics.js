const mongoose = require('mongoose');

const analyticsSchema = mongoose.Schema({
  totalReviews: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  issueDistribution: {
    type: Map,
    of: Number,
    default: { High: 0, Medium: 0, Low: 0 }
  },
  languageUsage: {
    type: Map,
    of: Number,
    default: {}
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
