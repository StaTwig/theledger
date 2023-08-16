require("dotenv").config();
const config = {
  MONGODB_URL: process.env.MONGODB_URL,
  REWARDS_SERVICE_URL: process.env.REWARDS_SERVICE_URL || 'https://test.vaccineledger.com/rewardmanagement/api',
  REWARDS_API_KEY: process.env.REWARDS_API_KEY
};

module.exports = config;
