const mongoose = require("mongoose");

const InventoryAnalytics = new mongoose.Schema(
  {
    inventoryId: { type: String, required: true },
    date: { type: String, required: true }, // start of month, yyyy-MM-dd
    productId: { type: String, required: true },
    quantity: { type: Number, min: 0, default: 0 },
    quantityInTransit: { type: Number, min: 0, default: 0 },
    sales: { type: Number, min: 0, default: 0 },
    openingBalance: { type: Number, min: 0, default: 0 },
    outOfStockDays: { type: Number, min: 0, default: 0 },
    dailyAnalytics: [],
  },
  { timestamps: true }
);
module.exports = mongoose.model("inventory_analytics", InventoryAnalytics);
