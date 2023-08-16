require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const indexRouter = require("./routes/index");
const apiResponse = require("./helpers/apiResponse");
const { RbacCache } = require("./helpers/rbacCache");
const cors = require("cors");
const helmet = require('helmet')

// DB connection
const MONGODB_URL = process.env.MONGODB_URL;
const mongoose = require("mongoose");
mongoose
  .connect(MONGODB_URL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    //don't show the log when it is test
    if (process.env.NODE_ENV !== "test") {
      console.log("Connected to %s", MONGODB_URL);
      console.log("RBAC Service is running ... \n");
    }
    RbacCache();
  })
  .catch((err) => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });

const app = express();

//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//To allow cross-origin requests
app.use(helmet())
app.use(cors());

//Route Prefixes
app.use("/rbacmanagement/api/", indexRouter);

// app.get("/", (req, res) => {
// 	return res.json("test")
// })
// throw 404 if URL not found
app.all("*", function (req, res) {
  return apiResponse.notFoundResponse(res, "API not found");
});

app.use((err, req, res) => {
  if (err.name == "UnauthorizedError") {
    return apiResponse.unauthorizedResponse(res, err.message);
  }
});

module.exports = app;
