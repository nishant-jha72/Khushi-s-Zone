const { Redis } = require("@upstash/redis");
const dotenv = require("dotenv");
dotenv.config();

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = redisClient;
