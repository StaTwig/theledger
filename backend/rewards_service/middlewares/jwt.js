const jwt = require("jsonwebtoken");
const apiResponse = require("../helpers/apiResponse");
const RewardConfigModel = require("../models/RewardConfigModel");
const JWT_SECRET = process.env.JWT_SECRET;
const REWARDS_AUTH = process.env.REWARDS_AUTH || false;

// Middleware to handle user authentication and authorization
const authUser = (req, res, next) => {
  try {
    if (REWARDS_AUTH) {
      next();
    } else {
      const { authorization } = req.headers;
      if (!authorization) {
        return apiResponse.unauthorizedResponse(
          res,
          "Authorization token is not found"
        );
      }
      const token = authorization.replace("Bearer ", "");
      jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
          console.log(err);
          if (err.name === "TokenExpiredError") {
            return apiResponse.unauthorizedResponse(res, "Token expired");
          }
          return apiResponse.unauthorizedResponse(res, "Invalid token");
        }
        req.user = payload;
        next();
      });
    }
  } catch (err) {
    console.log(err);
    return apiResponse.errorResponse(res, "Auth Error");
  }
};

const apiKeyAuth = async (req, res, next) => {
  try {
    if (REWARDS_AUTH) {
      next();
    } else {
      const keyExists = await RewardConfigModel.findOne({ apiKeys: { $in: [req.headers["x-api-key"]] } });
      if (keyExists) {
        req.appId = keyExists.appId;
        req.rewardConfig = keyExists.config;
        next();
      }
      else throw new Error("API Key not found")
    }
  } catch (err) {
    console.log(err);
    return apiResponse.errorResponse(res, err || "API Key Error");
  }
};

const roleAuth = async (req, res, next) => {
  try {
    if (REWARDS_AUTH) {
      next();
    } else {
      const role = req.headers["role"];
      if (role) {
        const roleExists = await RewardConfigModel.findOne({ apiKeys: { $in: [req.headers["x-api-key"]] }, config: { $elemMatch: { roles: { $in: [role] } } } });
        if (roleExists) {
          req.appId = roleExists.appId;
          req.rewardConfig = roleExists.config;
          next();
        }
      }
      else {
        throw new Error("Role doesn't have permission")
      }
    }
  }
  catch (err) {
    console.log(err);
    return apiResponse.errorResponse(res, err || "Role Error")
  }
}

const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next)

module.exports = {
  asyncHandler,
  authUser,
  roleAuth,
  apiKeyAuth
};
