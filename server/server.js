const app = require('./app');
const connectDB = require('./config/db');
const { expireStaleOrders } = require('./controllers/orderController');
const { expireStaleBookings } = require('./controllers/bookingController');

const PORT = process.env.PORT || 5000;

// Sweeper: every 60s, expire requests/bookings whose chef response window has
// lapsed. The first run happens shortly after boot (not immediately, so the DB
// connection is settled first).
let sweeperTimer = null;
const startSweeper = () => {
  if (sweeperTimer) clearInterval(sweeperTimer);
  sweeperTimer = setInterval(async () => {
    try {
      const expiredOrders = await expireStaleOrders();
      const expiredBookings = await expireStaleBookings();
      if (expiredOrders || expiredBookings) {
        console.log(`[Sweeper] expired ${expiredOrders} order(s), ${expiredBookings} booking(s)`);
      }
    } catch (error) {
      console.error('[Sweeper] run failed:', error.message);
    }
  }, 60 * 1000);
  sweeperTimer.unref?.();
};

// Connect to MongoDB Database
connectDB();

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`HomeChef Server started!`);
  console.log(`Port: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
  startSweeper();
  console.log('Expiry sweeper started (checks every 60s)');
});
