require("dotenv").config();
const EmployeeModel = require("../models/EmployeeModel");
const CounterModel = require("../models/CounterModel");
const InventoryModel = require("../models/InventoryModel");
const OrganisationModel = require("../models/OrganisationModel");
const WarehouseModel = require("../models/WarehouseModel");
const auth = require("../middlewares/jwt");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const RequestApproved = require("../components/RequestApproved");
const RejectedApproval = require("../components/RejectedApproval");
const AddUserEmail = require("../components/AddUser");
const apiResponse = require("../helpers/apiResponse");
const fs = require("fs");
const { getLatLongByCity } = require("../helpers/getLatLong");
const XLSX = require("xlsx");

async function createWarehouse(warehouseExists, wareId, payload, employeeId) {
  try {
    if (warehouseExists) {
      await EmployeeModel.findOneAndUpdate({ id: wareId }, { $push: { warehouseId: wareId } });
    } else {
      const invCounter = await CounterModel.findOneAndUpdate(
        { "counters.name": "inventoryId" },
        {
          $inc: {
            "counters.$.value": 1,
          },
        },
        { new: true },
      );
      const inventoryId = invCounter.counters[7].format + invCounter.counters[7].value;
      const inventoryResult = new InventoryModel({ id: inventoryId });
      await inventoryResult.save();
      const {
        organisationId,
        postalAddress,
        title,
        region,
        country,
        warehouseAddress,
        supervisors,
        employees,
      } = payload;
      const warehouseCounter = await CounterModel.findOneAndUpdate(
        { "counters.name": "warehouseId" },
        {
          $inc: {
            "counters.$.value": 1,
          },
        },
        {
          new: true,
        },
      );
      const warehouseId = warehouseCounter.counters[3].format + warehouseCounter.counters[3].value;

      const loc = await getLatLongByCity(warehouseAddress.city + "," + warehouseAddress.country);
      const warehouse = new WarehouseModel({
        id: warehouseId,
        organisationId,
        postalAddress,
        title,
        region: {
          regionName: region,
        },
        country: {
          countryId: "001",
          countryName: country,
        },
        location: loc,
        bottleCapacity: 0,
        sqft: 0,
        supervisors,
        employees,
        warehouseAddress: {
          firstLine: warehouseAddress.line1,
          secondLine: "",
          region: warehouseAddress.region,
          city: warehouseAddress.city,
          state: warehouseAddress.state,
          country: warehouseAddress.country,
          landmark: "",
          zipCode: warehouseAddress.pincode,
        },
        warehouseInventory: inventoryResult.id,
        status: "ACTIVE",
      });
      await warehouse.save();

      const addr = `${warehouseAddress?.firstLine}, ${warehouseAddress?.city}, ${warehouseAddress?.state}, ${warehouseAddress?.zipCode}`;
      const skipOrgRegistration = false;
      await OrganisationModel.findOneAndUpdate(
        {
          id: organisationId,
        },
        {
          $set: {
            ...(skipOrgRegistration
              ? {
                postalAddress: addr,
                country: warehouseAddress.country,
                region: warehouseAddress.region,
                status: "NOTVERIFIED",
              }
              : {}),
          },
          $push: {
            warehouses: warehouseId,
          },
        },
      );

      await EmployeeModel.findOneAndUpdate(
        {
          id: employeeId,
        },
        {
          $set: {
            role: "admin",
          },
          $addToSet: {
            warehouseId: warehouseId,
          },
        },
      );
    }
  } catch (err) {
    throw err;
  }
}

exports.getApprovals = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const employees = await EmployeeModel.aggregate([
        {
          $match: {
            $and: [{ accountStatus: "NOTAPPROVED" }, { organisationId: organisationId }],
          },
        },
        {
          $lookup: {
            from: "organisations",
            localField: "organisationId",
            foreignField: "id",
            as: "orgDetails",
          },
        },
        {
          $unwind: {
            path: "$orgDetails",
          },
        },
        { $sort: { createdAt: -1 } },
      ]);
      return apiResponse.successResponseWithData(
        req,
        res,
        "List of Users Not verified / get Approval List",
        employees
      );
    } catch (err) {
      return apiResponse.errorResponse(req, res, err);
    }
  },
];

