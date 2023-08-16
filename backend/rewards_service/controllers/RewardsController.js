const RewardModel = require("../models/RewardModel");
const RedeemModel = require("../models/RedeemModel");
const RewardUserModel = require("../models/RewardUserModel");
const apiResponse = require("../helpers/apiResponse");
const { asyncHandler, authUser, apiKeyAuth, roleAuth } = require("../middlewares/jwt");
const RewardConfigModel = require("../models/RewardConfigModel");
const cuid = require("cuid");

exports.userRewards = [
    authUser,
    asyncHandler(apiKeyAuth),
    async function (req, res) {
        try {
            const rewards = await RewardUserModel.findOne({ appId: req.appId, userId: req.user.id }).lean();
            const detailedRewards = await RewardModel.aggregate([{
                $facet: {
                    order: [{
                        $match: { eventType: "ORDER", appId: req.appId, userId: req.user.id },
                    }, {
                        $group: {
                            _id: null,
                            points: { "$sum": "$points" }
                        }
                    }],
                    shipment: [{
                        $match: { eventType: "SHIPMENT", appId: req.appId, userId: req.user.id },
                    }, {
                        $group: {
                            _id: null,
                            points: { "$sum": "$points" }
                        }
                    }],
                    lastMile: [{
                        $match: { eventType: "DOSE", appId: req.appId, userId: req.user.id },
                    }, {
                        $group: {
                            _id: null,
                            points: { "$sum": "$points" }
                        }
                    }],
                }
            }])
            const userRewards = {
                ...rewards, orderRewards: detailedRewards?.[0].order?.[0]?.points || 0,
                shipmentRewards: detailedRewards?.[0].shipment?.[0]?.points || 0,
                lastMileRewards: detailedRewards?.[0].lastMile?.[0]?.points || 0
            }
            return apiResponse.successResponseWithData(res, "User Rewards", userRewards)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.listOfRewards = [
    authUser,
    asyncHandler(apiKeyAuth),
    async function (req, res) {
        try {
            const rewards = await RewardModel.find({ appId: req.appId, userId: req.user.id })
            return apiResponse.successResponseWithData(res, "List of Rewards", rewards)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.viewReward = [
    authUser,
    asyncHandler(apiKeyAuth),
    async function (req, res) {
        try {
            const { id } = req.params;
            const reward = await RewardModel.findById(id)
            return apiResponse.successResponseWithData(res, "View Reward", reward)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.updateReward = [
    asyncHandler(apiKeyAuth),
    asyncHandler(roleAuth),
    async function (req, res) {
        try {
            const { id } = req.params;
            const reward = await RewardModel.findByIdAndUpdate(id, { $set: req.body });
            return apiResponse.successResponseWithData(res, "Update Reward", reward)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.deleteReward = [
    asyncHandler(apiKeyAuth),
    asyncHandler(roleAuth),
    async function (req, res) {
        try {
            const { id } = req.params;
            const reward = await RewardModel.findByIdAndDelete(id);
            return apiResponse.successResponseWithData(res, "Delete Reward", reward)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.addReward = [
    asyncHandler(apiKeyAuth),
    asyncHandler(roleAuth),
    async function (req, res) {
        try {
            const { event, eventType } = req.body;
            const config = req.rewardConfig.find((item) => item.event === event && item.eventType === eventType);
            const points = config ? config.points : null;
            if (points) {
                const reward = new RewardModel({ ...req.body, points, appId: req.appId });
                await reward.save();
                await RewardUserModel.findOneAndUpdate({ appId: req.appId, userId: reward.userId }, { $inc: { points: reward.points, totalPoints: reward.points } }, { upsert: true })
                return apiResponse.successResponseWithData(res, "Reward Added", reward)
            } else {
                throw new Error("Invalid Reward")
            }
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.addRedemption = [
    asyncHandler(apiKeyAuth),
    asyncHandler(roleAuth),
    async function (req, res) {
        try {
            const reward = new RedeemModel({ ...req.body, appId: req.appId });
            await reward.save();
            return apiResponse.successResponseWithData(res, "Reward Added Successfully", reward)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.listOfRedemptions = [
    authUser,
    asyncHandler(apiKeyAuth),
    async function (req, res) {
        try {
            const rewards = await RedeemModel.find({ appId: req.appId, userId: req.user.id })
            return apiResponse.successResponseWithData(res, "List of Redemptions", rewards)
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.getConfig = [
    authUser,
    asyncHandler(apiKeyAuth),
    async function (req, res) {
        try {
            return apiResponse.successResponseWithData(res, "Reward Configuration", req.rewardConfig)
        } catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err);
        }
    }
]

exports.registerApp = [
    async function (req, res) {
        try {
            const newApp = new RewardConfigModel({ ...req.body, appId: cuid(), apiKeys: ["API" + cuid()] });
            await newApp.save();
            return apiResponse.successResponseWithData(res, "App Register Successfully", newApp);
        }
        catch (err) {
            console.log(err);
            return apiResponse.errorResponse(res, err)
        }
    }
]