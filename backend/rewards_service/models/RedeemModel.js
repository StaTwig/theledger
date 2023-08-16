const mongoose = require("mongoose");
const cuid = require("cuid");

const RedeemSchema = new mongoose.Schema(
    {
        appId: { type: String, required: true },
        redeemId: { type: String, default: cuid },
        userId: { type: String, required: true },
        userOrgId: { type: String, required: true },
        userWarehouseId: { type: String, required: true },
        points: { type: Number, default: 0, min: 0 },
        remainingPoints: { type: Number, default: 0, min: 0 },
        currency: { type: String, required: true },
        value: { type: Number, required: true },
        walletAddress: { type: String },
        kycData: { type: Object },
        remarks: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("redeem", RedeemSchema);


/*
Model to be updated with new Redeem Requirements
*/