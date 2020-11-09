const { body, validationResult } = require('express-validator');
const moveFile = require('move-file');
const XLSX = require('xlsx');
//helper file to prepare responses.
const apiResponse = require('../helpers/apiResponse');
const utility = require('../helpers/utility');
const auth = require('../middlewares/jwt');
const InventoryModel = require('../models/InventoryModel');
const NotificationModel = require('../models/NotificationModel');

const checkToken = require('../middlewares/middleware').checkToken;
const checkPermissions = require('../middlewares/rbac_middleware')
  .checkPermissions;
const axios = require('axios');

const fs = require('fs');
const blockchain_service_url = process.env.URL;
const product_service_url = process.env.PRODUCT_URL;

const stream_name = process.env.STREAM;

const init = require('../logging/init');
const logger = init.getLog();

exports.getTotalCount = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getTotalCount : token verifed successfully',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, permissionResult => {
            if (permissionResult.success) {
              res.json('Total inventory count');
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getTotalCount : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getTotalCount : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getTotalCountOnHold = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getTotalCountOnHold : token verified successfully',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, permissionResult => {
            if (permissionResult.success) {
              res.json('Total inventory count on Hold');
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getTotalCountOnHold : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getTotalCountOnHold : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getExpiringInventory = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getExpiringInventory : token verified successfully',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, permissionResult => {
            if (permissionResult.success) {
              res.json('Total inventory count expiring');
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getExpiringInventory : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getExpiringInventory : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getInventoryforProduct = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getInventoryforProduct : token verified successfullly',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, permissionResult => {
            if (permissionResult.success) {
              const { product_id } = result.data.key;
              res.json('Inventory details for product');
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getInventoryforProduct : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getInventoryforProduct : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getInventoryDetailsForProduct = [
  auth,
  (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getInventoryDetailsForProduct : token verified successfullly, querying data by key',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { key } = req.query;
              const response = await axios.get(
                `${blockchain_service_url}/queryDataByKey?stream=${stream_name}&key=${key}`,
              );
              const items = response.data.items;
              logger.log('items', items);
              logger.log(
                'info',
                '<<<<< InventoryService < InventoryController < getInventoryDetailsForProduct : queried data by key',
              );
              res.json({ data: items });
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getInventoryDetailsForProduct : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getInventoryDetailsForProduct : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

var total_inv = 0,
  total_qty = 0,
  total_ne = 0,
  total_ne = 0;
var today_inv = 0,
  week_inv = 0,
  month_inv = 0,
  year_inv = 0,
  prev_year_inv = 0;
var today_qty = 0,
  week_qty = 0,
  month_qty = 0,
  year_qty = 0,
  prev_year_qty = 0;
var today_exp = 0,
  week_exp = 0,
  month_exp = 0,
  year_exp = 0,
  prev_year_exp = 0;
var today_ne = 0,
  week_ne = 0,
  month_ne = 0,
  year_ne = 0;
var total_exp = 0;

function getDateDiff(dateOne, dateTwo, dateThree, dateFour, quantity) {
  if (
    (dateOne.charAt(2) == '-' || dateOne.charAt(1) == '-') &
    (dateTwo.charAt(2) == '-' || dateTwo.charAt(1) == '-')
  ) {
    dateOne = new Date(formatDate(dateOne));
    dateTwo = new Date(formatDate(dateTwo));
    dateThree = new Date(formatDate(dateThree));
    dateFour = new Date(formatDate(dateFour));
  } else {
    dateOne = new Date(dateOne);
    dateTwo = new Date(dateTwo);
    dateThree = new Date(dateThree);
    dateFour = new Date(dateFour);
  }

  let timeDiff = Math.abs(dateOne.getTime() - dateTwo.getTime());
  let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  let timeDiff1 = Math.abs(dateThree.getTime() - dateFour.getTime());
  let diffDays1 = Math.ceil(timeDiff1 / (1000 * 3600 * 24));
  if (dateTwo < dateOne) {
    switch (true) {
      case diffDays == 0:
        today_exp++;
      case diffDays >= 0 && diffDays <= 7:
        week_exp++;
      case diffDays >= 0 && diffDays <= 30:
        month_exp++;
      case diffDays >= 0 && diffDays <= 365:
        year_exp++;
      case diffDays == 0:
        prev_year_exp++;
    }
  } else if (dateTwo >= dateOne && diffDays < 30) {
    switch (true) {
      case diffDays == 0:
        today_ne++;
      case diffDays >= 0 && diffDays <= 7:
        week_ne++;
      case diffDays >= 0 && diffDays <= 30:
        month_ne++;
      case diffDays >= 0 && diffDays <= 365:
        year_ne++;
    }
  }
  switch (true) {
    case diffDays1 == 0:
      today_inv++;
      today_qty += quantity;
    case diffDays1 >= 0 && diffDays1 <= 7:
      week_inv++;
      week_qty += quantity;
    case diffDays1 >= 0 && diffDays1 <= 30:
      month_inv++;
      month_qty += quantity;
    case diffDays1 >= 0 && diffDays1 <= 365:
      year_inv++;
      year_qty += quantity;
    case diffDays1 > 365:
      prev_year_inv++;
      prev_year_qty += quantity;
  }

  return {
    today_inv,
    week_inv,
    month_inv,
    year_inv,
    today_qty,
    week_qty,
    month_qty,
    year_qty,
    today_ne,
    week_ne,
    month_ne,
    year_ne,
    today_exp,
    week_exp,
    month_exp,
    year_exp,
  };
}

function formatDate(date) {
  return date
    .split('-')
    .reverse()
    .join('-');
}

exports.getAllInventoryDetails = [
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < getAllInventoryDetails : token verified successfullly, querying data by publisher',
          );

          permission_request = {
            result: result,
            permissionRequired: 'viewInventory',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { address } = req.user;
              const { skip, limit } = req.query;
              let chunkUrls = [];

              /* InventoryModel.collection.dropIndexes(function(){
                InventoryModel.collection.reIndex(function(finished){
                  console.log("finished re indexing")
                })
              })*/
              // InventoryModel.createIndexes();
              const inventoryResult = await InventoryModel.find({
                owner: address,
              })
                .sort({ createdAt: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit));
              inventoryResult.forEach(inventory => {
                const chunkUrl = axios.get(
                  `${blockchain_service_url}/queryDataByKey?stream=${stream_name}&key=${
                    inventory.serialNumber
                  }`,
                );
                chunkUrls.push(chunkUrl);
              });
              const responses = await axios.all(chunkUrls);
              const items = responses.map(response => response.data.items[0]);
              const productNamesResponse = await axios.get(
                `${product_service_url}/getProductNames`,
                {
                  headers: {
                    Authorization: req.headers.authorization,
                  },
                },
              );

              const products_array = productNamesResponse.data.data.map(
                product => product.productName,
              );

              logger.log(
                'info',
                '<<<<< InventoryService < InventoryController < getAllInventoryDetails : queried and pushed data',
              );
              const nextYear = new Date(
                new Date().setFullYear(new Date().getFullYear() + 1),
              );
              nextYear.setMonth(0);
              nextYear.setUTCHours(0, 0, 0, 0);
              nextYear.setDate(1);
              const thisYear = new Date(
                new Date().setFullYear(new Date().getFullYear()),
              );
              thisYear.setMonth(0);
              thisYear.setDate(1);
              thisYear.setUTCHours(0, 0, 0, 0);
              const nextMonth = new Date(
                new Date().setMonth(new Date().getMonth() + 1),
              );
              nextMonth.setUTCHours(0, 0, 0, 0);
              const thisMonth = new Date(
                new Date().setMonth(new Date().getMonth()),
              );
              thisMonth.setUTCHours(0, 0, 0, 0);
              const nextWeek = new Date(
                new Date().setDate(new Date().getDate() + 7),
              );
              nextWeek.setUTCHours(0, 0, 0, 0);
              const thisWeek = new Date(
                new Date().setDate(new Date().getDate()),
              );
              thisWeek.setUTCHours(0, 0, 0, 0);
              const tomorrow = new Date(
                new Date().setDate(new Date().getDate() + 1),
              );
              tomorrow.setUTCHours(0, 0, 0, 0);
              const today = new Date();
              today.setUTCHours(0, 0, 0, 0);

              total_inv = await InventoryModel.find({
                owner: address,
              }).countDocuments();
              const thisYearAdded = await InventoryModel.find({
                owner: address,
                createdAt: {
                  $gte: thisYear.toISOString(),
                  $lte: nextYear.toISOString(),
                },
              }).countDocuments();
              const thisMonthAdded = await InventoryModel.find({
                owner: address,
                createdAt: {
                  $gte: thisMonth.toISOString(),
                  $lte: nextMonth.toISOString(),
                },
              }).countDocuments();
              const thisWeekAdded = await InventoryModel.find({
                owner: address,
                createdAt: {
                  $gte: thisWeek.toISOString(),
                  $lte: nextWeek.toISOString(),
                },
              }).countDocuments();
              const todayAdded = await InventoryModel.find({
                owner: address,
                createdAt: {
                  $gte: today.toISOString(),
                  $lt: tomorrow.toISOString(),
                },
              }).countDocuments();
              const thisYearExpire = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisYear.toISOString(),
                  $lt: nextYear.toISOString(),
                },
              }).countDocuments();
              const thisMonthExpire = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisMonth.toISOString(),
                  $lt: nextMonth.toISOString(),
                },
              }).countDocuments();
              const thisWeekExpire = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisWeek.toISOString(),
                  $lt: nextWeek.toISOString(),
                },
              }).countDocuments();
              const todayExpire = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: today.toISOString(),
                  $lt: tomorrow.toISOString(),
                },
              }).countDocuments();
              const totalExpired = await InventoryModel.find({
                owner: address,
                expiryDate: { $lte: today.toISOString() },
              }).countDocuments();
              const thisMonthExpired = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisMonth.toISOString(),
                  $lte: today.toISOString(),
                },
              }).countDocuments();
              const thisYearExpired = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisYear.toISOString(),
                  $lte: today.toISOString(),
                },
              }).countDocuments();
              const thisWeekExpired = await InventoryModel.find({
                owner: address,
                expiryDate: {
                  $gte: thisWeek.toISOString(),
                  $lte: today.toISOString(),
                },
              }).countDocuments();

              var products = await InventoryModel.aggregate([
                { $match: { owner: address } },
                {
                  $group: {
                    _id: '$productName',
                    productName: { $first: '$productName' },
                    quantity: { $sum: '$quantity' },
                  },
                },
              ]);
              var dict = {};

              for (var j = 0; j < products.length; j++) {
                var productName = products[j].productName;
                var count = products[j].quantity;

                const index = products_array.indexOf(productName);
                var name = products_array[index];
                if (name in dict) {
                  var exis = dict[name];
                  var new_val = count;
                  dict[name] = exis + new_val;
                } else {
                  dict[name] = count;
                }
              }

              res.json({
                data: items,
                dict,
                counts: {
                  inventoryAdded: {
                    total: total_inv,
                    thisYear: thisYearAdded,
                    thisMonth: thisMonthAdded,
                    thisWeek: thisWeekAdded,
                    today: todayAdded,
                  },
                  currentInventory: {
                    total: total_inv,
                    thisYear: thisYearAdded,
                    thisMonth: thisMonthAdded,
                    thisWeek: thisWeekAdded,
                    today: todayAdded,
                  },
                  vaccinesNearExpiration: {
                    total: thisYearExpire,
                    thisYear: thisYearExpire,
                    thisMonth: thisMonthExpire,
                    thisWeek: thisWeekExpire,
                    today: todayExpire,
                  },
                  vaccinesExpired: {
                    total: totalExpired,
                    thisYear: thisYearExpired,
                    thisMonth: thisMonthExpired,
                    thisWeek: thisWeekExpired,
                    today: todayExpire,
                  },
                },
              });
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < getAllInventoryDetails : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < getAllInventoryDetails : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.addNewInventory = [
  auth,
  body('data.productName')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Product Name must be specified.'),
  body('data.manufacturerName')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Manafacturer must be specified.'),
  body('data.quantity')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Quantity must be specified.'),
  body('data.manufacturingDate')
    .isLength({ min: 4 })
    .trim()
    .withMessage('Manafacturing Date must be specified.'),
  body('data.expiryDate')
    .isLength({ min: 4 })
    .trim()
    .withMessage('Expiry Date must be specified.'),
  body('data.storageConditionmin')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Storage Conditionmin must be specified.'),
  body('data.storageConditionmax')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Storage Conditionmax must be specified.'),

  body('data.batchNumber')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Batch Number must be specified.'),
  body('data.serialNumber')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Serial Number must be specified.'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.log(
          'error',
          '<<<<< InventoryService < InventoryController < addNewInventory : Validation Error',
        );
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          'Validation Error.',
          errors.array(),
        );
      }
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < addNewInventory : token verified successfullly, publishing data',
          );

          permission_request = {
            result: result,
            permissionRequired: 'addInventory',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              var { data } = req.body;
              let date_ob = new Date();
              let date = ('0' + date_ob.getDate()).slice(-2);
              let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
              let year = date_ob.getFullYear();
              var today = date + '-' + month + '-' + year;
              var createdDate = { createdDate: today };

              const { address } = req.user;
              const userData = {
                stream: stream_name,
                key: data.serialNumber,
                address: address,
                data: { ...data, ...createdDate },
              };
              const response = await axios.post(
                `${blockchain_service_url}/publishExcelData`,
                userData,
              );
              logger.log(
                'info',
                '<<<<< InventoryService < InventoryController < addNewInventory : publised data to blockchain',
              );
              console.log('res', response.data);
              const newInventory = new InventoryModel({
                manufacturingDate: response.data.manufacturingDate,
                expiryDate: response.data.expiryDate,
                serialNumber: response.data.serialNumber,
                owner: response.data.owner,
                transactionIds: [response.data.transactionIds],
              });
              await newInventory.save();

              res.status(200).json({
                serialNumber: response.data.serialNumber,
                manufacturingDate: response.data.manufacturingDate,
                expiryDate: response.data.expiryDate,
                owner: response.data.owner,
                response: response.data.transactionId,
              });
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < addNewInventory : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < addNewInventory : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.addMultipleInventories = [
  auth,
  body('inventories')
    .isLength({ min: 1 })
    .withMessage('Inventories  must be specified.'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.log(
          'error',
          '<<<<< InventoryService < InventoryController < addMultipleInventories : Validation Error',
        );
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          'Validation Error.',
          errors.array(),
        );
      }
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< InventoryService < InventoryController < addMultipleInventories : token verified successfullly, publishing data',
          );

          permission_request = {
            result: result,
            permissionRequired: 'addInventory',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { inventories } = req.body;
              const { address } = req.user;
              let txnIds = [];
              let chunkUrls = [];
              const serialNumbers = inventories.map(inventory => {
                return { serialNumber: inventory.serialNumber.trim() };
              });
              const inventoriesFound = await InventoryModel.findOne({
                $or: serialNumbers,
              });
              if (inventoriesFound) {
                return apiResponse.ErrorResponse(
                  res,
                  'Duplicate Inventory Found',
                );
              }
              inventories.forEach(inventory => {
                inventory.serialNumber = inventory.serialNumber.trim();
                const userData = {
                  stream: stream_name,
                  key: inventory.serialNumber.trim(),
                  address: address,
                  data: inventory,
                };
                const postRequest = axios.post(
                  `${blockchain_service_url}/publishExcelData`,
                  userData,
                );
                chunkUrls.push(postRequest);
              });
              const inventoryResponses = await axios.all(chunkUrls);
              const inventoryData = inventoryResponses.map(
                response => response.data,
              );
              try {
                const inventoryMongoResult = await InventoryModel.insertMany(
                  inventoryData,
                );
                const transactionIds = inventoryMongoResult.map(
                  inventory => inventory.transactionIds,
                );
                apiResponse.successResponseWithData(
                  res,
                  'Created Inventory Success',
                  transactionIds,
                );
              } catch (e) {
                apiResponse.ErrorResponse(
                  res,
                  'Error in creating inventory Duplicate Serial Number ',
                );
              }
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< InventoryService < InventoryController < addNewInventory : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< InventoryService < InventoryController < addMultipleInventories : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.addInventoriesFromExcel = [
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          permission_request = {
            result: result,
            permissionRequired: 'addInventory',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const dir = `uploads`;
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
              }
              await moveFile(req.file.path, `${dir}/${req.file.originalname}`);
              const workbook = XLSX.readFile(`${dir}/${req.file.originalname}`);
              const sheet_name_list = workbook.SheetNames;
              const data = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheet_name_list[0]],
                { dateNF: 'dd/mm/yyyy;@', cellDates: true, raw: false },
              );
              const { address } = req.user;
              let start = new Date();
              let count = 0;
              const chunkSize = 50;
              let limit = chunkSize;
              let skip = 0;

              logger.log('info', 'Inserting excel data in chunks');
              async function recursiveFun() {
                skip = chunkSize * count;
                count++;
                limit = chunkSize * count;
                logger.log('info', `skip ${skip}`);

                logger.log('info', `limit ${limit}`);
                const chunkedData = data.slice(skip, limit);
                let chunkUrls = [];
                const serialNumbers = chunkedData.map(inventory => {
                  return { serialNumber: inventory.serialNumber.trim() };
                });
                const inventoriesFound = await InventoryModel.findOne({
                  $or: serialNumbers,
                });
                if (inventoriesFound) {
                  console.log('Duplicate Inventory Found');
                  const newNotification = new NotificationModel({
                    owner: address,
                    message: `Your inventories from excel is failed to add on ${new Date().toLocaleString()} due to Duplicate Inventory found ${
                      inventoriesFound.serialNumber
                    }`,
                  });
                  await newNotification.save();
                  return;
                }
                chunkedData.forEach(inventory => {
                  inventory.serialNumber = inventory.serialNumber.trim();
                  const userData = {
                    stream: stream_name,
                    key: inventory.serialNumber.trim(),
                    address: address,
                    data: inventory,
                  };
                  const postRequest = axios.post(
                    `${blockchain_service_url}/publishExcelData`,
                    userData,
                  );
                  chunkUrls.push(postRequest);
                });
                axios
                  .all(chunkUrls)
                  .then(
                    axios.spread(async (...responses) => {
                      const inventoryData = responses.map(
                        response => response.data,
                      );
                      logger.log(
                        'info',
                        `Inventory Data length' ${inventoryData.length}`,
                      );
                      logger.log(
                        'info',
                        `Transaction Id,
                        ${inventoryData[0].transactionId}`,
                      );
                      InventoryModel.insertMany(inventoryData, (err, res) => {
                        if (err) {
                          logger.log('error', err.errmsg);
                        } else
                          logger.log(
                            'info',
                            'Number of documents inserted into mongo: ' +
                              res.length,
                          );
                      });

                      if (limit < data.length) {
                        recursiveFun();
                      } else {
                        logger.log(
                          'info',
                          `Insertion of excel sheet data is completed. Time Taken to insert ${
                            data.length
                          } in seconds - `,
                          (new Date() - start) / 1000,
                        );
                        const newNotification = new NotificationModel({
                          owner: address,
                          message: `Your inventories from excel is added successfully on ${new Date().toLocaleString()}`,
                        });
                        await newNotification.save();
                      }
                    }),
                  )
                  .catch(errors => {
                    logger.log(errors);
                  });
              }
              recursiveFun();
              return apiResponse.successResponseWithData(res, 'Success', data);
            } else {
              return apiResponse.ErrorResponse(
                res,
                'Sorry! User does not have enough Permissions',
              );
            }
          });
        } else {
          return apiResponse.ErrorResponse(res, 'User not authenticated');
        }
      });
    } catch (e) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.trackProduct = [
  auth,
  async (req, res) => {
    try {
      const { serialNumber } = req.query;
      logger.log(
        'info',
        '<<<<< ShipmentService < ShipmentController < trackProduct : tracking product, querying by transaction hash',
      );
      InventoryModel.findOne({ serialNumber: serialNumber }).then(
        async user => {
          let txnIDs = user.transactionIds;
          let items_array = [];
          await utility.asyncForEach(txnIDs, async txnId => {
            const response = await axios.get(
              `${blockchain_service_url}/queryDataByRawTxHash?txid=${txnId}`,
            );
            const items = response.data.items;
            items_array.push(items);
          });
          logger.log(
            'info',
            '<<<<< ShipmentService < ShipmentController < trackProduct : tracked product, queried data by transaction hash',
          );
          res.json({ data: items_array });
        },
      );
    } catch (err) {
      logger.log(
        'error',
        '<<<<< ShipmentService < ShipmentController < trackProduct : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
