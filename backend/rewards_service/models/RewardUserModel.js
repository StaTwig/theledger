const mongoose = require("mongoose");

const RewardUserSchema = new mongoose.Schema(
    {
        appId: { type: String, required: true },
        userId: { type: String, required: true },
        userOrgId: { type: String, required: true },
        userWarehouseId: { type: String, required: true },
        points: { type: Number, default: 0, min: 0 },
        totalPoints: { type: Number, default: 0, min: 0 },
        redeemedPoints: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("reward_user", RewardUserSchema);
