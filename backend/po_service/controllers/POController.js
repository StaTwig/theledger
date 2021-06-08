const { body, validationResult } = require('express-validator');
const fs = require('fs');
const moveFile = require('move-file');
const XLSX = require('xlsx');
const axios = require('axios');
const uniqid = require('uniqid');
const date = require('date-and-time');
const moment = require('moment');
const POModel = require('../models/POModel');
const RecordModel = require('../models/RecordModel');
const CounterModel = require('../models/CounterModel')
const OrganisationModel = require('../models/OrganisationModel')
const ProductModel = require('../models/ProductModel')
const EmployeeModel = require('../models/EmployeeModel')
const WarehouseModel = require('../models/WarehouseModel')
const InventoryModel = require('../models/InventoryModel')
//this helper file to prepare responses.
const apiResponse = require('../helpers/apiResponse');
const auth = require('../middlewares/jwt');
const checkToken = require('../middlewares/middleware').checkToken;
const checkPermissions = require('../middlewares/rbac_middleware')
    .checkPermissions;
const dotenv = require('dotenv').config();
const wrapper = require('../models/DBWrapper')

const blockchain_service_url = process.env.URL;
const stream_name = process.env.SHIP_STREAM;
const po_stream_name = process.env.PO_STREAM;

const products = require('../data/products');
const manufacturers = require('../data/manufacturers');

const init = require('../logging/init');
const logger = init.getLog();

const userPurchaseOrders = async ( mode,orgMode, organisationId, skip, limit, callback) => {
        var matchCondition = {};

        if (orgMode != "")
        var criteria = mode + "." + orgMode;
        else
        var criteria = mode;

        matchCondition[criteria] = organisationId;
        var  poDetails = [];

            poDetails = await RecordModel.aggregate([{
                $match: matchCondition
            },
            {
                $lookup: {
                    from: "organisations",
                    localField: "supplier.supplierOrganisation",
                    foreignField: "id",
                    as: "supplier.organisation",
                },
            },
            {
                $unwind: {
                    path: "$supplier.organisation",
                },
            },
            {
                $lookup: {
                    from: "organisations",
                    localField: "customer.customerOrganisation",
                    foreignField: "id",
                    as: "customer.organisation",
                },
            },
            {
                $unwind: {
                    path: "$customer.organisation",
                },
            },
            {
                $lookup: {
                    from: "warehouses",
                    localField: "customer.shippingAddress.shippingAddressId",
                    foreignField: "id",
                    as: "customer.warehouse",
                },
            },
            {
                $unwind: {
                    path: "$customer.warehouse",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "id",
                    as: "productDetails",
                },
            },
            ]).sort({
            createdAt: -1
        }).skip(parseInt(skip))
        .limit(parseInt(limit));
        callback(undefined, poDetails)
}



