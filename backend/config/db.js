const mongoose = require('mongoose');

const connectDB = async () => {
  // Prevent unhandled error events from crashing the process
  mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB connection error event:', err.message || err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
  });

  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in environment variables');
      return;
    }
    try {
      console.log('Connecting to Cloud MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        family: 4,
        connectTimeoutMS: 15000,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 30000,
      });
      console.log('✅ Cloud MongoDB Connected');
    } catch (err) {
      console.warn('⚠️ Cloud Connection Blocked/Failed. Trying Local MongoDB...');
      try {
        await mongoose.connect('mongodb://localhost:27017/inventory', {
          family: 4,
          connectTimeoutMS: 5000,
          serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Local MongoDB Connected');
      } catch (localErr) {
        console.error('❌ Both Cloud and Local MongoDB connections failed.');
        console.warn('ℹ️ Running in resilient Offline Demo Mode (using Mock/Fallback credentials).');
      }
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

module.exports = connectDB;
