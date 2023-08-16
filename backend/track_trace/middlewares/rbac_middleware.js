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

const checkPermissions = async (request, next) => {
  try {
    const required_permission = request["permissionRequired"];
    const request_role = request["role"];
    for (let i = 0; i < required_permission.length; i++) {
      const result = await client.SISMEMBER(request_role, required_permission[i]);
      if (result) {
        next({
          success: true,
          message: "Permission Granted",
        });
        break;
      } else {
        if (i === required_permission.length - 1) {
          next({
            success: false,
            message: "Permission Denied",
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    next({
      success: false,
      message: "Error",
    });
  }
};

const checkPermissionAwait = async (request) => {
  try {
    const required_permission = request["permissionRequired"];
    const request_role = request["role"];
    for (let i = 0; i < required_permission.length; i++) {
      const result = await client.SISMEMBER(request_role, required_permission[i]);
      if (result) {
        return true;
      } else {
        if (i === required_permission.length - 1) {
          return false;
        }
      }
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getCachedData = async (key) => {
  try {
    const result = await client.GET(key);
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const setImageURL = async (key, value) => {
  try {
    const result = await client.SET(key, value, { EX: 3600 });
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = {
  redisClient: client,
  checkPermissions: checkPermissions,
  checkPermissionAwait: checkPermissionAwait,
  getCachedData: getCachedData,
  getImageURL: getCachedData,
  setImageURL: setImageURL,
};
