const { createApp } = require('../server/dist/app.js');
const { connectDB } = require('../server/dist/config/db.js');

let cachedApp = null;

module.exports = async (req, res) => {
  if (!cachedApp) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection notice in Vercel handler:', err.message);
    }
    cachedApp = createApp();
  }
  return cachedApp(req, res);
};
