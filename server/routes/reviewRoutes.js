const express = require('express');
const router = express.Router();
const { createReview, getReviews, getAnalytics, deleteReview, debugEnv } = require('../controllers/reviewController');

router.post('/review', createReview);
router.get('/reviews', getReviews);
router.get('/analytics', getAnalytics);
router.get('/debug', debugEnv);
router.delete('/review/:id', deleteReview);

module.exports = router;
