const express = require("express");
const rewardsController = require("../controllers/RewardsController");
const healthRouter = require("./index")
const router = express.Router();

router.get("/health", healthRouter.health)
router.get("/rewards", rewardsController.userRewards)
router.post("/rewards", rewardsController.addReward)
router.get("/rewards/:id", rewardsController.viewReward)
router.put("/rewards/:id", rewardsController.updateReward)
router.delete("/rewards/:id", rewardsController.deleteReward);
router.get("/rewardsList", rewardsController.listOfRewards)
router.get("/redemptions", rewardsController.listOfRedemptions)
router.post("/redemptions", rewardsController.addRedemption)
router.get("/config", rewardsController.getConfig)
router.post("/registerApp", rewardsController.registerApp)

module.exports = router;