exports.acceptApproval = [
  auth,
  async (req, res) => {
    const errorList = new Array();
    try {
      const { organisationName } = req.user;
      const { id, role, warehouseId, phoneNumber } = req.query;
      const employee = await EmployeeModel.findOne({
        $and: [{ accountStatus: "NOTAPPROVED" }, { id: id }],
      })
      if (employee) {
        const emp = await EmployeeModel.findOneAndUpdate(
          { id: id },
          {
            $set: {
              accountStatus: "ACTIVE",
              isConfirmed: true,
              role,
              phoneNumber,
            },
            $push: { warehouseId },
          },
          { new: true }
        )
        const emailBody = RequestApproved({
          name: emp.firstName,
          organisation: organisationName,
        });
        // Send confirmation email
        await
          mailer.send(
            constants.appovalEmail.from,
            emp.emailId,
            constants.appovalEmail.subject,
            emailBody
          );
        return apiResponse.successResponseWithData(
          req,
          res,
          `User Verified`,
          emp
        );

      } else {
        return apiResponse.notFoundResponse(req, res, "User Not Found");
      }
    } catch (err) {
      errorList.push(err);
      return apiResponse.errorResponse(req, res, errorList);
    }
  },
];

exports.rejectApproval = [
  auth,
  async (req, res) => {
    try {
      const { organisationId, organisationName } = req.user;
      const { id } = req.query;
      await EmployeeModel.findOne({
        $and: [
          { accountStatus: "NOTAPPROVED" },
          { organisationId: organisationId },
          { id: id },
        ],
      })
        .then((employees) => {
          if (employees) {
            EmployeeModel.findOneAndUpdate(
              { id },
              { $set: { accountStatus: "REJECTED" } },
              { new: true }
            )
              .exec()
              .then((emp) => {
                console.log("REJECTED");
                let emailBody = RejectedApproval({
                  name: emp.firstName,
                  organisation: organisationName,
                });
                try {
                  mailer.send(
                    constants.rejectEmail.from,
                    emp.emailId,
                    constants.rejectEmail.subject,
                    emailBody
                  );
                } catch (err) {
                  console.log(err);
                }
                try {
                  EmployeeModel.findOneAndDelete({ id }).then(() =>
                    console.log("deleted")
                  );
                } catch (err) {
                  console.log(err);
                  return apiResponse.errorResponse(req, res, err);
                }
                return apiResponse.successResponseWithData(
                  req,
                  res,
                  "User Rejected",
                  emp
                );
              })
              .catch((err) => {
                return apiResponse.errorResponse(req, res, err);
              });
          } else {
            return apiResponse.notFoundResponse(req, res, "User not Found");
          }
        })
        .catch((err) => {
          return apiResponse.errorResponse(req, res, err);
        });
    } catch (err) {
      return apiResponse.errorResponse(req, res, err);
    }
  },
];

exports.addUser = [
  auth,
  async (req, res) => {
    try {
      const { organisationId, organisationName } = req.user;
      const email =
        !req.body.emailId || req.body.emailId == "null"
          ? null
          : req.body.emailId;
      const warehouse = req.body.warehouseId;
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      // const firstName = email?.split("@")[0];
      const phoneNumber = req.body.phoneNumber
        ? "+" + req.body.phoneNumber
        : null;
      await CounterModel.updateOne(
        {
          "counters.name": "employeeId",
        },
        {
          $inc: {
            "counters.$.value": 1,
          },
        }
      );

      const employeeCounter = await CounterModel.findOne(
        { "counters.name": "employeeId" },
        { "counters.$": 1 }
      );
      var employeeId =
        employeeCounter.counters[0].format +
        employeeCounter.counters[0].value;

      const user = new EmployeeModel({
        firstName: firstName,
        lastName: lastName,
        emailId: email,
        phoneNumber: phoneNumber,
        organisationId: organisationId,
        role: req.body.role,
        accountStatus: "ACTIVE",
        warehouseId: warehouse,
        isConfirmed: true,
        id: employeeId,
      });
      await user.save();

      const payload = {
        organisationId: organisationId,
        postalAddress: req.body.address.line1,
        title: req.body.warehouseTitle,
        region: req.body.address.region,
        country: req.body.address.country,
        warehouseAddress: req.body.address,
        supervisors: [],
        employees: [employeeId],
      }
      await createWarehouse(req.body.warehouseExists !== "new", warehouse || null, payload, employeeId)
      let emailBody = AddUserEmail({
        name: firstName,
        organisation: organisationName,
      });
      await mailer
        .send(
          constants.addUser.from,
          req.body.emailId,
          constants.addUser.subject,
          emailBody
        )
      return apiResponse.successResponse(req, res, "User Added");
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(req, res, err);
    }
  },
];

exports.updateUserRole = [
  auth,
  async (req, res) => {
    try {
      const { userId, role } = req.query;
      const result = await EmployeeModel.findOneAndUpdate(
        { id: userId },
        { $set: { role: role } },
        { new: true },
      );

      if (result) {
        return apiResponse.successResponse(req, res, "User role updated successfully!");
      } else {
        throw new Error("Error in updating user role!");
      }
    } catch (err) {
      return apiResponse.errorResponse(req, res, err);
    }
  }
]

