const redisClient = require("../config/redis");

async function getCachedData(key, fetchData, ttl = 300) {
  try {
    const cachedData = await redisClient.get(key);

    if (cachedData !== null) {
      return cachedData;
    }
  } catch (error) {
    console.error("Redis read failed:", error.message);
  }

  console.log("Cache MISS:", key);

  const data = await fetchData();

  try {
    await redisClient.set(key, data, { ex: ttl });
  } catch (error) {
    console.error("Redis write failed:", error.message);
  }

  return data;
}

module.exports = { getCachedData };
