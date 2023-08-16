const express = require("express");
const AnalyticsController = require("../controllers/AnalyticsController");
const router = express.Router();

router.post("/bestSellers", AnalyticsController.bestSellers);
router.get("/bestSellerSummary", AnalyticsController.bestSellerSummary);
router.post("/inStockReport", AnalyticsController.inStockReport);
router.post("/outOfStockReport", AnalyticsController.outOfStockReport);
router.post("/expiredStockReport", AnalyticsController.expiredStockReport);
router.post("/nearExpiryStockReport", AnalyticsController.nearExpiryStockReport);
router.post("/inStockFilterOptions", AnalyticsController.inStockFilterOptions);
router.post("/outStockFilterOptions", AnalyticsController.outOfStockFilterOptions);
router.post("/nearExpiryFilterOptions", AnalyticsController.nearExpiryFilterOptions);
router.post("/expiredFilterOptions", AnalyticsController.expiredFilterOptions);
router.post("/bestSellerFilterOptions", AnalyticsController.bestSellerFilterOptions);
router.post("/getNetworkAnalytics", AnalyticsController.getNetworkAnalytics);
module.exports = router;
