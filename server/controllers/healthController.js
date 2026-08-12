const mongoose = require('mongoose');
const models = require('../models');

// Health Check Controller
// Returns basic API health status and MongoDB connection readiness
const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';
  const modelCount = Object.keys(models).length;

  res.status(200).json({
    success: true,
    message: 'HomeChef API is running smoothly',
    databaseStatus: dbStatus,
    modelCount,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
