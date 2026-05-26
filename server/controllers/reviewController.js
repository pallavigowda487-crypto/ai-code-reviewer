const mongoose = require('mongoose');
const ReviewHistory = require('../models/ReviewHistory');
const Analytics = require('../models/Analytics');
const { getAIProvider } = require('../services/ai/aiProvider');
const connectDB = require('../config/db');

const FALLBACK_PATTERN = /Grok API unavailable|Fallback review for/i;

const sanitizeReview = (review) => {
  const originalSummary = review.reviewSummary || review.summary || '';
  const isFallback = review.fallback || FALLBACK_PATTERN.test(originalSummary);
  const summary = isFallback
    ? 'Live AI review unavailable. The app is showing a fallback review instead.'
    : originalSummary;

  return {
    ...review,
    fallback: isFallback,
    summary,
    reviewSummary: summary
  };
};

const debugEnv = async (req, res) => {
  return res.status(200).json({
    GROK_API_KEY_present: !!process.env.GROK_API_KEY,
    GROK_MODEL: process.env.GROK_MODEL,
    MONGODB_URI_present: !!process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV,
    cwd: process.cwd()
  });
};

const createReview = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required.' });
    }

    const reviewFunction = getAIProvider();
    
    // Call AI Provider
    const aiResponse = await reviewFunction(code, language);

    // Save to History
    await connectDB();
    const isDbConnected = mongoose.connection.readyState === 1;
    let reviewRecord = null;
    let analytics = null;

    if (isDbConnected) {
      reviewRecord = await ReviewHistory.create({
        language,
        originalCode: code,
        reviewSummary: aiResponse.summary || 'No summary provided',
        score: aiResponse.score || 0,
        issues: aiResponse.issues || [],
        improvedCode: aiResponse.improvedCode || '',
        bestPractices: aiResponse.bestPractices || [],
        fallback: aiResponse.fallback || false,
        fallbackReason: aiResponse.fallbackReason || ''
      });

      analytics = await Analytics.findOne();
      if (!analytics) {
        analytics = new Analytics();
      }

      analytics.totalReviews += 1;
      
      // Running average
      analytics.averageScore = Math.round(
        ((analytics.averageScore * (analytics.totalReviews - 1)) + reviewRecord.score) / analytics.totalReviews
      );

      // Issue distribution
      aiResponse.issues.forEach(issue => {
        const severity = issue.severity || 'Medium';
        const currentCount = analytics.issueDistribution.get(severity) || 0;
        analytics.issueDistribution.set(severity, currentCount + 1);
      });

      // Language usage
      const langCount = analytics.languageUsage.get(language) || 0;
      analytics.languageUsage.set(language, langCount + 1);

      await analytics.save();
    } else {
      console.warn('DB not connected. Skipping history and analytics save.');
    }

    const responseReview = {
      id: reviewRecord?._id || null,
      summary: aiResponse.summary || 'No summary provided',
      score: aiResponse.score || 0,
      issues: aiResponse.issues || [],
      improvedCode: aiResponse.improvedCode || '',
      bestPractices: aiResponse.bestPractices || [],
      fallback: aiResponse.fallback || false,
      fallbackReason: aiResponse.fallbackReason || ''
    };

    res.status(201).json({
      success: true,
      review: sanitizeReview(responseReview)
    });

  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReviews = async (req, res) => {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      console.warn('DB not connected. Returning empty review history.');
      return res.status(200).json({ success: true, reviews: [] });
    }

    const reviews = await ReviewHistory.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, reviews: reviews.map(sanitizeReview) });
  } catch (error) {
    console.error('Error in getReviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      console.warn('DB not connected. Returning default analytics.');
      return res.status(200).json({
        success: true,
        analytics: { totalReviews: 0, averageScore: 0, issueDistribution: {}, languageUsage: {} }
      });
    }

    const analytics = await Analytics.findOne();
    if (!analytics) {
       return res.status(200).json({ success: true, analytics: { totalReviews: 0, averageScore: 0, issueDistribution: {}, languageUsage: {} } });
    }
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      console.warn('DB not connected. Cannot delete review.');
      return res.status(200).json({ success: true, message: 'Database unavailable; delete request ignored.' });
    }

    const { id } = req.params;
    await ReviewHistory.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error in deleteReview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  debugEnv,
  createReview,
  getReviews,
  getAnalytics,
  deleteReview
};
