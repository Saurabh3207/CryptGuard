const mongoose = require('mongoose');

const connectDB = async (url) => {
  try {
    // Enhanced MongoDB connection with retry logic and options
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true
    };

    const connection = await mongoose.connect(url, options);
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    return connection;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Retry connection after 5 seconds
    console.log('⏳ Retrying connection in 5 seconds...');
    setTimeout(() => connectDB(url), 5000);
    
    throw error;
  }
};

module.exports = { connectDB };