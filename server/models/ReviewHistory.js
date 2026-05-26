const mongoose = require('mongoose');

const reviewHistorySchema = mongoose.Schema({
  language: {
    type: String,
    required: true
  },
  originalCode: {
    type: String,
    required: true
  },
  reviewSummary: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  issues: [
    {
      severity: String,
      line: String,
      problem: String,
      solution: String
    }
  ],
  improvedCode: {
    type: String
  },
  fallback: {
    type: Boolean,
    default: false
  },
  fallbackReason: {
    type: String
  },
  bestPractices: [
    {
      type: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReviewHistory', reviewHistorySchema);
