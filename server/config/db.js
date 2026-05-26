const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  if (!process.env.MONGODB_URI) {
    console.warn("No MONGODB_URI provided, skipping DB connection");
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.warn('Continuing without MongoDB. Review history and analytics will not be saved until the database is available.');
  }
};

module.exports = connectDB;
