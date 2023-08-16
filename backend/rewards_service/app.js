require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const MONGODB_URL = process.env.MONGODB_URL;
const indexRouter = require("./routes/index");
const rewardsRouter = require("./routes/api");
const apiResponse = require("./helpers/apiResponse");

const app = express();
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      console.log("Connected to %s", MONGODB_URL);
      console.log("Rewards Service is running");
    }
  })
  .catch((err) => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: false }));

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter.router);
app.use("/rewardmanagement/api/", rewardsRouter);

// throw 404 if URL not found
app.all("*", function (req, res) {
  return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
  if (err.name == "UnauthorizedError") {
    return apiResponse.unauthorizedResponse(res, err.message);
  }
});

module.exports = app;
