const redis = require("redis");
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD,
});
client.connect(); // Promise
client.on("connect", () => {
  console.log("Connected to Redis");
});
client.on("error", (err) => {
  console.log("Redis Error " + err);
});

exports.batchDelKeysByPattern = async (pattern) => {
  try {
    let cursor = '0';
    let deletedKeysCount = 0;
    do {
      const batch = await client.SCAN(cursor, 'MATCH', pattern, 'COUNT', '100');
      if (batch && batch.length) {
        cursor = batch[0];
        deletedKeysCount += batch[1].length;
        if (batch[1].length)
          await client.UNLINK(batch[1]);
      }
    } while (cursor !== '0');
    return deletedKeysCount;
  } catch (err) {
    throw new Error("Error in clearing cache " + err);
  }
};

exports.randomNumber = function (length) {
  let text = "";
  const possible = "123456789";
  for (let i = 0; i < length; i++) {
    const sup = Math.floor(Math.random() * possible.length);
    text += i > 0 && sup == i ? "0" : possible.charAt(sup);
  }
  return Number(text);
};

exports.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};