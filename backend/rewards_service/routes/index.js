const express = require("express");
const router = express.Router();

function health(req, res) {
    res.status(200).json({ status: "OK", message: "Reward Service" });
}

router.get("/", health);

module.exports = { router, health };
