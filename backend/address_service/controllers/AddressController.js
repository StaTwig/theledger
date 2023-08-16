const apiResponse = require("../utils/apiResponse");
const Organisation = require("../models/organisationModel");
const Warehouse = require("../models/warehouseModel");
const Inventory = require("../models/inventoryModel");
const CounterModel = require("../models/CounterModel");
const EmployeeModel = require("../models/EmployeeModel");
const WarehouseModel = require("../models/warehouseModel");
const ConfigurationModel = require("../models/ConfigurationModel");
const auth = require("../middlewares/jwt");
const XLSX = require("xlsx");
const fs = require("fs");
const axios = require("axios");

exports.addressOfOrg = [
  auth,
  async (req, res) => {
    try {
      const org = await Organisation.find({ id: req.user.organisationId })
      return apiResponse.successResponseWithData(
        res,
        "Organizations Addresses",
        org
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.addressesOfOrgWarehouses = [
  auth,
  async (req, res) => {
    try {
      const warehouses = await Warehouse.find({ $and: [{ organisationId: req.user.organisationId }, { status: "ACTIVE" }] })
      return apiResponse.successResponseWithData(
        res,
        "Warehouses Addresses",
        warehouses
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.fetchWarehousesByOrgId = [
  auth,
  async (req, res) => {
    try {
      if (!req.query?.orgId) {
        return apiResponse.validationErrorWithData(res, "Org Id not provided", { orgId: req.query.orgId });
      }
      const warehouses = await Warehouse.aggregate([
        { $match: { $and: [{ organisationId: req.query.orgId }] } },
        {
          $lookup: {
            from: "employees",
            let: { warehouseId: "$id" },
            pipeline: [
              { $match: { $expr: { $in: ["$$warehouseId", "$warehouseId"] } } },
              { $count: "total" },
            ],
            as: "employeeCount",
          },
        },
        { $unwind: "$employeeCount" },
      ])

      return apiResponse.successResponseWithData(res, "Warehouses Addresses", warehouses);
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

function getConditionForLocationApprovals(type, id) {
  let matchConditions = {};
  // let matchConditions = { status: "NOTVERIFIED" };
  matchConditions = {
    $or: [{ status: "NOTVERIFIED" }, { status: "PENDING" }],
  };
  if (type != "CENTRAL_AUTHORITY") matchConditions.organisationId = id;
  return matchConditions;
}

exports.getLocationApprovals = [
  auth,
  async (req, res) => {
    try {
      const orgType = req.user.organisationType;
      const warehouses = await Warehouse.aggregate([
        {
          $match: getConditionForLocationApprovals(
            orgType,
            req.user.organisationId
          ),
        },
        {
          $lookup: {
            from: "employees",
            let: {
              wid: "$id",
            },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$$wid", { $ifNull: ["$pendingWarehouseId", []] }] },
                },
              },
            ],
            as: "employee",
          },
        },
        { $unwind: "$employee" }
      ])
      return apiResponse.successResponseWithData(
        res,
        "Warehouses details",
        warehouses
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.updateAddressOrg = [
  auth,
  async (req, res) => {
    try {
      const org = await Organisation.findOneAndUpdate(
        { id: req.user.organisationId },
        req.body.address,
        { new: true }
      )
      return apiResponse.successResponseWithData(
        res,
        "Organization Address Updated",
        org
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.updateWarehouseAddress = [
  auth,
  async (req, res) => {
    try {
      const warehouse = await Warehouse.findOneAndUpdate(
        { id: req.query.warehouseId },
        req.body.WarehouseAddress,
        { new: true }
      )
      return apiResponse.successResponseWithData(
        res,
        "Warehouse Address Updated",
        warehouse
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.AddWarehouse = [
  auth,
  async (req, res) => {
    try {
      const invCounter = await CounterModel.findOneAndUpdate(
        { "counters.name": "inventoryId" },
        {
          $inc: {
            "counters.$.value": 1,
          },
        },
        {
          projection:
            { "counters.$": 1 }
        }
      );
      const inventoryId =
        invCounter.counters[0].format + invCounter.counters[0].value++;
      const inventoryResult = new Inventory({ id: inventoryId });
      await inventoryResult.save();
      const {
        organisationId,
        postalAddress,
        title,
        region,
        country,
        location,
        supervisors,
        employees,
        warehouseAddress,
      } = req.body;
      await CounterModel.update(
        {
          "counters.name": "warehouseId",
        },
        {
          $inc: {
            "counters.$.value": 1,
          },
        }
      );

      const warehouseCounter = await CounterModel.findOne(
        { "counters.name": "warehouseId" },
        { "counters.$": 1 }
      );
      const warehouseId =
        warehouseCounter.counters[0].format +
        warehouseCounter.counters[0].value;
      let employee = [];
      if (employees != undefined && employees.length > 0) {
        employee = employees
      }
      else {
        employee.push(req.user.id);
      }
      employee.forEach(async (emp) => {
        await EmployeeModel.findOneAndUpdate({
          id: emp,
        }, {
          $push: { warehouseId: warehouseId }
        }, {
          new: true,
        });
      });
      const warehouse = new Warehouse({
        id: warehouseId,
        title,
        organisationId,
        postalAddress,
        region,
        country,
        location,
        supervisors,
        employees,
        warehouseAddress,
        status: "ACTIVE",
        warehouseInventory: inventoryResult.id,
      });
      await warehouse.save();
      return apiResponse.successResponseWithData(
        res,
        "Warehouse added success",
        warehouse
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.AddOffice = [
  auth,
  async (req, res) => {
    try {
      const {
        organisationId,
        title,
        postalAddress,
        region,
        country,
        location,
        supervisors,
        employees,
      } = req.body;
      const warehouseCounter = await CounterModel.findOneAndUpdate(
        { "counters.name": "warehouseId" },
        {
          $inc: {
            "counters.$.value": 1,
          },
        },
        {
          projection: {
            "counters.$": 1
          }
        }
      );
      const officeId =
        warehouseCounter.counters[0].format +
        warehouseCounter.counters[0].value++;
      const office = new Warehouse({
        id: officeId,
        title,
        organisationId,
        postalAddress,
        region,
        country,
        location,
        supervisors,
        employees,
      });
      await office.save();
      return apiResponse.successResponseWithData(
        res,
        "Office added success",
        office
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.addAddressesFromExcel = [
  auth,
  async (req, res) => {
    try {
      const dir = `uploads`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      const workbook = XLSX.readFile(req.file.path);
      const sheet_name_list = workbook.SheetNames;
      const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]],
        { dateNF: "dd/mm/yyyy;@", cellDates: true, raw: false }
      );

      const incrementCounterInv = await CounterModel.update(
        {
          "counters.name": "inventoryId",
        },
        {
          $inc: {
            "counters.$.value": 1,
          },
        }
      );

      const invCounter = await CounterModel.findOne(
        { "counters.name": "inventoryId" },
        { "counters.$": 1 }
      );

      const incrementCounterWarehouse = await CounterModel.update(
        {
          "counters.name": "warehouseId",
        },
        {
          $inc: {
            "counters.$.value": 1,
          },
        }
      );

      const warehouseCounter = await CounterModel.findOne(
        { "counters.name": "warehouseId" },
        { "counters.$": 1 }
      );

      for (const [index, address] of data.entries()) {
        let inventoryResult = new Inventory({
          id:
            invCounter.counters[0].format +
            (parseInt(invCounter.counters[0].value) + parseInt(index)),
        });
        await inventoryResult.save();
        let warehouseId =
          warehouseCounter.counters[0].format +
          (parseInt(warehouseCounter.counters[0].value) + parseInt(index));
        const latlong = await axios.get("https://nominatim.openstreetmap.org/search/" +
          address.city +
          "?format=json&addressdetails=1&limit=1")
        const user = await EmployeeModel.findOne({
          $or: [
            { emailId: address.user },
            { phoneNumber: address.user },
          ]
        })
        const reqData = {
          id: warehouseId,
          warehouseInventory: inventoryResult.id,
          title: address.title,
          organisationId: req.user.organisationId,
          warehouseAddress: {
            firstLine: address.line,
            secondLine: "",
            city: address.city,
            state: address.state,
            country: address.country,
            landmark: "",
            zipCode: address.pincode,
          },
          country: {
            countryId: "001",
            countryName: address.country,
          },
          region: {
            regionId: "reg123",
            regionName: "Earth Prime",
          },
          location: {
            longitude: latlong.data?.length ? latlong.data[0].lon : "12.12323453534",
            latitude: latlong.data?.length ? latlong.data[0].lat : "13.123435345435",
            geohash: "1231nejf923453",
          },
          supervisors: [],
          employees: [user.id],
        };
        const warehouse = new Warehouse(reqData);
        await warehouse.save();
        if (address?.user) {
          await EmployeeModel.updateOne(
            {
              $or: [
                { emailId: address.user },
                { phoneNumber: address.user },
              ],
            },
            { $push: { warehouseId: warehouseId } }
          );
        }
      }
      await CounterModel.updateOne(
        {
          "counters.name": "warehouseId",
        },
        {
          $inc: {
            "counters.$.value": data.length,
          },
        }
      );
      await CounterModel.updateOne(
        {
          "counters.name": "inventoryId",
        },
        {
          $inc: {
            "counters.$.value": data.length,
          },
        }
      );
      return apiResponse.successResponseWithData(res, "Success", data);
    } catch (e) {
      console.log(e)
      return apiResponse.errorResponse(res, e);
    }
  },
];

exports.modifyLocation = [
  auth,
  async (req, res) => {
    try {
      const { id, type } = req.body;
      const updatedWarehouse = await Warehouse.findOneAndUpdate(
        { id: id },
        { status: type === 1 ? "ACTIVE" : "REJECTED" },
        { new: true }
      )
      const eid = req.body?.eid || updatedWarehouse.employees?.[0];
      if (eid) {
        const conf = await ConfigurationModel.findOne({ id: "CONF000" })
          .select("active_locations")
        if (conf?.active_locations === 1 && type == 1) {
          await EmployeeModel.updateOne(
            {
              id: eid,
            },
            {
              $set: {
                warehouseId: [id],
              },
              $pull: {
                pendingWarehouseId: id
              }
            }
          );
        }
        else if (type == 1) {
          await EmployeeModel.updateOne(
            {
              id: eid,
            },
            {
              $push: {
                warehouseId: id
              },
              $pull: {
                pendingWarehouseId: id
              }
            }
          );
        } else {
          await EmployeeModel.updateOne(
            {
              id: eid,
            },
            {
              $pull: {
                pendingWarehouseId: id,
              },
            }
          );
        }
      }
      return apiResponse.successResponse(
        res,
        "Location " + (type == 1 ? "Approved" : "Rejected"),
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.getCountries = [
  auth,
  async (req, res) => {
    try {
      const countries = await WarehouseModel.aggregate([{ $match: { 'warehouseAddress.region': req.query.region } },
      {
        $group:
        {
          _id: "$warehouseAddress.country",
        }
      }
      ]);
      return apiResponse.successResponseWithData(
        res,
        "Operation success",
        countries
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err.message);
    }
  },
];

exports.getStatesByCountry = [
  auth,
  async (req, res) => {
    try {
      const allStates = await WarehouseModel.aggregate([{ $match: { 'warehouseAddress.country': req.query.country } },
      {
        $group:
        {
          _id: "$warehouseAddress.state",
        }
      }
      ]);
      return apiResponse.successResponseWithData(
        res,
        "Operation success",
        allStates
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err.message);
    }
  },
];

exports.getCitiesByState = [
  auth,
  async (req, res) => {
    try {
      const allCities = await WarehouseModel.aggregate([{ $match: { 'warehouseAddress.state': req.query.state } },
      {
        $group:
        {
          _id: "$warehouseAddress.city",
        }
      }
      ]);
      return apiResponse.successResponseWithData(
        res,
        "Operation success",
        allCities
      );
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err.message);
    }
  },
];
