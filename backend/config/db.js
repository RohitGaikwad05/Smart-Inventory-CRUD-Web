const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in environment variables');
      return;
    }
    try {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4, connectTimeoutMS: 5000 });
      console.log('✅ Cloud MongoDB Connected');
    } catch (err) {
      console.warn('⚠️ Cloud Connection Blocked. Trying Local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/inventory', { family: 4, connectTimeoutMS: 2000 });
      console.log('✅ Local MongoDB Connected');
    }

  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Keep server running so we can show friendly errors to the user
  }
};


module.exports = connectDB;
