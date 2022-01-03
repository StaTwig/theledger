const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
  res.status(200).json({ status: "OK", message: "Event Service" });
});

module.exports = router;
