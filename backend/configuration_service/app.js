/**
 * Declaring
 */
const express = require("express")
const apiResponse = require("./helpers/apiResponse")
const cors = require("cors")
const morgan = require('morgan')
const path = require("path")
const fs = require("fs")
const router = require("./routes/api")
const mongoose = require("mongoose")
require('dotenv').config({ path: __dirname + '/.env' })
/**
 * Initialization
 */
const app = express()
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

mongoose.connect(process.env.MONGODB_URL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    if (process.env.NODE_ENV !== "test") {
        console.log("Connected to %s", process.env.MONGODB_URL);
        console.log("App is running ... \n");
        console.log("Press CTRL + C to stop the process. \n");
    }
})
    .catch(err => {
        console.error("App starting error:", err.message);
        process.exit(1);
    });

/**
 * Middleware
 */
app.use(morgan("short", { stream: accessLogStream }))
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

/**
 * Routes
 */

app.use("/api/configuration_service", router);

// throw 404 if URL not found
app.all("*", function (req, res) {
    return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
    if (err.name == "UnauthorizedError") {
        return apiResponse.unauthorizedResponse(res, err.message);
    }
})
module.exports = app;

