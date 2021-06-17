var express = require("express");
const AuthController = require("../controllers/AuthController");
var multer = require("multer");
var upload = multer({ dest: "uploads/" });
// const Storage = multer.diskStorage({
//   destination(req, file, callback) {
//     callback(null, "/home/ubuntu/userimages");
//   },
//   filename(req, file, callback) {
//     callback(null, file.originalname);
//   },
// });

// const upload = multer({ storage: Storage });

var router = express.Router();

router.post("/check", AuthController.checkEmail);
router.post("/register", AuthController.register);
router.post("/sendOtp", AuthController.sendOtp);
router.post("/verifyOtp", AuthController.verifyOtp);
router.get("/userInfo", AuthController.userInfo);
router.get("/getAllUsers", AuthController.getAllUsers);
router.post("/updateProfile", AuthController.updateProfile);
router.post("/updatePassword", AuthController.updatePassword);
router.post("/upload", upload.single("profile"), AuthController.uploadImage);
router.get("/createAddress", AuthController.createUserAddress);
router.post("/assignProductConsumer", AuthController.assignProductConsumer);
router.post("/addWarehouse", AuthController.addWarehouse);
router.post("/updateWarehouse", AuthController.updateWarehouseAddress);
router.get("/getAllRegisteredUsers", AuthController.getAllRegisteredUsers);
router.get("/getAllUsersByOrganisation/:organisationId", AuthController.getAllUsersByOrganisation);
router.get("/getAllUsersByWarehouse/:warehouseId", AuthController.getAllUsersByWarehouse);
router.post("/uploadImage", upload.single('photo'), AuthController.uploadImage);
router.get("/fetchImage", AuthController.fetchImage);
router.get("/getUserWarehouses", AuthController.getUserWarehouses);
router.get("/abinbev/getOrganizationsByType", AuthController.getOrganizationsByTypeForAbInBev);
router.get("/getOrganizationsByType", AuthController.getOrganizationsByType);
router.get("/getwarehouseByType", AuthController.getwarehouseByType);
router.get("/getwarehouseinfo", AuthController.getwarehouseinfo);
router.get("/getOrganizationsTypewithauth", AuthController.getOrganizationsTypewithauth);
router.get("/emailverify", AuthController.emailverify);
module.exports = router;
