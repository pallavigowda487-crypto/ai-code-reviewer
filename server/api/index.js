const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const reviewRoutes = require('../routes/reviewRoutes');
const errorHandler = require('../middleware/errorHandler');

// Load env vars from server/.env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to database
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log("No MONGODB_URI provided, skipping DB connection (might be intentional for UI dev)");
}

const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(morgan('dev'));

// Body parser
app.use(express.json());

// Routes
app.use('/api', reviewRoutes);

// Error handling
app.use(errorHandler);

// Start server if run directly (local dev)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
