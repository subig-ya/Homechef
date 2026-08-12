const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`HomeChef Server started!`);
  console.log(`Port: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