exports.activateUser = [
  auth,
  async (req, res) => {
    try {
      const { organisationName } = req.user;
      const { id, role } = req.query;
      const employee = await EmployeeModel.findOne({ id: id });
      if (employee) {
        if (employee.isConfirmed && employee.accountStatus == "ACTIVE") {
          return apiResponse.successResponseWithData(req, res, " User is already Active", employee);
        } else {
          const emp = await EmployeeModel.findOneAndUpdate(
            { id: id },
            {
              $set: {
                accountStatus: "ACTIVE",
                isConfirmed: true,
                role,
              },
            },
            { new: true },
          );
          const emailBody = RequestApproved({
            name: emp.firstName,
            organisation: organisationName,
          });
          await mailer.send(
            constants.appovalEmail.from,
            emp.emailId,
            constants.appovalEmail.subject,
            emailBody,
          );
          return apiResponse.successResponseWithData(req, res, `User Activated`, emp);
        }
      } else {
        return apiResponse.notFoundResponse(req, res, "User Not Found");
      }
    } catch (err) {
      return apiResponse.errorResponse(req, res, err);
    }
  },
];

exports.deactivateUser = [
  auth,
  (req, res) => {
    try {
      const { organisationName } = req.user;
      const { id } = req.query;
      EmployeeModel.findOneAndUpdate(
        { id },
        { $set: { accountStatus: "REJECTED" } },
        { new: true }
      )
        .exec()
        .then((emp) => {
          console.log("REJECTED");
          let emailBody = RejectedApproval({
            name: emp.firstName,
            organisationName,
          });
          try {
            mailer.send(
              constants.rejectEmail.from,
              emp.emailId,
              constants.rejectEmail.subject,
              emailBody
            );
          } catch (err) {
            console.log(err);
          }
          return apiResponse.successResponseWithData(
            req,
            res,
            "User Rejected",
            emp
          );
        })
        .catch((err) => {
          return apiResponse.errorResponse(req, res, err);
        });
    } catch (err) {
      return apiResponse.errorResponse(req, res, err);
    }
  },
];

// LOOKS DUPLICATE, use the one in AuthController
exports.addUsersFromExcel = [
  auth,
  async (req, res) => {
    try {

      try {
        const { organisationName } = req.user;
        const dir = `uploads`;
        if (!fs.existsSync(dir))
          fs.mkdirSync(dir);
        const workbook = XLSX.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        let data = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheet_name_list[0]],
          { dateNF: "dd/mm/yyyy;@", cellDates: true, raw: false }
        );

        console.log(data.entries());

        const formatedData = new Array();
        for (const [index, user] of data.entries()) {
          const firstName =
            user?.["FIRST NAME"] || user?.["NOMBRE"];
          const phoneNumber =
            user?.["PHONE"] || user?.["TEL CELULAR"];
          const lastName = user?.["LAST NAME"] || user?.["APELLIDO"];
          const emailId =
            user?.["EMAIL"] || user?.["EMAIL"];
          const role =
            user?.["ROLE"] || user?.["UNIDAD DE MEDIDA"];
          const accountStatus = "ACTIVE"
          const warehouseId =
            user?.["WAREHOUSE"] || user?.["FECHA DE VENCIMIENTO"];
          const { organisationId } = req.user;
          formatedData[index] = {
            firstName: firstName,
            lastName: lastName,
            emailId: emailId,
            phoneNumber: phoneNumber,
            organisationId: organisationId,
            role: role,
            accountStatus: accountStatus,
            warehouseId: warehouseId,
            isConfirmed: true,
            // id: id,
          };
        }

        for (const user of formatedData) {
          await CounterModel.updateOne(
            {
              "counters.name": "employeeId",
            },
            {
              $inc: {
                "counters.$.value": 1,
              },
            }
          );

          const employeeCounter = await CounterModel.findOne(
            { "counters.name": "employeeId" },
            { "counters.$": 1 }
          );
          var employeeId =
            employeeCounter.counters[0].format +
            employeeCounter.counters[0].value;
          console.log(user)
          const User = new EmployeeModel({
            ...user, id: employeeId
          });
          await User.save();
          let emailBody = AddUserEmail({
            name: user.firstName,
            organisation: organisationName,
          });
          mailer
            .send(
              constants.addUser.from,
              user.emailId,
              constants.addUser.subject,
              emailBody
            )
            .catch((err) => {
              console.log("Error in mailing user!", err);
            });
        }
        return apiResponse.successResponseWithData(
          req,
          res,
          "success",
          formatedData
        );
      }
      catch (err) {
        console.log(err);
        return apiResponse.errorResponse(req, res, err);
      }
    } catch (err) {
      console.log(err);
    }
  },
];