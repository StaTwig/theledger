const mongoose = require("mongoose");

const RewardConfigSchema = new mongoose.Schema(
    {
        appId: { type: String, required: true },
        name: { type: String },
        config: [{
            event: { type: String },
            eventType: { type: String },
            roles: { type: [String], default: [] },
            points: { type: Number, min: 0, default: 0 },
        }],
        apiKeys: { type: [String], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("reward_configs", RewardConfigSchema);
