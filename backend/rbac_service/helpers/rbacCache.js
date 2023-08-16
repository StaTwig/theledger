const redis = require("redis");
const RbacModel = require("../models/RbacModel");
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

exports.RbacCache = function () {  // RBAC Cache Initialization
  RbacModel.find({})
    .then(async (permissions) => {
      if (permissions.length > 0) {
        for (const role of permissions) {
          const res = await client.DEL(role.role);
          console.log("DELETE", res, role.role);
          if (role?.permissions?.length && role?.permissions?.length > 0) {
            await client.SADD(role.role, role.permissions);
            console.log("Cache Loaded ---> " + role.role + "\n");
          }
          else {
            console.log("No permissions for this role - ", role);
          }
        }
        console.log("RBAC Cache Initialization Complete ✅");
      }
      else {
        console.log("No permissions found");
      }
    })
    .catch((err) => {
      console.log("RBAC Cache Initialization", err);
    });
};