exports.fetchPurchaseOrders = [
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
              'info',
              '<<<<< ShipmentService < ShipmentController < purchaseOrderStatistics : token verified successfully, querying data by publisher',
          );
          const permission_request = {
            //role: req.user.role,
            result: result,
            permissionRequired: 'viewPO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {

              const { organisationId, role } = req.user;
              const { skip, limit, poId } = req.query;
              var inboundPOs, outboundPOs, poDetails;

                    try {
                    if ( poId != null)
                    {
                    const POs = await userPurchaseOrders("id", "", poId, skip, limit, (error, data) => {
                           poDetails = data ;
                       })
                     }
                    else
                    {
                    const supplierPOs = await userPurchaseOrders("supplier","supplierOrganisation", organisationId, skip, limit, (error, data) => {
                           inboundPOs = data;
                        })

                    const customerPOs = await userPurchaseOrders("customer","customerOrganisation", organisationId, skip, limit, (error, data) => {
                           outboundPOs = data ;
                       })
                    }

                    return apiResponse.successResponseWithData(
                        res,
                        'Shipments Table',
                         {
                           "inboundPOs":inboundPOs,
                          "outboundPOs":outboundPOs,
                          "poDetails":poDetails
                         }

                    );
                } catch (err) {
                    return apiResponse.ErrorResponse(res, err);
                }

              logger.log(
                  'info',
                  '<<<<< ShipmentService < ShipmentController < purchaseOrderStatistics : queried data by publisher',
              );
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
              'warn',
              '<<<<< ShipmentService < ShipmentController < purchaseOrderStatistics : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < purchaseOrderStatistics : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];


exports.fetchAllPurchaseOrdersBC = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
              'info',
              '<<<<< ShipmentService < ShipmentController < fetchAllPurchaseOrders : token verified successfully, querying all stream keys',
          );
          const permission_request = {
            result: result,
            permissionRequired: 'receivePO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const response = await axios.get(
                  `${blockchain_service_url}/queryAllStreamKeys?stream=${po_stream_name}`,
              );
              const items = response.data.items;
              logger.log(
                  'info',
                  '<<<<< ShipmentService < ShipmentController < fetchAllPurchaseOrders : queried all stream keys',
              );
              res.json({ data: items });
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
              'warn',
              '<<<<< ShipmentService < ShipmentController < fetchAllPurchaseOrders : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < fetchAllPurchaseOrders : error(catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.fetchPublisherPurchaseOrders = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
              'info',
              '<<<<< ShipmentService < ShipmentController < fetchPublisherPurchaseOrders : token verified successfully, querying all publisher keys',
          );
          const permission_request = {
            result: result,
            permissionRequired: 'viewPO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { address } = req.user;
              /*const acceptedPOs = await POModel.find({
                receiver: address,
                status: 'Accepted',
              });*/

              const acceptedPOs = await wrapper.findRecordsAndSort(POModel,{receiver: address,status: 'Accepted'});

              logger.log(
                  'info',
                  '<<<<< ShipmentService < ShipmentController < fetchPublisherPurchaseOrders : queried all publisher keys',
              );
              const poIds = acceptedPOs.map(po => po.orderID);
              apiResponse.successResponseWithData(
                  res,
                  'Purchase Orders',
                  poIds,
              );
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
              'warn',
              '<<<<< ShipmentService < ShipmentController < fetchPublisherPurchaseOrders : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < fetchPublisherPurchaseOrders : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.fetchPurchaseOrderBC = [
  auth,
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
              'info',
              '<<<<< ShipmentService < ShipmentController < fetchPurchaseOrder : token verified successfully, querying data by key',
          );

          const permission_request = {
            result: result,
            permissionRequired: 'viewPO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { key } = req.query;
              const response = await axios.get(
                  `${blockchain_service_url}/queryDataByKey?stream=${po_stream_name}&key=${key}`,
              );
              const items = response.data.items;
              logger.log(
                  'info',
                  '<<<<< ShipmentService < ShipmentController < fetchPurchaseOrder : queried data by key',
              );
              return apiResponse.successResponseWithData(
                  res,
                  'Purchase Order Info',
                  items,
              );
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
              'warn',
              '<<<<< ShipmentService < ShipmentController < fetchPurchaseOrder : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < fetchPurchaseOrder : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.changePOStatus = [
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
              'info',
              '<<<<< POStatus < ShipmentController < changePOStatus : token verified successfully',
          );

          const permission_request = {
            result: result,
            permissionRequired: 'receivePO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              try {
                const { address } = req.user;
                const { orderID, status } = req.body;
                const po = await RecordModel.findOne({ id : orderID });
                if (po && po.customer.customer_incharge === address) {
                  
                const currDateTime = date.format( new Date(), 'DD/MM/YYYY HH:mm');
                const updates = {
                     "updatedOn": currDateTime,
                     "status":status
                }

                const updateData = await RecordModel.findOneAndUpdate(
                { id: orderID },
                {
                      $push: { poUpdates: updates },
                      $set: {poStatus :status }
                })

                return apiResponse.successResponseWithData(
                      res,
                      'PO Status',
                      'Success',
                  );
                } else {
                  return apiResponse.ErrorResponse(
                      res,
                      'You are not authorised to change the status',
                  );
                }

                logger.log(
                    'info',
                    '<<<<< POStatus < ShipmentController < changePOStatus : Changed Successfully',
                );
              } catch (e) {
                return apiResponse.ErrorResponse(res, 'Error from Blockchain');
              }
              } else {
               res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
              'warn',
              '<<<<< ShipmentService < ShipmentController < createPurchaseOrder : refuted token',
          );
          return apiResponse.ErrorResponse(res, result);
        }
      });
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < createPurchaseOrder : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
exports.createPurchaseOrder = [
  auth,
  async (req, res) => {
    try {
      //Use this code for reindex
     /*  RecordModel.collection.dropIndexes(function(){
         RecordModel.collection.reIndex(function(finished){
                 console.log("finished re indexing")
               })
             })*/
      const { externalId, creationDate, supplier, customer, products, lastUpdatedOn } = req.body;
      const { createdBy, lastUpdatedBy } = req.user.id;
      const purchaseOrder = new RecordModel({
        id: uniqid('po-'),
        externalId,
        creationDate,
        supplier,
        customer,
        products,
        lastUpdatedOn,
        createdBy,
        lastUpdatedBy
      });
      const result  = await purchaseOrder.save();
      return apiResponse.successResponseWithData(res, 'Created PO Success', result.id);
    } catch (err) {
      logger.log(
          'error',
          '<<<<< ShipmentService < ShipmentController < createPurchaseOrder : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.addPOsFromExcel = [
  auth,
  async (req, res) => {
    try {
      // const permission_request = {
      //   role: req.user.role,
      //   permissionRequired: 'createPO',
      // };
      // checkPermissions(permission_request, async permissionResult => {
      //   if (permissionResult.success) {
          try {
            console.log(req.user)
            const dir = `uploads`;
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir);
            }
            await moveFile(
                req.file.path,
                `${dir}/${req.file.originalname}`,
            );
            const workbook = XLSX.readFile(
                `${dir}/${req.file.originalname}`,
            );
            const sheet_name_list = workbook.SheetNames;
            const data = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheet_name_list[0]],
                { dateNF: 'dd/mm/yyyy;@', cellDates: true, raw: false },
            );            
            //console.log(data)
            const  createdBy = lastUpdatedBy = req.user.id;
            let poDataArray = [];
            poDataArray = data.map(po => {
              return {
                id : po.id || 0,
               "externalId": po['UNICEf PO Number'],
                "creationDate": po['Document Date'],
                "lastUpdatedOn": new Date().toISOString(),
                "poStatus": ( req.user.id == po['Vendor'] ? 'APPROVED' : 'CREATED') ,
                "supplier": {
                  "supplierOrganisation": po['Vendor'],
                  "name": po['Vendor Name']
                  // "supplierIncharge": po['Supplier Incharge']
                },
                "customer": {
                  "customerOrganisation": po['IP Code'],
                  "name" : po['IP Name'],
                  "country" : po['Country Name'],
                  "address" : po['Incoterms (Part 2)'],
                  // "customerIncharge": po['Customer Incharge'],
                  "shippingAddress": {
                    "shippingAddressId": po['Plant'],
                    "shipmentReceiverId": po['Shipment Receiver Id'] || 'NA'
                  }
                },
                "products": [
                  {
                    "productId": po['Material'],
                    "quantity": po['Order Quantity']
                  }
                ],
                "createdBy" : createdBy,
                "lastUpdatedBy" : lastUpdatedBy
              }
            });              
            const incrementCounter = await CounterModel.update({
              'counters.name': "poId"
            }, {
              $inc: {
                "counters.$.value": 1
              }
            });
            let poCounter = await CounterModel.findOne({'counters.name':"poId"},{"counters.name.$":1})
            let dataRows =0;
            for(let i in poDataArray){
              if(poDataArray[i].externalId!=null){
                duplicate = await RecordModel.findOne({ externalId: poDataArray[i].externalId})
                if(duplicate!= null){
                  delete poDataArray[i]
                  i--;
                }
                else{      
                  poDataArray[i].id = poCounter.counters[0].format + poCounter.counters[0].value++;  
                  let productDetails = await ProductModel.findOne(
                    {
                      externalId: poDataArray[i].products[0].productId
                    });
                    console.log("PRODUCT DETAILS",productDetails)
                    if(productDetails){
                   poDataArray[i].products[0].name = productDetails.name || '',
                   poDataArray[i].products[0].type = productDetails.type || '',
                   poDataArray[i].products[0].manufacturer = productDetails.manufacturer || ''
                    }
                    else console.log("PRODUCT NOT FOUND")
                  console.log(dataRows++);
                  const organisationName = poDataArray[i].customer.customerOrganisation
                  const customerOrganisation = await OrganisationModel.findOne({ id: new RegExp('^'+organisationName+'$', "i") });                  
                  const customerOrganisationExternal = await OrganisationModel.findOne({ externalId: new RegExp('^'+organisationName+'$', "i") });
                  if (customerOrganisation) {
                      poDataArray[i].customer.name = customerOrganisation.name;
                      poDataArray[i].customer.customerType = customerOrganisation.type;
                  }
                  else if(customerOrganisationExternal){
                    poDataArray[i].customer.name = customerOrganisationExternal.name;
                    poDataArray[i].customer.customerType = customerOrganisationExternal.type;
                  }
                  else {
                    const country = poDataArray[i].customer?.country ? poDataArray[i].customer?.country : 'India';
                    const address = poDataArray[i].customer?.address ? poDataArray[i].customer?.address : '';
                    const incrementCounterOrg = await CounterModel.update({
                      'counters.name': "orgId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const orgCounter = await CounterModel.findOne({ 'counters.name': "orgId" }, { "counters.name.$": 1 })
                    organisationId = orgCounter.counters[0].format + orgCounter.counters[0].value;
                    const incrementCounterWarehouse = await CounterModel.update({
                      'counters.name': "warehouseId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const incrementCounterEmp = await CounterModel.update({
                      'counters.name': "employeeId" },{
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const warehouseCounter = await CounterModel.findOne({ 'counters.name': "warehouseId" }, { "counters.name.$": 1 })
                    warehouseId = warehouseCounter.counters[0].format + warehouseCounter.counters[0].value;
                    const empCounter = await CounterModel.findOne({ 'counters.name': "employeeId" }, { "counters.name.$": 1 })
                    var employeeId = empCounter.counters[0].format + empCounter.counters[0].value;
                    var employeeStatus = 'NOTAPPROVED';
                    let addr = '';
                    const emailId = moment().format("YYYY-MM-DDTHH:mm:ss") + '@statledger.com'
                    let phone = '';
                    if (emailId.indexOf('@') === -1)
                    phone = '+' + emailId;
                    const user = new EmployeeModel({
                            firstName: req.user.firstName || '',
                            lastName: req.user.id || '',
                            emailId: phone ? '' : emailId,
                            phoneNumber: phone,
                            organisationId: organisationId,
                            id: employeeId,
                            postalAddress: address,
                            accountStatus: employeeStatus,
                            warehouseId: warehouseId
                    });
                    await user.save()
                    const org = new OrganisationModel({
                      primaryContactId: employeeId ? employeeId : null,
                      name: poDataArray[i].customer.name,
                      id: organisationId,
                      type: 'CUSTOMER_SUPPLIER',
                      status: 'NOTVERIFIED',
                      postalAddress: address,
                      warehouses: [warehouseId],
                      warehouseEmployees: [employeeId],
                      country: {
                        countryId: '001',
                        countryName: country
                      },
                      configuration_id: 'CONF000',
                      authority: req.body?.authority,
                      externalId : poDataArray[i].customer.customerOrganisation
                    });
                    const createdOrg = await org.save();
                    poDataArray[i].customer.customerOrganisation = organisationId
                    const incrementCounterInv = await CounterModel.update({
                      'counters.name': "inventoryId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const invCounter = await CounterModel.findOne({ 'counters.name': "inventoryId" }, { "counters.name.$": 1 })
                    const inventoryId = invCounter.counters[0].format + invCounter.counters[0].value;
                    const inventoryResult = new InventoryModel({ id: inventoryId });                    
                    console.log(inventoryResult)
                    await inventoryResult.save();
                    const warehouse = new WarehouseModel({
                      title: 'Office',
                      id: warehouseId,
                      warehouseInventory: inventoryId,
                      organisationId: organisationId,
                      postalAddress: address,
                      warehouseAddress: {
                        firstLine: address,
                        secondLine: "",
                        city: address,
                        state: address,
                        country: country,
                        landmark: "",
                      },
                      country: {
                        countryId: '001',
                        countryName: country
                      }
                    });
                    await warehouse.save();
                    poDataArray[i].customer.shippingAddress = {
                      "shippingAddressId": warehouseId,
                      "shipmentReceiverId": "NA"
                    }
                  }
                  /////////Supplier ORG DETAILS////////////
                  const supplierOrganisationName = poDataArray[i].supplier.supplierOrganisation
                  const supplierOrganisation = await OrganisationModel.findOne({ id: new RegExp('^'+supplierOrganisationName+'$', "i") });
                  const supplierOrganisationExternal = await OrganisationModel.findOne({ externalId: new RegExp('^'+supplierOrganisationName+'$', "i") });
                  if (supplierOrganisation) {
                      poDataArray[i].supplier.name = supplierOrganisation.name;
                      poDataArray[i].supplier.supplierType = supplierOrganisation.type;
                      poDataArray[i].supplier.shippingAddress = {
                        "shippingAddressId": "NA",
                        "shipmentReceiverId": "NA"
                    }
                  }
                  else if (supplierOrganisationExternal) {
                    poDataArray[i].supplier.name = supplierOrganisationExternal.name;
                    poDataArray[i].supplier.supplierType = supplierOrganisationExternal.type;
                    poDataArray[i].supplier.shippingAddress = {
                      "shippingAddressId": "NA",
                      "shipmentReceiverId": "NA"
                  }
                }
                  else {
                    const country = poDataArray[i].supplier?.country ? poDataArray[i].supplier?.country : 'India';
                    const address = poDataArray[i].supplier?.address ? poDataArray[i].supplier?.address : '';
                    const incrementCounterOrg = await CounterModel.update({
                      'counters.name': "orgId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const orgCounter = await CounterModel.findOne({ 'counters.name': "orgId" }, { "counters.name.$": 1 })
                    organisationId = orgCounter.counters[0].format + orgCounter.counters[0].value;
                    const incrementCounterWarehouse = await CounterModel.update({
                      'counters.name': "warehouseId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const incrementCounterEmp = await CounterModel.update({
                      'counters.name': "employeeId" },{
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const warehouseCounter = await CounterModel.findOne({ 'counters.name': "warehouseId" }, { "counters.name.$": 1 })
                    warehouseId = warehouseCounter.counters[0].format + warehouseCounter.counters[0].value;
                    const empCounter = await CounterModel.findOne({ 'counters.name': "employeeId" }, { "counters.name.$": 1 })
                    var employeeId = empCounter.counters[0].format + empCounter.counters[0].value;
                    var employeeStatus = 'NOTAPPROVED';
                    let addr = '';
                    const emailId = moment().format("YYYY-MM-DDTHH:mm:ss") + '@statledger.com'
                    let phone = '';
                    if (emailId.indexOf('@') === -1)
                    phone = '+' + emailId;
                    const user = new EmployeeModel({
                            firstName: req.user.firstName || '',
                            lastName: req.user.id || '',
                            emailId: phone ? '' : emailId,
                            phoneNumber: phone,
                            organisationId: organisationId,
                            id: employeeId,
                            postalAddress: address,
                            accountStatus: employeeStatus,
                            warehouseId: warehouseId
                    });
                    await user.save()
                    const org = new OrganisationModel({
                      primaryContactId: employeeId ? employeeId : null,
                      name: poDataArray[i].supplier.name,
                      id: organisationId,
                      type: 'CUSTOMER_SUPPLIER',
                      status: 'NOTVERIFIED',
                      postalAddress: address,
                      warehouses: [warehouseId],
                      warehouseEmployees: [employeeId],
                      country: {
                        countryId: '001',
                        countryName: country
                      },
                      configuration_id: 'CONF000',
                      authority: req.body?.authority,
                      externalId : poDataArray[i].supplier.supplierOrganisation,
                    });
                    const createdOrg = await org.save();
                    poDataArray[i].supplier.supplierOrganisation = organisationId;
                    const incrementCounterInv = await CounterModel.update({
                      'counters.name': "inventoryId"
                    }, {
                      $inc: {
                        "counters.$.value": 1
                      }
                    })
                    const invCounter = await CounterModel.findOne({ 'counters.name': "inventoryId" }, { "counters.name.$": 1 })
                    const inventoryId = invCounter.counters[0].format + invCounter.counters[0].value;
                    const inventoryResult = new InventoryModel({ id: inventoryId });
                    console.log(inventoryResult)
                    await inventoryResult.save();
                    const warehouse = new WarehouseModel({
                      title: 'Office',
                      id: warehouseId,
                      warehouseInventory: inventoryId,
                      organisationId: organisationId,
                      postalAddress: address,
                      warehouseAddress: {
                        firstLine: address,
                        secondLine: "",
                        city: address,
                        state: address,
                        country: country,
                        landmark: "",
                      },
                      country: {
                        countryId: '001',
                        countryName: country
                      }
                    });
                    await warehouse.save();
                      poDataArray[i].supplier.supplierType = 'CUSTOMER_SUPPLIER';
                      poDataArray[i].supplier.shippingAddress = {
                        "shippingAddressId": warehouseId,
                        "shipmentReceiverId": "NA"
                      }
                  }
                }
              }
            }
            console.log(poDataArray)
            if(poDataArray.length > 0){
            await RecordModel.insertMany(poDataArray,{ ordered: false });
            console.log("Incrementing Data Rows by ",dataRows)
            const incrementCounter = await CounterModel.update({
              'counters.name': "poId"
            }, {
              $inc: {
                "counters.$.value": dataRows
              }
            });
            return apiResponse.successResponseWithData(
                res,
                'Upload Result',
                poDataArray
            );
            }
            else return apiResponse.ErrorResponse(res,'Data Already Exists')
          } catch (e) {
            console.log(e)
            if(e.code=='11000'){
              return apiResponse.successResponseWithData(res, 'Inserted excluding Duplicate Values', e);
            }            
            else return apiResponse.ErrorResponse(res, e);
          }
    //     } else {
    //       res.json('Sorry! User does not have enough Permissions');
    //     }
    //  });
    } catch (err) {
      console.log(err)
      return apiResponse.ErrorResponse(res, err);
    }
  },
];


exports.success = [
  async (req, res) => {
    try {
      const data = req.body;
      const { phone, payuMoneyId, amount, productinfo } = data;
      // This check is important as sometimes payumoney is sending multiple success responses
      const redirectUrl ='http://localhost:3000/shipments'

      return res.redirect(redirectUrl);
    } catch (err) {
      //throw error in json response with status 500.
    }
  },
];


exports.createOrder = [
  auth,
  async (req, res) => {
    try {
      const incrementCounter = await CounterModel.update({
        'counters.name': "poId"
      }, {
        $inc: {
          "counters.$.value": 1
        }
      });

      const poCounter = await CounterModel.findOne({'counters.name':"poId"},{"counters.name.$":1})
      const poId = poCounter.counters[0].format + poCounter.counters[0].value;

      const { externalId, supplier, customer, products, creationDate, lastUpdatedOn } = req.body;
      const { createdBy, lastUpdatedBy } = req.user.id;
      const purchaseOrder = new RecordModel({
        id: poId,
        externalId,
        creationDate,
        supplier,
        customer,
        products,
        lastUpdatedOn,
        createdBy,
        lastUpdatedBy
      });

      const currDateTime = date.format( new Date(), 'DD/MM/YYYY HH:mm');
      const updates = {
             "updatedOn": currDateTime,
             "status":"CREATED"
      }
      purchaseOrder.poUpdates = updates;

      const result = await purchaseOrder.save();
      return apiResponse.successResponseWithData(res, 'Created order',{"poId":poId});
    } catch (err) {
      logger.log(
          'error',
          '<<<<< POService < POController < createOrder : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getOrderIds = [
  auth,
  async (req, res) => {
    try {
     
      const {organisationId } = req.user;
      const orderID = await RecordModel.find({$or:[{"supplier.supplierOrganisation":organisationId},{"customer.customerOrganisation":organisationId}]},'id');
      
      return apiResponse.successResponseWithData(
        res,
        'Order Ids',
        orderID,
      );
    } catch (err) {
      logger.log(
        'error',
        '<<<<< ShippingOrderService < ShippingController < fetchAllShippingOrders : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.fetchInboundPurchaseOrders = [//inbound po with filter(from, orderId, productName, deliveryLocation, date)
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< POService < POController < fetchInboundPurchaseOrders : token verified successfully',
          );
          const permission_request = {
            result: result,
            permissionRequired: 'viewPO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { organisationId, role } = req.user;
              const { skip, limit } = req.query;
              let currentDate = new Date();
              let fromDateFilter = 0;
              let fromCustomer = req.query.from ? req.query.from : undefined;
              let productName = req.query.productName ? req.query.productName : undefined;
              let deliveryLocation = req.query.deliveryLocation ? req.query.deliveryLocation : undefined;
              let orderId = req.query.orderId ? req.query.orderId : undefined;
              switch (req.query.dateFilter) {
                case "today":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  break;
                case "week":
                  fromDateFilter = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())).toUTCString();
                  break;
                case "month":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                  break;
                case "threeMonth":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate());
                  break;
                case "sixMonth":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate());
                  break;
                case "year":
                  fromDateFilter = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
                  break;
                default:
                  fromDateFilter = 0;
              }

              let whereQuery = {};
              if (orderId) {
                whereQuery['id'] = orderId;
              }

              if (fromDateFilter) {
                whereQuery['createdAt'] = { $gte: fromDateFilter }
              }

              if (organisationId) {
                whereQuery["supplier.supplierOrganisation"] = organisationId
              }

              if (deliveryLocation) {
                whereQuery["customer.shippingAddress.shippingAddressId"] = deliveryLocation
              }

              if (fromCustomer) {
                  whereQuery["customer.customerOrganisation"] = fromCustomer
              }

              if (productName) {
                whereQuery.products = {
                  $elemMatch: {
                    productId: productName
                  }
                }
              }

              console.log("whereQuery ======>", whereQuery);
              try {
                let inboundPOsCount = await RecordModel.count(whereQuery);
                RecordModel.find(whereQuery).skip(parseInt(skip)).limit(parseInt(limit)).sort({ createdAt: -1 }).then((inboundPOList) => {
                  let inboundPORes = [];
                  let findInboundPOData = inboundPOList.map(async (inboundPO) => {
                    let inboundPOData = JSON.parse(JSON.stringify(inboundPO))
                    inboundPOData[`productDetails`] = [];
                    let inboundProductsArray = inboundPOData.products;
                    let productRes = inboundProductsArray.map(async (product) => {
                      let productDetails = await ProductModel.findOne(
                        {
                          id: product.productId
                        });
                      return productDetails;
                    });
                    Promise.all(productRes).then(async function (productList) {
                      inboundPOData[`productDetails`] = await productList;
                    });

                    let supplierOrganisation = await OrganisationModel.findOne(
                      {
                        id: inboundPO.supplier.supplierOrganisation
                      });
                    let customerOrganisation = await OrganisationModel.findOne(
                      {
                        id: inboundPOData.customer.customerOrganisation
                      });
                    let customerWareHouse = await WarehouseModel.findOne(
                      {
                        organisationId: inboundPOData.customer.customerOrganisation
                      });
                    inboundPOData.supplier[`organisation`] = supplierOrganisation;
                    inboundPOData.customer[`organisation`] = customerOrganisation;
                    inboundPOData.customer[`warehouse`] = customerWareHouse;
                    inboundPORes.push(inboundPOData);
                  });

                  Promise.all(findInboundPOData).then(function (results) {
                    return apiResponse.successResponseWithData(
                      res,
                      "Inbound PO Records",
                      {"inboundPOs":inboundPORes, "count":inboundPOsCount}
                    );
                  });
                });
              } catch (err) {
                return apiResponse.ErrorResponse(res, err);
              }
              logger.log(
                'info',
                '<<<<< POService < POController < fetchInboundPurchaseOrders',
              );
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< POService < POController < fetchInboundPurchaseOrders  : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< POService < POController < fetchInboundPurchaseOrders : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.fetchOutboundPurchaseOrders = [ //outbound po with filter(to, orderId, productName, deliveryLocation, date)
  auth,
  async (req, res) => {
    try {
      checkToken(req, res, async result => {
        if (result.success) {
          logger.log(
            'info',
            '<<<<< POService < POController < fetchOutboundPurchaseOrders : token verified successfully',
          );
          const permission_request = {
            result: result,
            permissionRequired: 'viewPO',
          };
          checkPermissions(permission_request, async permissionResult => {
            if (permissionResult.success) {
              const { organisationId, role } = req.user;
              const { skip, limit } = req.query;
              let currentDate = new Date();
              let fromDateFilter = 0;
              let toSupplier = req.query.to ? req.query.to : undefined;
              let productName = req.query.productName ? req.query.productName : undefined;
              let deliveryLocation = req.query.deliveryLocation ? req.query.deliveryLocation : undefined;
              let orderId = req.query.orderId ? req.query.orderId : undefined;
              switch (req.query.dateFilter) {
                case "today":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  break;
                case "week":
                  fromDateFilter = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())).toUTCString();
                  break;
                case "month":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                  break;
                case "threeMonth":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate());
                  break;
                case "sixMonth":
                  fromDateFilter = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate());
                  break;
                case "year":
                  fromDateFilter = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
                  break;
                default:
                  fromDateFilter = 0;
              }

              let whereQuery = {};
              if (orderId) {
                whereQuery['id'] = orderId;
              }

              if (fromDateFilter) {
                whereQuery['createdAt'] = { $gte: fromDateFilter }
              }

              if (organisationId) {
                whereQuery["customer.customerOrganisation"] = organisationId
              }

              if (deliveryLocation) {
                whereQuery["customer.shippingAddress.shippingAddressId"] = deliveryLocation
              }

              if (toSupplier) {
                  whereQuery["supplier.supplierOrganisation"] = toSupplier;
              }

              if (productName) {
                whereQuery.products = {
                  $elemMatch: {
                    productId: productName
                  }
                }
              }

              console.log("whereQuery ======>", whereQuery);
              try {
                let outboundPOsCount = await RecordModel.count(whereQuery);
                RecordModel.find(whereQuery).skip(parseInt(skip)).limit(parseInt(limit)).sort({ createdAt: -1 }).then((outboundPOList) => {
                  let outboundPORes = [];
                  let findOutboundPOData = outboundPOList.map(async (outboundPO) => {
                    let outboundPOData = JSON.parse(JSON.stringify(outboundPO))
                    outboundPOData[`productDetails`] = [];
                    let outboundProductsArray = outboundPOData.products;
                    let productRes = outboundProductsArray.map(async (product) => {
                      let productDetails = await ProductModel.findOne(
                        {
                          id: product.productId
                        });
                      return productDetails;
                    });
                    Promise.all(productRes).then(async function (productList) {
                      outboundPOData[`productDetails`] = await productList;
                    });

                    let supplierOrganisation = await OrganisationModel.findOne(
                      {
                        id: outboundPO.supplier.supplierOrganisation
                      });
                    let customerOrganisation = await OrganisationModel.findOne(
                      {
                        id: outboundPOData.customer.customerOrganisation
                      });
                    let customerWareHouse = await WarehouseModel.findOne(
                      {
                        organisationId: outboundPOData.customer.customerOrganisation
                      });
                    outboundPOData.supplier[`organisation`] = supplierOrganisation;
                    outboundPOData.customer[`organisation`] = customerOrganisation;
                    outboundPOData.customer[`warehouse`] = customerWareHouse;
                    outboundPORes.push(outboundPOData);
                  });

                  Promise.all(findOutboundPOData).then(function (results) {
                    return apiResponse.successResponseWithData(
                      res,
                      "Outbound PO Records",
                      {"outboundPOs":outboundPORes, "count":outboundPOsCount}
                    );
                  });
                });
              } catch (err) {
                return apiResponse.ErrorResponse(res, err);
              }
              logger.log(
                'info',
                '<<<<< POService < POController < fetchOutboundPurchaseOrders',
              );
            } else {
              res.json('Sorry! User does not have enough Permissions');
            }
          });
        } else {
          logger.log(
            'warn',
            '<<<<< POService < POController < fetchOutboundPurchaseOrders  : refuted token',
          );
          res.status(403).json(result);
        }
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< POService < POController < fetchOutboundPurchaseOrders : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
];



exports.fetchProductIdsCustomerLocationsOrganisations = [
  auth,
  async (req, res) => {
    try {
      let responseData = {};
      ProductModel.find({},'id name').then (function (productIds){
        WarehouseModel.find({},'id title').then (function (locations){
          OrganisationModel.find({},'id name').then (function (organisation){
            responseData[`organisations`] = organisation;
            responseData[`deliveryLocations`] = locations;
            responseData[`productIds`] = productIds;
            return apiResponse.successResponseWithData(
              res,
              'Product Ids and Customer Locations for filter dropdown',
              responseData,
            );
          });
        });
      });
    } catch (err) {
      logger.log(
        'error',
        '<<<<< POService < POController < fetchProductIdsCustomerLocations : error (catch block)',
      );
      return apiResponse.ErrorResponse(res, err);
    }
  },
]