const mongoose = require("mongoose");
const RecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    externalId: { type: String },
    creationDate: {
      type: Date,
    },
    createdBy: {
      type: String,
    },
    supplier: {
      type: Object,
    },
    customer: {
      type: Object,
    },
    products: {
      type: Array,
      default: [],
    },
    poStatus: { type: String, default: "CREATED" },
    poUpdates: { type: Array, default: [] },
    lastUpdatedBy: { type: String },
    lastUpdatedOn: {
      type: String,
    },
    shippingOrders: {
      type: Array,
      default: [],
    },
    shipments: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Record", RecordSchema);
