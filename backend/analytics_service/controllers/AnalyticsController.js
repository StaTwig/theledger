const RecordModel = require("../models/RecordModel");
const AtomModel = require("../models/AtomModel");
const ShipmentModel = require("../models/ShipmentModel");
const InventoryModel = require("../models/InventoryModel");
const ProductModel = require("../models/ProductModel");
const POModel = require("../models/POModel");
const ShippingOrderModel = require("../models/ShippingOrderModel");
const WarehouseModel = require("../models/WarehouseModel");
const OrganisationModel = require("../models/OrganisationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { startOfMonth, format } = require("date-fns");
const { buildExcelReport, buildPdfReport } = require("../helpers/reports");
const { getDateStringForMongo } = require("../helpers/utility");

async function getDistributedProducts(matchQuery, warehouseId, fieldName) {
  const products = await WarehouseModel.aggregate([
    {
      $match: {
        id: warehouseId,
      },
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $group: {
        _id: "items",
        distItems: { $addToSet: "$inventoryDetails.productId" },
      },
    },
  ]);
  if (products.length > 0) {
    if (products[0].distItems.length > 0) {
      matchQuery[`${fieldName}`] = {
        $in: products[0].distItems,
      };
    }
  }
  return matchQuery;
}

async function GovtBodyNearExpiry(date, body) {
  let matchQueryStage2 = {};
  let { productCategory, productName, manufacturer, organisation } = body;

  if (productCategory) matchQueryStage2["productCategory"] = productCategory;
  if (productName) matchQueryStage2["productName"] = productName;
  if (manufacturer) matchQueryStage2["manufacturer"] = manufacturer;
  if (organisation) matchQueryStage2["organisation"] = organisation;

  let { region, country, state, city } = body;
  let matchQueryStage1 = {
    status: "ACTIVE",
  };
  if (region) {
    let temp = {
      ...matchQueryStage1,
      "region.regionName": region,
    };
  }
  if (country) {
    let temp = {
      ...matchQueryStage1,
      "country.countryName": country,
    };
    matchQueryStage1 = temp;
  }
  if (state) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.state": state,
    };
    matchQueryStage1 = temp;
  }
  if (city) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.city": city,
    };
    matchQueryStage1 = temp;
  }

  let today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  let { skip, limit } = body;
  let paginationQuery = [];
  if (skip) {
    paginationQuery.push({ $skip: skip });
  }
  if (limit) {
    paginationQuery.push({ $limit: limit });
  }

  const nearExpiryProducts = await WarehouseModel.aggregate([
    {
      $match: matchQueryStage1,
    },
    {
      $lookup: {
        from: "organisations",
        let: { orgId: "$organisationId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
          { $project: { _id: 0, organisation: "$name" } },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: "$organisation",
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        address: {
          address: {
            firstLine: "$warehouseAddress.firstLine",
            city: "$warehouseAddress.city",
            state: "$warehouseAddress.state",
            country: "$country.countryName",
            region: "$region.regionName",
          },
        },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory", "$organisation", "$address"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $match: {
        "inventoryDetails.quantity": {
          $gt: 0,
        },
      },
    },
    {
      $lookup: {
        from: "products",
        let: { productId: "$inventoryDetails.productId", inventoryId: "$id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$id", "$$productId"] }],
              },
            },
          },
          {
            $lookup: {
              from: "atoms",
              let: { inventoryId: "$$inventoryId", productId: "$id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$currentInventory", "$$inventoryId"] },
                        { $eq: ["$productId", "$$productId"] },
                        { $eq: ["$status", "HEALTHY"] },
                        { $gte: ["$attributeSet.expDate", null] },
                        { $ne: ["$attributeSet.expDate", null] },
                        { $gte: ["$attributeSet.expDate", today] },
                        { $lt: ["$attributeSet.expDate", nextMonth] },
                      ],
                    },
                  },
                },
                {
                  $unwind: "$batchNumbers",
                },
                {
                  $group: {
                    _id: {
                      productId: "$productId",
                      batchNumber: "$batchNumbers",
                      expDate: "$attributeSet.expDate",
                    },
                    quantity: { $sum: "$quantity" },
                  },
                },
              ],
              as: "atom",
            },
          },
          {
            $unwind: "$atom",
          },
        ],
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
      },
    },
    {
      $lookup: {
        from: "inventory_analytics",
        let: {
          arg1: "$inventoryDetails.productId",
          arg2: date,
          arg3: "$id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$productId", "$$arg1"],
                  },
                  {
                    $eq: ["$inventoryId", "$$arg3"],
                  },
                  {
                    $eq: ["$date", "$$arg2"],
                  },
                ],
              },
            },
          },
        ],
        as: "inventory_analytics",
      },
    },
    {
      $unwind: {
        path: "$inventory_analytics",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          productId: "$inventoryDetails.productId",
          orgId: "$organisation",
        },
        productCategory: {
          $first: "$product.type",
        },
        productName: {
          $first: "$product.name",
        },
        unitofMeasure: {
          $first: "$product.unitofMeasure",
        },
        manufacturer: {
          $first: "$product.manufacturer",
        },
        manufacturerId: {
          $first: "$product.manufacturerId",
        },
        organisation: {
          $first: "$organisation",
        },
        address: {
          $first: "$address",
        },
        productQuantity: {
          $sum: "$inventoryDetails.quantity",
        },
        batchNumber: {
          $first: "$product.atom._id.batchNumber",
        },
        totalSales: {
          $sum: "$inventoryDetails.totalSales",
        },
        inventoryAnalytics: {
          $first: "$inventory_analytics",
        },
        updatedAt: {
          $first: "$inventoryDetails.updatedAt",
        },
        expiredDates: {
          $first: "$product.atom._id.expDate",
        },
      },
    },
    {
      $match: matchQueryStage2,
    },
    {
      $sort: {
        expiredDates: 1,
        productName: 1,
      },
    },
    {
      $facet: {
        paginatedResults: paginationQuery,
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: "$totalCount" },
    { $project: { paginatedResults: 1, totalCount: "$totalCount.count" } },
  ]);

  return nearExpiryProducts;
}

async function GovtBodyExpired(date, body) {
  let matchQueryStage2 = {};
  let { productCategory, productName, manufacturer, organisation } = body;

  if (productCategory) matchQueryStage2["productCategory"] = productCategory;
  if (productName) matchQueryStage2["productName"] = productName;
  if (manufacturer) matchQueryStage2["manufacturer"] = manufacturer;
  if (organisation) matchQueryStage2["organisation"] = organisation;

  let { region, country, state, city } = body;
  let matchQueryStage1 = {
    status: "ACTIVE",
  };
  if (region) {
    let temp = {
      ...matchQueryStage1,
      "region.regionName": region,
    };
  }
  if (country) {
    let temp = {
      ...matchQueryStage1,
      "country.countryName": country,
    };
    matchQueryStage1 = temp;
  }
  if (state) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.state": state,
    };
    matchQueryStage1 = temp;
  }
  if (city) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.city": city,
    };
    matchQueryStage1 = temp;
  }

  let { skip, limit } = body;
  let paginationQuery = [];
  if (skip) {
    paginationQuery.push({ $skip: skip });
  }
  if (limit) {
    paginationQuery.push({ $limit: limit });
  }

  let today = new Date();

  const expiredProducts = await WarehouseModel.aggregate([
    {
      $match: matchQueryStage1,
    },
    {
      $lookup: {
        from: "organisations",
        let: { orgId: "$organisationId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
          { $project: { _id: 0, organisation: "$name" } },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: "$organisation",
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        address: {
          address: {
            firstLine: "$warehouseAddress.firstLine",
            city: "$warehouseAddress.city",
            state: "$warehouseAddress.state",
            country: "$country.countryName",
            region: "$region.regionName",
          },
        },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory", "$organisation", "$address"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $match: {
        "inventoryDetails.quantity": {
          $gt: 0,
        },
      },
    },
    {
      $lookup: {
        from: "products",
        let: { productId: "$inventoryDetails.productId", inventoryId: "$id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$id", "$$productId"] }],
              },
            },
          },
          {
            $lookup: {
              from: "atoms",
              let: { inventoryId: "$$inventoryId", productId: "$id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$currentInventory", "$$inventoryId"] },
                        { $eq: ["$productId", "$$productId"] },
                        { $eq: ["$status", "HEALTHY"] },
                        { $ne: ["$attributeSet.expDate", null] },
                        { $gte: ["$attributeSet.expDate", null] },
                        { $lt: ["$attributeSet.expDate", today] },
                      ],
                    },
                  },
                },
                {
                  $unwind: "$batchNumbers",
                },
                {
                  $group: {
                    _id: {
                      productId: "$productId",
                      batchNumber: "$batchNumbers",
                      expDate: "$attributeSet.expDate",
                    },
                    quantity: { $sum: "$quantity" },
                  },
                },
              ],
              as: "atom",
            },
          },
          {
            $unwind: "$atom",
          },
        ],
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
      },
    },
    {
      $lookup: {
        from: "inventory_analytics",
        let: {
          arg1: "$inventoryDetails.productId",
          arg2: date,
          arg3: "$id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$productId", "$$arg1"],
                  },
                  {
                    $eq: ["$inventoryId", "$$arg3"],
                  },
                  {
                    $eq: ["$date", "$$arg2"],
                  },
                ],
              },
            },
          },
        ],
        as: "inventory_analytics",
      },
    },
    {
      $unwind: {
        path: "$inventory_analytics",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          productId: "$inventoryDetails.productId",
          orgId: "$organisation",
        },
        productCategory: {
          $first: "$product.type",
        },
        productName: {
          $first: "$product.name",
        },
        unitofMeasure: {
          $first: "$product.unitofMeasure",
        },
        manufacturer: {
          $first: "$product.manufacturer",
        },
        manufacturerId: {
          $first: "$product.manufacturerId",
        },
        organisation: {
          $first: "$organisation",
        },
        address: {
          $first: "$address",
        },
        productQuantity: {
          $sum: "$inventoryDetails.quantity",
        },
        batchNumber: {
          $first: "$product.atom._id.batchNumber",
        },
        totalSales: {
          $sum: "$inventoryDetails.totalSales",
        },
        inventoryAnalytics: {
          $first: "$inventory_analytics",
        },
        updatedAt: {
          $first: "$inventoryDetails.updatedAt",
        },
        expiredDates: {
          $first: "$product.atom._id.expDate",
        },
      },
    },
    {
      $match: matchQueryStage2,
    },
    {
      $sort: {
        expiredDates: 1,
        productName: 1,
      },
    },
    {
      $facet: {
        paginatedResults: paginationQuery,
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: "$totalCount" },
    { $project: { paginatedResults: 1, totalCount: "$totalCount.count" } },
  ]);

  return expiredProducts;
}

async function GovtBodyInstock(date, body) {
  let matchQueryStage2 = {};
  let { productCategory, productName, manufacturer, organisation } = body;

  if (productCategory) matchQueryStage2["productCategory"] = productCategory;
  if (productName) matchQueryStage2["productName"] = productName;
  if (manufacturer) matchQueryStage2["manufacturer"] = manufacturer;
  if (organisation) matchQueryStage2["organisation"] = organisation;

  let { region, country, state, city } = body;
  let matchQueryStage1 = {
    status: "ACTIVE",
  };
  if (region) {
    let temp = {
      ...matchQueryStage1,
      "region.regionName": region,
    };
  }

  if (country) {
    let temp = {
      ...matchQueryStage1,
      "country.countryName": country,
    };
    matchQueryStage1 = temp;
  }
  if (state) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.state": state,
    };
    matchQueryStage1 = temp;
  }
  if (city) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.city": city,
    };
    matchQueryStage1 = temp;
  }

  let { skip, limit } = body;
  let paginationQuery = [];
  if (skip) {
    paginationQuery.push({ $skip: skip });
  }
  if (limit) {
    paginationQuery.push({ $limit: limit });
  }

  const inStockReport = await WarehouseModel.aggregate([
    {
      $match: matchQueryStage1,
    },
    {
      $lookup: {
        from: "organisations",
        let: { orgId: "$organisationId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
          { $project: { _id: 0, organisation: "$name" } },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: "$organisation",
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        address: {
          address: {
            firstLine: "$warehouseAddress.firstLine",
            city: "$warehouseAddress.city",
            state: "$warehouseAddress.state",
            country: "$country.countryName",
            region: "$region.regionName",
          },
        },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory", "$organisation", "$address"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $match: {
        "inventoryDetails.quantity": {
          $gt: 0,
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "inventoryDetails.productId",
        foreignField: "id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
      },
    },
    {
      $lookup: {
        from: "inventory_analytics",
        let: {
          arg1: "$inventoryDetails.productId",
          arg2: date,
          arg3: "$id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$productId", "$$arg1"],
                  },
                  {
                    $eq: ["$inventoryId", "$$arg3"],
                  },
                  {
                    $eq: ["$date", "$$arg2"],
                  },
                ],
              },
            },
          },
        ],
        as: "inventory_analytics",
      },
    },
    {
      $unwind: {
        path: "$inventory_analytics",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          productId: "$inventoryDetails.productId",
          orgId: "$organisation",
        },
        productCategory: {
          $first: "$product.type",
        },
        productName: {
          $first: "$product.name",
        },
        unitofMeasure: {
          $first: "$product.unitofMeasure",
        },
        manufacturer: {
          $first: "$product.manufacturer",
        },
        manufacturerId: {
          $first: "$product.manufacturerId",
        },
        organisation: {
          $first: "$organisation",
        },
        address: {
          $first: "$address",
        },
        productQuantity: {
          $sum: "$inventoryDetails.quantity",
        },
        totalSales: {
          $sum: "$inventoryDetails.totalSales",
        },
        inventoryAnalytics: {
          $first: "$inventory_analytics",
        },
        updatedAt: {
          $first: "$inventoryDetails.updatedAt",
        },
      },
    },
    {
      $match: matchQueryStage2,
    },
    {
      $sort: {
        productQuantity: -1,
      },
    },
    {
      $facet: {
        paginatedResults: paginationQuery,
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: "$totalCount" },
    { $project: { paginatedResults: 1, totalCount: "$totalCount.count" } },
  ]);

  return inStockReport;
}

async function GovtBodyOutstock(date, body) {
  let { region, country, state, city } = body;
  let matchQueryStage1 = {
    status: "ACTIVE",
  };
  if (region) {
    let temp = {
      ...matchQueryStage1,
      "region.regionName": region,
    };
  }
  if (country) {
    let temp = {
      ...matchQueryStage1,
      "country.countryName": country,
    };
    matchQueryStage1 = temp;
  }
  if (state) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.state": state,
    };
    matchQueryStage1 = temp;
  }
  if (city) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.city": city,
    };
    matchQueryStage1 = temp;
  }

  let { productCategory, productName, manufacturer, organisation } = body;
  let matchQueryStage2 = {};
  if (productCategory) matchQueryStage2["productCategory"] = productCategory;
  if (productName) matchQueryStage2["productName"] = productName;
  if (manufacturer) matchQueryStage2["manufacturer"] = manufacturer;
  if (organisation) matchQueryStage2["organisation"] = organisation;

  let { skip, limit } = body;
  let paginationQuery = [];
  if (skip) {
    paginationQuery.push({ $skip: skip });
  }
  if (limit) {
    paginationQuery.push({ $limit: limit });
  }

  const outOfStockReport = await WarehouseModel.aggregate([
    {
      $match: matchQueryStage1,
    },
    {
      $lookup: {
        from: "organisations",
        let: { orgId: "$organisationId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
          { $project: { _id: 0, organisation: "$name" } },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: "$organisation",
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        address: {
          address: {
            firstLine: "$warehouseAddress.firstLine",
            city: "$warehouseAddress.city",
            state: "$warehouseAddress.state",
            country: "$country.countryName",
            region: "$region.regionName",
          },
        },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory", "$organisation", "$address"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $match: {
        "inventoryDetails.quantity": 0,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "inventoryDetails.productId",
        foreignField: "id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
      },
    },
    {
      $lookup: {
        from: "inventory_analytics",
        let: {
          arg1: "$inventoryDetails.productId",
          arg2: date,
          arg3: "$id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$productId", "$$arg1"],
                  },
                  {
                    $eq: ["$inventoryId", "$$arg3"],
                  },
                  {
                    $eq: ["$date", "$$arg2"],
                  },
                ],
              },
            },
          },
        ],
        as: "inventory_analytics",
      },
    },
    {
      $unwind: {
        path: "$inventory_analytics",
      },
    },
    {
      $group: {
        _id: {
          productId: "$inventoryDetails.productId",
          orgId: "$organisation",
        },
        productCategory: {
          $first: "$product.type",
        },
        productName: {
          $first: "$product.name",
        },
        unitofMeasure: {
          $first: "$product.unitofMeasure",
        },
        manufacturer: {
          $first: "$product.manufacturer",
        },
        manufacturerId: {
          $first: "$product.manufacturerId",
        },
        organisation: {
          $first: "$organisation",
        },
        address: {
          $first: "$address",
        },
        productQuantity: {
          $sum: "$inventoryDetails.quantity",
        },
        totalSales: {
          $sum: "$inventoryDetails.totalSales",
        },
        inventoryAnalytics: {
          $first: "$inventory_analytics",
        },
        updatedAt: {
          $first: "$inventoryDetails.updatedAt",
        },
      },
    },
    {
      $match: matchQueryStage2,
    },
    {
      $sort: {
        "inventoryAnalytics.outOfStockDays": -1,
      },
    },
    {
      $facet: {
        paginatedResults: paginationQuery,
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: "$totalCount" },
    { $project: { paginatedResults: 1, totalCount: "$totalCount.count" } },
  ]);

  return outOfStockReport;
}

async function GovtBodyBestsellers(date, body) {
  let { region, country, state, city } = body;
  let matchQueryStage1 = {
    status: "ACTIVE",
  };
  if (region) {
    let temp = {
      ...matchQueryStage1,
      "region.regionName": region,
    };
  }
  if (country) {
    let temp = {
      ...matchQueryStage1,
      "country.countryName": country,
    };
    matchQueryStage1 = temp;
  }
  if (state) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.state": state,
    };
    matchQueryStage1 = temp;
  }
  if (city) {
    let temp = {
      ...matchQueryStage1,
      "warehouseAddress.city": city,
    };
    matchQueryStage1 = temp;
  }

  let { productCategory, productName, manufacturer, organisation } = body;
  let matchQueryStage2 = {};
  if (productCategory) matchQueryStage2["productCategory"] = productCategory;
  if (productName) matchQueryStage2["productName"] = productName;
  if (manufacturer) matchQueryStage2["manufacturer"] = manufacturer;
  if (organisation) matchQueryStage2["organisation"] = organisation;

  let { skip, limit } = body;
  let paginationQuery = [];
  if (skip) {
    paginationQuery.push({ $skip: skip });
  }
  if (limit) {
    paginationQuery.push({ $limit: limit });
  }

  const bestSellers = await WarehouseModel.aggregate([
    {
      $match: matchQueryStage1,
    },
    {
      $lookup: {
        from: "organisations",
        let: { orgId: "$organisationId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
          { $project: { _id: 0, organisation: "$name" } },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: "$organisation",
    },
    {
      $lookup: {
        localField: "warehouseInventory",
        from: "inventories",
        foreignField: "id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        address: {
          address: {
            firstLine: "$warehouseAddress.firstLine",
            city: "$warehouseAddress.city",
            state: "$warehouseAddress.state",
            country: "$country.countryName",
            region: "$region.regionName",
          },
        },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [null, "$inventory", "$organisation", "$address"],
      },
    },
    {
      $unwind: {
        path: "$inventoryDetails",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "inventoryDetails.productId",
        foreignField: "id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
      },
    },
    {
      $lookup: {
        from: "inventory_analytics",
        let: {
          arg1: "$inventoryDetails.productId",
          arg2: date,
          arg3: "$id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$productId", "$$arg1"],
                  },
                  {
                    $eq: ["$inventoryId", "$$arg3"],
                  },
                  {
                    $eq: ["$date", "$$arg2"],
                  },
                ],
              },
            },
          },
        ],
        as: "inventory_analytics",
      },
    },
    {
      $unwind: {
        path: "$inventory_analytics",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          productId: "$inventoryDetails.productId",
          orgId: "$organisation",
        },
        productCategory: {
          $first: "$product.type",
        },
        productName: {
          $first: "$product.name",
        },
        unitofMeasure: {
          $first: "$product.unitofMeasure",
        },
        manufacturer: {
          $first: "$product.manufacturer",
        },
        manufacturerId: {
          $first: "$product.manufacturerId",
        },
        organisation: {
          $first: "$organisation",
        },
        address: {
          $first: "$address",
        },
        productQuantity: {
          $sum: "$inventoryDetails.quantity",
        },
        totalSales: {
          $sum: "$inventoryDetails.totalSales",
        },
        inventoryAnalytics: {
          $first: "$inventory_analytics",
        },
        sales: {
          $sum: "$inventory_analytics.sales",
        },
        updatedAt: {
          $first: "$inventoryDetails.updatedAt",
        },
      },
    },
    {
      $match: {
        sales: {
          $gt: 0,
        },
      },
    },
    {
      $match: matchQueryStage2,
    },
    {
      $sort: {
        sales: -1,
      },
    },
    {
      $facet: {
        paginatedResults: paginationQuery,
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: "$totalCount" },
    { $project: { paginatedResults: 1, totalCount: "$totalCount.count" } },
  ]);

  return bestSellers;
}

exports.getAnalytics = [
  auth,
  async (req, res) => {
    try {
      const { id: warehouseId } = req.user;
      var overview = {};
      var inventory = {};
      var shipment = {};
      var data = {};

      var today = new Date();
      var lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      var lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 30);
      var lastYear = new Date();
      lastYear.setDate(today.getDate() - 365);

      const totalShipmentsSentLastYear = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["SHIPPED", "RECEIVED", "LOST", "DAMAGED"] } },
          {
            shippingDate: {
              $lte: today.toISOString(),
              $gte: lastYear.toISOString(),
            },
          },
        ],
      });
      overview.totalShipmentsSentLastYear = totalShipmentsSentLastYear;

      const totalProductsAddedToInventory = await InventoryModel.count();
      overview.totalProductsAddedToInventory = totalProductsAddedToInventory;

      const totalShipmentsInTransitLastMonth = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["SHIPPED"] } },
          {
            shippingDate: {
              $lte: today.toISOString(),
              $gte: lastMonth.toISOString(),
            },
          },
        ],
      });
      overview.totalShipmentsInTransitLastMonth =
        totalShipmentsInTransitLastMonth;

      const totalShipmentsSentLastWeek = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["SHIPPED", "RECEIVED", "LOST", "DAMAGED"] } },
          {
            shippingDate: {
              $lte: today.toISOString(),
              $gte: lastWeek.toISOString(),
            },
          },
        ],
      });
      overview.totalShipmentsSentLastWeek = totalShipmentsSentLastWeek;

      const totalShipmentsWithDelayInTransit = await ShipmentModel.count({
        $and: [
          { status: { $in: ["SHIPPED"] } },
          { "supplier.id": warehouseId },
          { expectedDeliveryDate: { $lt: new Date().toISOString() } },
        ],
      });
      overview.totalShipmentsWithDelayInTransit =
        totalShipmentsWithDelayInTransit;

      const totalProductsInInventory = await InventoryModel.count();
      inventory.totalProductsInInventory = totalProductsInInventory;

      //  const totalProductsAddedToInventory = await InventoryModel.count();
      //  inventory.totalProductsAddedToInventory = totalProductsAddedToInventory;
      let todayString = getDateStringForMongo(today);

      var nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      let nextWeekString = getDateStringForMongo(nextWeek);

      const expiringToday = await AtomModel.count({
        "attributeSet.expDate": { $eq: today },
      });
      inventory.expiringToday = expiringToday;

      const expiringThisWeek = await AtomModel.count({
        "attributeSet.expDate": {
          $gte: today,
          $lt: nextWeek,
        },
      });
      inventory.expiringThisWeek = expiringThisWeek;

      var nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      let nextMonthString = getDateStringForMongo(nextMonth);

      const expiringThisMonth = await AtomModel.count({
        "attributeSet.expDate": {
          $gte: today,
          $lt: nextMonth,
        },
      });
      inventory.expiringThisMonth = expiringThisMonth;

      var nextYear = new Date();
      nextYear.setDate(today.getDate() + 365);
      let nextyearString = getDateStringForMongo(nextYear);

      const expiringThisYear = await AtomModel.count({
        "attributeSet.expDate": {
          $gte: today,
          $lt: nextyear,
        },
      });
      inventory.expiringThisYear = expiringThisYear;

      inventory.expiredToday = expiringToday;

      let lastWeekString = getDateStringForMongo(lastWeek);
      const expiredThisWeek = await AtomModel.count({
        "attributeSet.expDate": {
          $lt: today,
          $gte: lastWeek,
        },
      });
      inventory.expiredThisWeek = expiredThisWeek;

      let lastMonthString = getDateStringForMongo(lastMonth);
      const expiredThisMonth = await AtomModel.count({
        "attributeSet.expDate": {
          $lt: today,
          $gte: lastMonth,
        },
      });
      inventory.expiredThisMonth = expiredThisMonth;

      let lastYearString = getDateStringForMongo(lastYear);
      const expiredThisYear = await AtomModel.count({
        "attributeSet.expDate": {
          $lt: today,
          $gte: lastYear,
        },
      });
      inventory.expiredThisYear = expiredThisYear;

      const inboundShipments = await ShipmentModel.count({
        $and: [
          { "receiver.id": warehouseId },
          { status: { $in: ["SHIPPED"] } },
        ],
      });
      shipment.inboundShipments = inboundShipments;

      const outboundShipments = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["SHIPPED", "RECEIVED"] } },
        ],
      });
      shipment.outboundShipments = outboundShipments;

      const inboundAlerts = await ShipmentModel.count({
        $and: [
          { "receiver.id": warehouseId },
          { status: { $in: ["DAMAGED"] } },
        ],
      });
      shipment.inboundAlerts = inboundAlerts;

      const outboundAlerts = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["DAMAGED"] } },
        ],
      });
      shipment.outboundAlerts = outboundAlerts;

      data.overview = overview;
      data.inventory = inventory;
      data.shipment = shipment;

      const totalShipmentsSent = await ShipmentModel.count({
        $and: [
          { "supplier.id": warehouseId },
          { status: { $in: ["SHIPPED", "RECEIVED", "LOST", "DAMAGED"] } },
          {
            shippingDate: {
              $lte: today.toISOString(),
              $gte: lastYear.toISOString(),
            },
          },
        ],
      });
      data.totalShipmentsSent = totalShipmentsSent;

      // const totalShipmentsSentLastYear = await ShipmentModel.count(
      //   { $and : [
      //     {"supplier.id": warehouseId},
      //     { status: { $in : ["SHIPPED", "RECEIVED", "LOST", "DAMAGED"]} },
      //     { shippingDate :  {
      //         $lte: today.toISOString(),
      //         $gte: lastYear.toISOString()
      //       }
      //     }
      //   ]
      // }
      // );
      // data.totalShipmentsSentLastYear = totalShipmentsSentLastYear;

      // const totalShipmentsSentLastWeek = await ShipmentModel.count(
      //   { $and : [
      //     {"supplier.id": warehouseId},
      //     { status: { $in : ["SHIPPED", "RECEIVED", "LOST", "DAMAGED"]} },
      //     { shippingDate :  {
      //         $lte: today.toISOString(),
      //         $gte: lastWeek.toISOString()
      //       }
      //     }
      //   ]
      // }
      // );
      // data.totalShipmentsSentLastWeek = totalShipmentsSentLastWeek;

      const totalShipmentsReceived = await ShipmentModel.count({
        status: "RECEIVED",
      });

      data.totalShipmentsReceived = totalShipmentsReceived;

      const totalProductsSent = await ShipmentModel.aggregate([
        { $match: { status: "SHIPPED" } },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $size: "$products" } },
          },
        },
      ]);
      data.totalProductsSent = totalProductsSent[0]?.total || 0;

      const totalProductsReceived = await ShipmentModel.aggregate([
        { $match: { status: "RECEIVED" } },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $size: "$products" } },
          },
        },
      ]);
      data.totalProductsReceived = totalProductsReceived[0]?.total || 0;
      const productTypes = await InventoryModel.aggregate([
        { $match: { id: "inv-bh-1" } },
        {
          $group: {
            _id: "$id",
            total: { $sum: { $size: "$inventoryDetails" } },
          },
        },
      ]);
      const numProductTypes = productTypes[0]?.total || 0;
      data.numProductTypes = numProductTypes;
      const totalProductCount = await ProductModel.distinct("type");
      var stockOut = numProductTypes - totalProductCount.length;
      data.stockOut = stockOut;

      const expiredProducts = await AtomModel.count({
        "attributeSet.expDate": {
          $lt: today,
        },
      });
      data.expiredProducts = expiredProducts;

      const numPO = await POModel.count();
      const numSO = await ShippingOrderModel.count();
      var pendingOrders = numPO + numSO;
      data.pendingOrders = pendingOrders;

      const batchExpired = await AtomModel.aggregate([
        {
          $match: {
            "attributeSet.expDate": {
              $lt: today,
            },
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $size: "$batchNumbers" } },
          },
        },
      ]);
      data.batchExpired = batchExpired[0]?.total || 0;

      var nearExpirationTime = new Date();
      nearExpirationTime.setDate(today.getDate() + 90);
      let nearExpirationString = getDateStringForMongo(nearExpirationTime);

      const batchNearExpiration = await AtomModel.aggregate([
        {
          $match: {
            "attributeSet.expDate": {
              $gte: today,
              $lt: nearExpiration,
            },
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $size: "$batchNumbers" } },
          },
        },
      ]);
      data.batchNearExpiration = batchNearExpiration[0]?.total || 0;

      const inventorySupplier = await ShipmentModel.count({
        "supplier.id": warehouseId,
      });
      const orderReceiver = await ShipmentModel.count({
        "receiver.id": warehouseId,
      });
      var inventoryToOrderRatio = 0;
      if (orderReceiver !== 0) {
        inventoryToOrderRatio = inventorySupplier / orderReceiver;
      }
      data.inventoryToOrderRatio = inventoryToOrderRatio;
      var count = 0;
      let org = await OrganisationModel.find({ id: req.user.organisationId });
      var totalmilliseconds = org.totalProcessingTime
        ? org.totalProcessingTime
        : 0;

      count = await POModel.aggregate([
        {
          $match: {
            poStatus: { $nin: ["CREATED", "ACCEPTED"] },
            // poStatus: { $ne: "ACCEPTED" },
          },
        },
        { $group: { _id: null, myCount: { $sum: 1 } } },
      ]).sort({
        createdAt: -1,
      });
      if (count.myCount > 0)
        totalmilliseconds = totalmilliseconds / count.myCount;

      var seconds = totalmilliseconds / 1000;
      var numdays = Math.floor(seconds / 86400);

      var numhours = Math.floor((seconds % 86400) / 3600);

      var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);

      // var numseconds = ((seconds % 86400) % 3600) % 60;
      var averageOrderProcessingTime =
        numdays + "days " + numhours + "hrs " + numminutes + "min";

      data.averageOrderProcessingTime = averageOrderProcessingTime;
      return apiResponse.successResponseWithData(res, "Analytics", data);
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getOverviewAnalytics = [
  auth,
  async (req, res) => {
    try {
      const { warehouseId, organisationId } = req.user;
      var overview = {};
      var data = {};

      var today = new Date();
      var lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 30);
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      const outboundShipments = await ShipmentModel.count({
        $and: [
          { "supplier.locationId": warehouseId },
          // { status: { $in : [ "SHIPPED", "RECEIVED" ]} }
        ],
      });
      overview.outboundShipments = outboundShipments;

      const inboundShipments = await ShipmentModel.count({
        $and: [
          { "receiver.locationId": warehouseId },
          // { status: { $in : [ "SHIPPED" ]} }
        ],
      });
      overview.inboundShipments = inboundShipments;

      const totalProductCategory = await ProductModel.distinct("type");
      overview.totalProductCategory = totalProductCategory.length;

      const records = await RecordModel.find();
      const shipments = await ShipmentModel.find({
        createdAt: {
          $gte: today.toISOString(),
          $lte: lastMonth.toISOString(),
        },
      });

      var count = 0;
      var sum = 0;
      for (var i = 0; i < records.length; i++) {
        for (var j = 0; j < shipments.length; j++) {
          if (records[i].id === shipments[j].poId) {
            count++;
            var shipmentCreationTime = shipments[j].createdAt;
            var poCreationTime = records[i].createdAt;
            sum = sum + (shipmentCreationTime - poCreationTime);
          }
        }
      }
      var totalmilliseconds = 0;
      if (count !== 0) {
        totalmilliseconds = sum / count;
      }

      var seconds = totalmilliseconds / 1000;
      var numdays = Math.floor(seconds / 86400);

      var numhours = Math.floor((seconds % 86400) / 3600);

      var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);

      // var numseconds = ((seconds % 86400) % 3600) % 60;
      var averageOrderProcessingTime =
        numdays + "d " + numhours + "h " + numminutes + "m";

      overview.averageOrderProcessingTime = averageOrderProcessingTime;

      // const numPO = await POModel.count();
      // const numSO = await ShippingOrderModel.count();
      // var pendingOrders = numPO + numSO;
      const pendingOrders = await RecordModel.count({
        $and: [
          { "supplier.supplierOrganisation": organisationId },
          { createdAt: { $lte: lastWeek } },
          { poStatus: "CREATED" },
        ],
      });
      overview.pendingOrders = pendingOrders;

      data.overview = overview;

      return apiResponse.successResponseWithData(res, "Analytics", data);
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getInventoryAnalytics = [
  auth,
  async (req, res) => {
    try {
      const { warehouseId } = req.user;
      var inventory = {};
      var data = {};

      const totalProductCategory = await ProductModel.distinct("type");
      inventory.totalProductCategory = totalProductCategory.length;
      const warehouse = await WarehouseModel.findOne({ id: warehouseId });

      const stockOut = await InventoryModel.find(
        {
          id: warehouse?.warehouseInventory,
          "inventoryDetails.quantity": { $lte: 0 },
        },
        "inventoryDetails"
      );

      inventory.stockOut = stockOut.length
        ? stockOut[0].inventoryDetails.filter((i) => i.quantity < 1).length
        : 0;

      var today = new Date();
      var nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const batchNearExpiration = await AtomModel.aggregate([
        {
          $match: {
            $and: [
              { status: "HEALTHY" },
              { "attributeSet.expDate": { $exists: true } },
              { "attributeSet.expDate": { $nin: ["", null] } },
              { "attributeSet.expDate": { $gte: today } },
              { "attributeSet.expDate": { $lt: nextMonth } },
              { currentInventory: warehouse?.warehouseInventory },
              { batchNumbers: { $ne: "" } },
            ],
          },
        },
        {
          $group: {
            _id: "$batchNumbers",
            total: { $sum: 1 },
          },
        },
      ]);

      const batchExpired = await AtomModel.aggregate([
        {
          $match: {
            $and: [
              { status: "HEALTHY" },
              { "attributeSet.expDate": { $exists: true } },
              { "attributeSet.expDate": { $nin: ["", null] } },
              { "attributeSet.expDate": { $lte: today } },
              { currentInventory: warehouse?.warehouseInventory },
              { batchNumbers: { $ne: "" } },
            ],
          },
        },
        {
          $group: {
            _id: "$batchNumbers",
            total: { $sum: 1 },
          },
        },
      ]);

      inventory.batchExpired = 0;
      if (batchExpired.length !== 0) {
        let sum = 0;
        for (let row of batchExpired) sum += parseInt(row.total);
        inventory.batchExpired = sum;
      }

      inventory.batchNearExpiration = 0;
      if (batchNearExpiration.length !== 0) {
        let sum = 0;
        for (let row of batchNearExpiration) sum += parseInt(row.total);
        inventory.batchNearExpiration = sum;
      }

      //   var nextMonth = new Date();
      //   nextMonth.setDate(today.getDate() + 30);

      //   const batchExpiringThisMonth = await AtomModel.aggregate(
      //     [ { $match: {
      //       "attributeSet.expDate" :  {
      //         $gte: today.toISOString(),
      //         $lt: nextMonth.toISOString()
      //         }
      //       }
      //     },
      //   {
      //     $group: {
      //       _id: "$status",
      //       total: {$sum: {$size: "$batchNumbers"}}
      //     }
      //   }]
      // );

      //   inventory.batchExpiringThisMonth = 0
      //   if(batchExpiringThisMonth.length !== 0){
      //     inventory.batchExpiringThisMonth = batchExpiringThisMonth[0].total;
      //   }

      //   var nextThreeMonths = new Date();
      //   nextThreeMonths.setDate(today.getDate() + 90 );

      //   const batchExpiringInThreeMonths = await AtomModel.aggregate(
      //     [ { $match: {
      //       "attributeSet.expDate" :  {
      //         $gte: today.toISOString(),
      //         $lt: nextThreeMonths.toISOString()
      //         }
      //       }
      //     },
      //   {
      //     $group: {
      //       _id: "$status",
      //       total: {$sum: {$size: "$batchNumbers"}}
      //     }
      //   }]
      // );
      //   inventory.batchExpiringInThreeMonths = 0
      //   if(batchExpiringInThreeMonths.length !== 0){
      //     inventory.batchExpiringInThreeMonths = batchExpiringInThreeMonths[0].total;
      //   }

      //   var nextSixMonths = new Date();
      //   nextSixMonths.setDate(today.getDate() + 180 );

      //   const batchExpiringInSixMonths = await AtomModel.aggregate(
      //     [ { $match: {
      //       "attributeSet.expDate" :  {
      //         $gte: today.toISOString(),
      //         $lt: nextSixMonths.toISOString()
      //         }
      //       }
      //     },
      //   {
      //     $group: {
      //       _id: "$status",
      //       total: {$sum: {$size: "$batchNumbers"}}
      //     }
      //   }]
      // );
      //   inventory.batchExpiringInSixMonths = 0
      //   if(batchExpiringInSixMonths.length !== 0){
      //     inventory.batchExpiringInSixMonths = batchExpiringInSixMonths[0].total;
      //   }

      //   const batchExpiredToday = await AtomModel.aggregate(
      //     [ { $match: {
      //         "attributeSet.expDate" :  {
      //           $eq: today.toISOString(),
      //           }
      //         }
      //       },
      //     {
      //       $group: {
      //         _id: "$status",
      //         total: {$sum: {$size: "$batchNumbers"}}
      //       }
      //     }]
      //   );
      //   inventory.batchExpiredToday = 0
      //   if(batchExpiredToday.length !== 0){
      //     inventory.batchExpiredToday = batchExpiredToday[0].total;
      //   }

      //   var lastWeek = new Date();
      //   lastWeek.setDate(today.getDate() - 7);

      //   const batchExpiredLastWeek = await AtomModel.aggregate(
      //     [ { $match: {
      //         "attributeSet.expDate" :  {
      //           $lte: today.toISOString(),
      //           $gte: lastWeek.toISOString()
      //           }
      //         }
      //       },
      //     {
      //       $group: {
      //         _id: "$status",
      //         total: {$sum: {$size: "$batchNumbers"}}
      //       }
      //     }]
      //   );
      //   inventory.batchExpiredLastWeek = 0
      //   if(batchExpiredLastWeek.length !== 0){
      //     inventory.batchExpiredLastWeek = batchExpiredLastWeek[0].total;
      //   }

      //   var lastMonth = new Date();
      //   lastMonth.setDate(today.getDate() - 30);

      //   const batchExpiredLastMonth = await AtomModel.aggregate(
      //     [ { $match: {
      //         "attributeSet.expDate" :  {
      //           $lte: today.toISOString(),
      //           $gte: lastMonth.toISOString()
      //           }
      //         }
      //       },
      //     {
      //       $group: {
      //         _id: "$status",
      //         total: {$sum: {$size: "$batchNumbers"}}
      //       }
      //     }]
      //   );
      //   inventory.batchExpiredLastMonth = 0
      //   if(batchExpiredLastMonth.length !== 0){
      //     inventory.batchExpiredLastMonth = batchExpiredLastMonth[0].total;
      //   }

      //   var lastYear = new Date();
      //   lastYear.setDate(today.getDate() -365 );

      //   const batchExpiredLastYear = await AtomModel.aggregate(
      //     [ { $match: {
      //         "attributeSet.expDate" :  {
      //           $lte: today.toISOString(),
      //           $gte: lastYear.toISOString()
      //           }
      //         }
      //       },
      //     {
      //       $group: {
      //         _id: "$status",
      //         total: {$sum: {$size: "$batchNumbers"}}
      //       }
      //     }]
      //   );
      //   inventory.batchExpiredLastYear = 0
      //   if(batchExpiredLastYear.length !== 0){
      //     inventory.batchExpiredLastYear = batchExpiredLastYear[0].total;
      //   }

      data.inventory = inventory;

      return apiResponse.successResponseWithData(res, "Analytics", data);
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getShipmentAnalytics = [
  auth,
  async (req, res) => {
    try {
      const { warehouseId } = req.user;
      var shipment = {};
      var data = {};

      const inboundShipments = await ShipmentModel.count({
        $and: [
          { "receiver.locationId": warehouseId },
          // { status: { $in : [ "SHIPPED" ]} }
        ],
      });
      shipment.inboundShipments = inboundShipments;

      const outboundShipments = await ShipmentModel.count({
        $and: [{ "supplier.locationId": warehouseId }],
      });
      shipment.outboundShipments = outboundShipments;

      const inboundAlerts = await ShipmentModel.count({
        $and: [
          { "receiver.locationId": warehouseId },
          {
            "shipmentAlerts.alertType": {
              $in: ["IOT", "DELAYED", "DAMAGED", "LOST"],
            },
          },
        ],
      });
      shipment.inboundAlerts = inboundAlerts;

      const outboundAlerts = await ShipmentModel.count({
        $and: [
          { "supplier.locationId": warehouseId },
          {
            "shipmentAlerts.alertType": {
              $in: ["IOT", "DELAYED", "DAMAGED", "LOST"],
            },
          },
        ],
      });
      shipment.outboundAlerts = outboundAlerts;

      data.shipment = shipment;

      return apiResponse.successResponseWithData(res, "Analytics", data);
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getOrderAnalytics = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const order = {};
      const data = {};

      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      const inboundPO = await RecordModel.count({
        $and: [{ "supplier.supplierOrganisation": organisationId }],
      });
      order.inboundPO = inboundPO;

      const outboundPO = await RecordModel.count({
        $or: [
          { "customer.customerOrganisation": organisationId },
          { createdBy: req.user.id },
        ],
      });
      order.outboundPO = outboundPO;

      const pendingOrders = await RecordModel.count({
        $and: [
          { "supplier.supplierOrganisation": organisationId },
          { createdAt: { $lte: lastWeek } },
          { poStatus: "CREATED" },
        ],
      });
      order.pendingOrders = pendingOrders;

      const rejectedOrders = await RecordModel.count({
        $and: [
          { "supplier.supplierOrganisation": organisationId },
          { poStatus: "REJECTED" },
        ],
      });
      order.rejectedOrders = rejectedOrders;

      data.order = order;

      return apiResponse.successResponseWithData(res, "Analytics", data);
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

// CENTRAL_AUTHORITY/GoverningBody only
exports.getNetworkAnalytics = [
  auth,
  async (req, res) => {
    try {
      const date =
        req.body?.date || format(startOfMonth(new Date()), "yyyy-MM-dd");

      let matchQueryStage1 = {
        status: "ACTIVE",
      };
      let { country, state, city } = req.body;
      if (country) {
        let temp = {
          ...matchQueryStage1,
          "country.countryName": country,
        };
        matchQueryStage1 = temp;
      }
      if (state) {
        let temp = {
          ...matchQueryStage1,
          "warehouseAddress.state": state,
        };
        matchQueryStage1 = temp;
      }
      if (city) {
        let temp = {
          ...matchQueryStage1,
          "warehouseAddress.city": city,
        };
        matchQueryStage1 = temp;
      }

      const networkAnalytics = await WarehouseModel.aggregate([
        { $match: matchQueryStage1 },
        {
          $lookup: {
            from: "organisations",
            let: { orgId: "$organisationId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
              { $project: { _id: 0, organisation: "$name" } },
            ],
            as: "organisation",
          },
        },
        { $unwind: "$organisation" },
        {
          $lookup: {
            localField: "warehouseInventory",
            from: "inventories",
            foreignField: "id",
            as: "inventory",
          },
        },
        { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },
        {
          $replaceWith: {
            $mergeObjects: [null, "$inventory", "$organisation"],
          },
        },
        {
          $unwind: {
            path: "$inventoryDetails",
          },
        },
        {
          $lookup: {
            from: "inventory_analytics",
            let: {
              arg1: "$inventoryDetails.productId",
              arg2: date,
              arg3: "$id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$productId", "$$arg1"],
                      },
                      {
                        $eq: ["$inventoryId", "$$arg3"],
                      },
                      {
                        $eq: ["$date", "$$arg2"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "inventory_analytics",
          },
        },
        {
          $unwind: {
            path: "$inventory_analytics",
          },
        },
        {
          $facet: {
            outStock: [
              {
                $match: {
                  "inventoryDetails.quantity": 0,
                },
              },
              {
                $group: {
                  _id: {
                    productId: "$inventoryDetails.productId",
                    orgId: "$organisation",
                  },
                },
              },
              {
                $count: "count",
              },
            ],
            inStock: [
              {
                $match: {
                  "inventoryDetails.quantity": {
                    $gt: 0,
                  },
                },
              },
              {
                $group: {
                  _id: {
                    productId: "$inventoryDetails.productId",
                    orgId: "$organisation",
                  },
                },
              },
              {
                $count: "count",
              },
            ],
            bestSellers: [
              {
                $group: {
                  _id: {
                    productId: "$inventoryDetails.productId",
                    orgId: "$organisation",
                  },
                  sales: {
                    $sum: "$inventory_analytics.sales",
                  },
                },
              },
              {
                $match: {
                  sales: {
                    $gt: 0,
                  },
                },
              },

              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const { bestSellers, inStock, outStock } = networkAnalytics[0];
      const analytics = {
        bestSeller: bestSellers[0]?.count || 0,
        inStock: inStock[0]?.count || 0,
        outStock: outStock[0]?.count || 0,
      };

      return apiResponse.successResponseWithData(res, "Network Analytics", {
        analytics,
      });
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.bestSellers = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body?.warehouseId || req.user.warehouseId;
      const date =
        req.body?.date || format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const reportType = req.body?.reportType || null;

      let bestSellers;
      let totalCount;

      const isGoverningBody = organisation?.type === "GoverningBody";
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
        organisation?.type === "DROGUERIA";
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;

      if (isGoverningBody && !warehouseId) {
        let res = await GovtBodyBestsellers(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          bestSellers = res[0].paginatedResults;
          totalCount = res[0].totalCount;
        } else {
          bestSellers = [];
          totalCount = 0;
        }
      } else {
        let matchQuery = {};
        if (isDist && !warehouseId) {
          if (
            req.user.warehouseId &&
            req.user.warehouseId !== req.body.warehouseId
          ) {
            matchQuery = await getDistributedProducts(
              matchQuery,
              req.user.warehouseId,
              `_id`
            );
          }
        } else {
          // matchQuery[`manufacturerId`] = req.user.organisationId;
        }
        bestSellers = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "inventoryDetails.productId",
              foreignField: "id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              totalSales: {
                $first: "$inventoryDetails.totalSales",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: {
              "inventoryAnalytics.sales": {
                $gt: 0,
              },
            },
          },
          {
            $match: matchQuery,
          },
          {
            $sort: {
              "inventoryAnalytics.sales": -1,
            },
          },
        ]);
      }

      const result = {
        bestSellers: bestSellers,
        totalCount: totalCount,
        warehouseId: warehouse,
      };

      if (reportType) {
        const reportData = await getDataForReport(
          "BESTSELLERS",
          result.bestSellers
        );
        if (reportType === "excel") {
          await buildExcelReport(
            res,
            reportData.header,
            reportData.excelData,
            "BESTSELLERS",
            date
          );
        } else {
          await buildPdfReport(res, reportData.pdfData, "BESTSELLERS", date);
        }
      } else {
        return apiResponse.successResponseWithData(res, "Best Sellers", result);
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.bestSellerSummary = [
  auth,
  async function (req, res) {
    try {
      const limit = req.body.limit || 5;
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;
      const isGoverningBody = organisation?.type === "GoverningBody";
      let warehouseQuery = {
        id: req.body.warehouseId || req.user.warehouseId,
      };
      let matchQuery = {};
      if (!isDist) {
        matchQuery[`manufacturerId`] = req.user.organisationId;
      }
      if (isGoverningBody) {
        matchQuery = {};
        warehouseQuery = {};
      }
      const bestSellers = await WarehouseModel.aggregate([
        {
          $match: warehouseQuery,
        },
        {
          $lookup: {
            localField: "warehouseInventory",
            from: "inventories",
            foreignField: "id",
            as: "inventory",
          },
        },
        {
          $unwind: {
            path: "$inventory",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceWith: {
            $mergeObjects: [null, "$inventory"],
          },
        },
        {
          $unwind: {
            path: "$inventoryDetails",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "inventoryDetails.productId",
            foreignField: "id",
            as: "products",
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $group: {
            _id: "$inventoryDetails.productId",
            productCategory: {
              $first: "$products.type",
            },
            productName: {
              $first: "$products.name",
            },
            unitofMeasure: {
              $first: "$products.unitofMeasure",
            },
            manufacturer: {
              $first: "$products.manufacturer",
            },
            manufacturerId: {
              $first: "$products.manufacturerId",
            },
            productQuantity: {
              $sum: "$inventoryDetails.quantity",
            },
            totalSales: {
              $sum: "$inventoryDetails.totalSales",
            },
          },
        },
        {
          $match: {
            totalSales: {
              $gt: 0,
            },
          },
        },
        {
          $match: matchQuery,
        },
        {
          $sort: {
            totalSales: -1,
          },
        },
        {
          $limit: limit,
        },
      ]);
      return apiResponse.successResponseWithData(res, "Best Sellers Summary", {
        limit,
        warehouseId: req.body.warehouseId || req.user.warehouseId,
        bestSellers,
      });
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.inStockReport = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const reportType = req.body.reportType || null;
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      let inStockReport;
      let totalCount;

      const isGoverningBody = organisation?.type === "GoverningBody";
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
        organisation?.type === "DROGUERIA";
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;

      if (isGoverningBody && !warehouseId) {
        let res = await GovtBodyInstock(date, req.body);

        if (res.length && res[0]?.paginatedResults) {
          inStockReport = res[0].paginatedResults;
          totalCount = res[0].totalCount;
        } else {
          inStockReport = [];
          totalCount = 0;
        }
      } else {
        let matchQuery1 = {};
        let matchQuery2 = {};
        let matchQuery3 = {};
        const { productCategory, id } = req.body;
        if (id) matchQuery3[`_id`] = id;
        if (productCategory) matchQuery3[`productCategory`] = productCategory;
        if (isDist && !warehouseId) {
          if (
            req.user.warehouseId &&
            req.user.warehouseId !== req.body.warehouseId
          ) {
            matchQuery1 = await getDistributedProducts(
              matchQuery1,
              req.user.warehouseId,
              `inventoryDetails.productId`
            );
          }
        } else {
          // matchQuery2[`manufacturerId`] = req.user.organisationId;
        }

        inStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "inventoryDetails.productId",
              foreignField: "id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $match: matchQuery3,
          },
          {
            $sort: {
              productQuantity: -1,
            },
          },
        ]);
      }

      const result = {
        inStockReport: inStockReport,
        totalCount: totalCount,
        warehouseId: warehouse,
      };

      if (reportType) {
        const reportData = await getDataForReport(
          "INSTOCK",
          result.inStockReport
        );
        if (reportType === "excel") {
          await buildExcelReport(
            res,
            reportData.header,
            reportData.excelData,
            "INSTOCK",
            date
          );
        } else {
          await buildPdfReport(res, reportData.pdfData, "INSTOCK", date);
        }
      } else {
        return apiResponse.successResponseWithData(
          res,
          "In stock Report",
          result
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.outOfStockReport = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date =
        req.body.date || format(startOfMonth(new Date()), "yyyy-MM-dd");
      const reportType = req.body.reportType || null;
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      let outOfStockReport;
      let totalCount;

      const isGoverningBody = organisation?.type === "GoverningBody";
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
        organisation?.type === "DROGUERIA";
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;

      if (isGoverningBody && !warehouseId) {
        let res = await GovtBodyOutstock(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          outOfStockReport = res[0].paginatedResults;
          totalCount = res[0].totalCount;
        } else {
          outOfStockReport = [];
          totalCount = 0;
        }
      } else {
        let matchQuery = {};
        let matchQuery1 = {};
        let matchQuery2 = {};
        let matchQuery3 = {};
        const { productCategory, id } = req.body;
        if (id) matchQuery3[`_id`] = id;
        if (productCategory) matchQuery3[`productCategory`] = productCategory;

        if (isDist && !warehouseId) {
          matchQuery[`totalSales`] = {
            $gt: 0,
          };
          if (
            req.user.warehouseId &&
            req.user.warehouseId !== req.body.warehouseId
          ) {
            matchQuery1 = await getDistributedProducts(
              matchQuery1,
              req.user.warehouseId,
              `inventoryDetails.productId`
            );
          }
        } else {
          // matchQuery2[`manufacturerId`] = req.user.organisationId;
        }
        outOfStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": 0,
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "inventoryDetails.productId",
              foreignField: "id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: matchQuery,
          },
          {
            $match: matchQuery2,
          },
          {
            $match: matchQuery3,
          },
          {
            $sort: {
              "inventoryAnalytics.outOfStockDays": -1,
            },
          },
        ]);
      }

      const result = {
        outOfStockReport: outOfStockReport,
        totalCount: totalCount,
        warehouseId: warehouse,
      };

      if (reportType) {
        const reportData = await getDataForReport(
          "OUTOFSTOCK",
          result.outOfStockReport
        );
        if (reportType === "excel") {
          await buildExcelReport(
            res,
            reportData.header,
            reportData.excelData,
            "OUTSTOCK",
            date
          );
        } else {
          await buildPdfReport(res, reportData.pdfData, "OUTSTOCK", date);
        }
      } else {
        return apiResponse.successResponseWithData(
          res,
          "Out of stock Report",
          result
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.expiredStockReport = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");

      const today = new Date();
      const reportType = req.body.reportType || null;
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      let expiredProducts;
      let totalCount;
      const isGoverningBody = organisation?.type === "GoverningBody";
      if (isGoverningBody) {
        // Default warehouseId
        let res = await GovtBodyExpired(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          expiredProducts = res[0].paginatedResults;
          totalCount = res[0].totalCount;
        } else {
          expiredProducts = [];
          totalCount = 0;
        }
      } else {
        const isDist =
          organisation?.type === "DISTRIBUTORS" ||
            organisation?.type === "DROGUERIA"
            ? true
            : false;
        let matchQuery1 = {};
        let matchQuery2 = {};
        let matchQuery3 = {};
        const { productCategory, id } = req.body;
        if (id) matchQuery3[`_id`] = id;
        if (productCategory) matchQuery3[`productCategory`] = productCategory;
        if (!isDist) {
          matchQuery2[`manufacturerId`] = req.user.organisationId;
        } else {
          if (
            req.user.warehouseId &&
            req.user.warehouseId !== req.body.warehouseId
          ) {
            matchQuery1 = await getDistributedProducts(
              matchQuery1,
              req.user.warehouseId,
              `inventoryDetails.productId`
            );
          }
        }
        expiredProducts = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              let: {
                productId: "$inventoryDetails.productId",
                inventoryId: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$id", "$$productId"] }],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "atoms",
                    let: { inventoryId: "$$inventoryId", productId: "$id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$currentInventory", "$$inventoryId"] },
                              { $eq: ["$productId", "$$productId"] },
                              { $eq: ["$status", "HEALTHY"] },
                              { $gte: ["$attributeSet.expDate", null] },
                              { $ne: ["$attributeSet.expDate", null] },
                              { $lt: ["$attributeSet.expDate", today] },
                            ],
                          },
                        },
                      },
                      {
                        $unwind: "$batchNumbers",
                      },
                      {
                        $group: {
                          _id: {
                            productId: "$productId",
                            batchNumber: "$batchNumbers",
                            expDate: "$attributeSet.expDate",
                          },
                          quantity: { $sum: "$quantity" },
                        },
                      },
                    ],
                    as: "atom",
                  },
                },
                {
                  $unwind: "$atom",
                },
              ],
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              batchNumber: {
                $first: "$product.atom._id.batchNumber",
              },
              productQuantity: {
                $sum: "$product.atom.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
              expiredDates: {
                $first: "$product.atom._id.expDate",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $match: matchQuery3,
          },
          {
            $sort: {
              expiredDates: 1,
            },
          },
        ]);
      }

      const result = {
        expiredProducts: expiredProducts,
        totalCount: totalCount,
        warehouseId: warehouse,
      };

      if (reportType) {
        const reportData = await getDataForReport("EXPIRED", expiredProducts);
        if (reportType === "excel") {
          await buildExcelReport(
            res,
            reportData.header,
            reportData.excelData,
            "EXPIRED",
            date
          );
        } else {
          await buildPdfReport(res, reportData.pdfData, "EXPIRED", date);
        }
      } else {
        return apiResponse.successResponseWithData(
          res,
          "Expired products Report",
          result
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.nearExpiryStockReport = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");

      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const reportType = req.body.reportType || null;
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      let nearExpiryProducts;
      let totalCount;
      const isGoverningBody = organisation?.type === "GoverningBody";
      if (isGoverningBody) {
        // Default warehouseId
        let res = await GovtBodyNearExpiry(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          nearExpiryProducts = res[0].paginatedResults;
          totalCount = res[0].totalCount;
        } else {
          nearExpiryProducts = [];
          totalCount = 0;
        }
      } else {
        const isDist =
          organisation?.type === "DISTRIBUTORS" ||
            organisation?.type === "DROGUERIA"
            ? true
            : false;
        let matchQuery1 = {};
        let matchQuery2 = {};
        let matchQuery3 = {};
        const { productCategory, id } = req.body;
        if (id) matchQuery3[`_id`] = id;
        if (productCategory) matchQuery3[`productCategory`] = productCategory;
        if (!isDist) {
          matchQuery2[`manufacturerId`] = req.user.organisationId;
        } else {
          if (
            req.user.warehouseId &&
            req.user.warehouseId !== req.body.warehouseId
          ) {
            matchQuery1 = await getDistributedProducts(
              matchQuery1,
              req.user.warehouseId,
              `inventoryDetails.productId`
            );
          }
        }
        nearExpiryProducts = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              let: {
                productId: "$inventoryDetails.productId",
                inventoryId: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$id", "$$productId"] }],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "atoms",
                    let: { inventoryId: "$$inventoryId", productId: "$id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$currentInventory", "$$inventoryId"] },
                              { $eq: ["$productId", "$$productId"] },
                              { $eq: ["$status", "HEALTHY"] },
                              { $gte: ["$attributeSet.expDate", null] },
                              { $ne: ["$attributeSet.expDate", null] },
                              { $gte: ["$attributeSet.expDate", today] },
                              { $lt: ["$attributeSet.expDate", nextMonth] },
                            ],
                          },
                        },
                      },
                      {
                        $unwind: "$batchNumbers",
                      },
                      {
                        $group: {
                          _id: {
                            productId: "$productId",
                            batchNumber: "$batchNumbers",
                            expDate: "$attributeSet.expDate",
                          },
                          quantity: { $sum: "$quantity" },
                        },
                      },
                    ],
                    as: "atom",
                  },
                },
                {
                  $unwind: "$atom",
                },
              ],
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              batchNumber: {
                $first: "$product.atom._id.batchNumber",
              },
              productQuantity: {
                $sum: "$product.atom.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
              expiredDates: {
                $first: "$product.atom._id.expDate",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $match: matchQuery3,
          },
          {
            $sort: {
              expiredDates: 1,
            },
          },
        ]);
      }

      const result = {
        nearExpiryProducts: nearExpiryProducts,
        totalCount: totalCount,
        warehouseId: warehouse,
      };

      if (reportType) {
        const reportData = await getDataForReport(
          "NEAR_EXPIRY",
          result.nearExpiryProducts
        );
        if (reportType === "excel") {
          await buildExcelReport(
            res,
            reportData.header,
            reportData.excelData,
            "NEAR_EXPIRY",
            date
          );
        } else {
          await buildPdfReport(res, reportData.pdfData, "NEAR_EXPIRY", date);
        }
      } else {
        return apiResponse.successResponseWithData(
          res,
          "Near expiry products Report",
          result
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.inStockFilterOptions = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;
      let matchQuery1 = {};
      let matchQuery2 = {};
      let inStockReport;
      let Filters;

      if (!isDist && !warehouseId) {
        // matchQuery2[`manufacturerId`] = req.user.organisationId;
        inStockReport = await GovtBodyInstock(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          Filters = inStockReport[0].paginatedResults;
        } else {
          Filters = [];
        }
      } else {
        if (
          req.user.warehouseId &&
          req.user.warehouseId !== req.body.warehouseId
        ) {
          matchQuery1 = await getDistributedProducts(
            matchQuery1,
            req.user.warehouseId,
            `inventoryDetails.productId`
          );
        }
        inStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "inventoryDetails.productId",
              foreignField: "id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $group: {
              _id: "productFilters",
              products: {
                $addToSet: {
                  productId: "$_id",
                  productName: "$productName",
                  productCategory: "$productCategory",
                  manufacturer: "$manufacturer",
                  manufacturerId: "$manufacturerId",
                },
              },
            },
          },
        ]);

        Filters = inStockReport.length > 0 ? inStockReport[0].products : [];
      }

      return apiResponse.successResponseWithData(
        res,
        "In stock Report Filters",
        {
          filters: Filters,
          warehouseId: warehouse,
        }
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.outOfStockFilterOptions = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date =
        req.body.date || format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;

      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;
      let matchQuery = {};
      let matchQuery1 = {};
      let matchQuery2 = {};
      let outOfStockReport;
      let Filters;
      if (!isDist && !warehouseId) {
        // matchQuery2[`manufacturerId`] = req.user.organisationId;
        outOfStockReport = await GovtBodyOutstock(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          Filters = outOfStockReport[0].paginatedResults;
        } else {
          Filters = [];
        }
      } else {
        matchQuery[`totalSales`] = {
          $gt: 0,
        };
        if (
          req.user.warehouseId &&
          req.user.warehouseId !== req.body.warehouseId
        ) {
          matchQuery1 = await getDistributedProducts(
            matchQuery1,
            req.user.warehouseId,
            `inventoryDetails.productId`
          );
        }
        outOfStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": 0,
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "inventoryDetails.productId",
              foreignField: "id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          // {
          //   $match: matchQuery,
          // },
          {
            $match: matchQuery2,
          },
          {
            $group: {
              _id: "productFilters",
              products: {
                $addToSet: {
                  productId: "$_id",
                  productName: "$productName",
                  productCategory: "$productCategory",
                },
              },
            },
          },
        ]);

        Filters =
          outOfStockReport.length > 0 ? outOfStockReport[0].products : [];
      }

      return apiResponse.successResponseWithData(res, "Out of stock Report", {
        filters: Filters,
        warehouseId: warehouse,
      });
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.bestSellerFilterOptions = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date =
        req.body.date || format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;
      const isGoverningBody = organisation?.type === "GoverningBody";
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;

      let matchQuery = {};

      let { country, state, city } = req.body;
      let matchQueryStage1 = {
        status: "ACTIVE",
      };
      if (country) {
        let temp = {
          ...matchQueryStage1,
          "country.countryName": country,
        };
        matchQueryStage1 = temp;
      }
      if (state) {
        let temp = {
          ...matchQueryStage1,
          "warehouseAddress.state": state,
        };
        matchQueryStage1 = temp;
      }
      if (city) {
        let temp = {
          ...matchQueryStage1,
          "warehouseAddress.city": city,
        };
        matchQueryStage1 = temp;
      }

      let Filters;
      if (!isDist && !warehouseId) {
        matchQuery[`manufacturerId`] = req.user.organisationId;
      } else {
        if (
          req.user.warehouseId &&
          req.user.warehouseId !== req.body.warehouseId
        ) {
          matchQuery = await getDistributedProducts(
            matchQuery,
            req.user.warehouseId,
            `_id`
          );
        }
      }
      if (isGoverningBody) matchQuery = {};
      let bestSellerStockReport = await WarehouseModel.aggregate([
        {
          $match: matchQueryStage1,
        },
        {
          $lookup: {
            from: "organisations",
            let: { orgId: "$organisationId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$$orgId", "$id"] } } },
              { $project: { _id: 0, organisation: "$name" } },
            ],
            as: "organisation",
          },
        },
        {
          $unwind: "$organisation",
        },
        {
          $lookup: {
            localField: "warehouseInventory",
            from: "inventories",
            foreignField: "id",
            as: "inventory",
          },
        },
        {
          $unwind: {
            path: "$inventory",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            address: {
              address: {
                firstLine: "$warehouseAddress.firstLine",
                city: "$warehouseAddress.city",
                state: "$warehouseAddress.state",
                country: "$country.countryName",
                region: "$region.regionName",
              },
            },
          },
        },
        {
          $replaceWith: {
            $mergeObjects: [null, "$inventory", "$organisation", "$address"],
          },
        },
        {
          $unwind: {
            path: "$inventoryDetails",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "inventoryDetails.productId",
            foreignField: "id",
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
          },
        },
        {
          $lookup: {
            from: "inventory_analytics",
            let: {
              arg1: "$inventoryDetails.productId",
              arg2: date,
              arg3: "$id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$productId", "$$arg1"],
                      },
                      {
                        $eq: ["$inventoryId", "$$arg3"],
                      },
                      {
                        $eq: ["$date", "$$arg2"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "inventory_analytics",
          },
        },
        {
          $unwind: {
            path: "$inventory_analytics",
          },
        },
        {
          $group: {
            _id: {
              productId: "$inventoryDetails.productId",
              orgId: "$organisation",
            },
            productCategory: {
              $first: "$product.type",
            },
            productName: {
              $first: "$product.name",
            },
            unitofMeasure: {
              $first: "$product.unitofMeasure",
            },
            manufacturer: {
              $first: "$product.manufacturer",
            },
            manufacturerId: {
              $first: "$product.manufacturerId",
            },
            organisation: {
              $first: "$organisation",
            },
            address: {
              $first: "$address",
            },
            productQuantity: {
              $sum: "$inventoryDetails.quantity",
            },
            totalSales: {
              $sum: "$inventoryDetails.totalSales",
            },
            inventoryAnalytics: {
              $first: "$inventory_analytics",
            },
            updatedAt: {
              $first: "$inventoryDetails.updatedAt",
            },
          },
        },
        {
          $match: {
            "inventoryAnalytics.sales": {
              $gt: 0,
            },
          },
        },
        {
          $match: matchQuery,
        },
        {
          $sort: {
            "inventoryAnalytics.sales": -1,
          },
        },
      ]);

      Filters = bestSellerStockReport.length > 0 ? bestSellerStockReport : [];

      return apiResponse.successResponseWithData(res, "Out of stock Report", {
        filters: Filters,
        warehouseId: warehouse,
      });
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.nearExpiryFilterOptions = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;
      const warehouseId =
        req.body?.warehouseId === "" ? null : req.body?.warehouseId;

      let matchQuery1 = {};
      let matchQuery2 = {};
      let inStockReport;
      let Filters;

      if (!isDist && !warehouseId) {
        // matchQuery2[`manufacturerId`] = req.user.organisationId;
        inStockReport = await GovtBodyNearExpiry(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          Filters = inStockReport[0].paginatedResults;
        } else {
          Filters = [];
        }
      } else {
        if (
          req.user.warehouseId &&
          req.user.warehouseId !== req.body.warehouseId
        ) {
          matchQuery1 = await getDistributedProducts(
            matchQuery1,
            req.user.warehouseId,
            `inventoryDetails.productId`
          );
        }

        let { productCategory, productName, manufacturer } = body;

        if (productCategory) matchQuery2["productCategory"] = productCategory;
        if (productName) matchQuery2["productName"] = productName;
        if (manufacturer) matchQuery2["manufacturer"] = manufacturer;

        let today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        inStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              let: {
                productId: "$inventoryDetails.productId",
                inventoryId: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$id", "$$productId"] }],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "atoms",
                    let: { inventoryId: "$$inventoryId", productId: "$id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$currentInventory", "$$inventoryId"] },
                              { $eq: ["$productId", "$$productId"] },
                              { $eq: ["$status", "HEALTHY"] },
                              { $gte: ["$attributeSet.expDate", null] },
                              { $ne: ["$attributeSet.expDate", null] },
                              { $gte: ["$attributeSet.expDate", today] },
                              { $lt: ["$attributeSet.expDate", nextMonth] },
                            ],
                          },
                        },
                      },
                      {
                        $unwind: "$batchNumbers",
                      },
                      {
                        $group: {
                          _id: {
                            productId: "$productId",
                            batchNumber: "$batchNumbers",
                            expDate: "$attributeSet.expDate",
                          },
                          quantity: { $sum: "$quantity" },
                        },
                      },
                    ],
                    as: "atom",
                  },
                },
                {
                  $unwind: "$atom",
                },
              ],
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $group: {
              _id: "productFilters",
              products: {
                $addToSet: {
                  productId: "$_id",
                  productName: "$productName",
                  productCategory: "$productCategory",
                  manufacturer: "$manufacturer",
                  manufacturerId: "$manufacturerId",
                },
              },
            },
          },
        ]);

        Filters = inStockReport.length > 0 ? inStockReport[0].products : [];
      }

      return apiResponse.successResponseWithData(
        res,
        "In stock Report Filters",
        {
          filters: Filters,
          warehouseId: warehouse,
        }
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.expiredFilterOptions = [
  auth,
  async (req, res) => {
    try {
      const warehouse = req.body.warehouseId || req.user.warehouseId;
      const date = req.body.date
        ? format(startOfMonth(new Date(req.body.date)), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const organisation = await OrganisationModel.findOne({
        id: req.user.organisationId,
      });
      const isDist =
        organisation?.type === "DISTRIBUTORS" ||
          organisation?.type === "DROGUERIA"
          ? true
          : false;
      let matchQuery1 = {};
      let matchQuery2 = {};
      let inStockReport;
      let Filters;

      if (!isDist) {
        // matchQuery2[`manufacturerId`] = req.user.organisationId;
        inStockReport = await GovtBodyExpired(date, req.body);
        if (res.length && res[0]?.paginatedResults) {
          Filters = inStockReport[0].paginatedResults;
        } else {
          Filters = [];
        }
      } else {
        if (
          req.user.warehouseId &&
          req.user.warehouseId !== req.body.warehouseId
        ) {
          matchQuery1 = await getDistributedProducts(
            matchQuery1,
            req.user.warehouseId,
            `inventoryDetails.productId`
          );
        }

        let { productCategory, productName, manufacturer } = body;

        if (productCategory) matchQuery2["productCategory"] = productCategory;
        if (productName) matchQuery2["productName"] = productName;
        if (manufacturer) matchQuery2["manufacturer"] = manufacturer;

        let today = new Date();

        inStockReport = await WarehouseModel.aggregate([
          {
            $match: {
              id: warehouse,
            },
          },
          {
            $lookup: {
              localField: "warehouseInventory",
              from: "inventories",
              foreignField: "id",
              as: "inventory",
            },
          },
          {
            $unwind: {
              path: "$inventory",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $replaceWith: {
              $mergeObjects: [null, "$inventory"],
            },
          },
          {
            $unwind: {
              path: "$inventoryDetails",
            },
          },
          {
            $match: matchQuery1,
          },
          {
            $match: {
              "inventoryDetails.quantity": {
                $gt: 0,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              let: {
                productId: "$inventoryDetails.productId",
                inventoryId: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$id", "$$productId"] }],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "atoms",
                    let: { inventoryId: "$$inventoryId", productId: "$id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$currentInventory", "$$inventoryId"] },
                              { $eq: ["$productId", "$$productId"] },
                              { $eq: ["$status", "HEALTHY"] },
                              { $gte: ["$attributeSet.expDate", null] },
                              { $ne: ["$attributeSet.expDate", null] },
                              { $lt: ["$attributeSet.expDate", today] },
                            ],
                          },
                        },
                      },
                      {
                        $unwind: "$batchNumbers",
                      },
                      {
                        $group: {
                          _id: {
                            productId: "$productId",
                            batchNumber: "$batchNumbers",
                            expDate: "$attributeSet.expDate",
                          },
                          quantity: { $sum: "$quantity" },
                        },
                      },
                    ],
                    as: "atom",
                  },
                },
                {
                  $unwind: "$atom",
                },
              ],
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",
            },
          },
          {
            $lookup: {
              from: "inventory_analytics",
              let: {
                arg1: "$inventoryDetails.productId",
                arg2: date,
                arg3: "$id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$productId", "$$arg1"],
                        },
                        {
                          $eq: ["$inventoryId", "$$arg3"],
                        },
                        {
                          $eq: ["$date", "$$arg2"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "inventory_analytics",
            },
          },
          {
            $unwind: {
              path: "$inventory_analytics",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$inventoryDetails.productId",
              productCategory: {
                $first: "$product.type",
              },
              productName: {
                $first: "$product.name",
              },
              unitofMeasure: {
                $first: "$product.unitofMeasure",
              },
              manufacturer: {
                $first: "$product.manufacturer",
              },
              manufacturerId: {
                $first: "$product.manufacturerId",
              },
              productQuantity: {
                $sum: "$inventoryDetails.quantity",
              },
              totalSales: {
                $sum: "$inventoryDetails.totalSales",
              },
              inventoryAnalytics: {
                $first: "$inventory_analytics",
              },
              updatedAt: {
                $first: "$inventoryDetails.updatedAt",
              },
            },
          },
          {
            $match: matchQuery2,
          },
          {
            $group: {
              _id: "productFilters",
              products: {
                $addToSet: {
                  productId: "$_id",
                  productName: "$productName",
                  productCategory: "$productCategory",
                  manufacturer: "$manufacturer",
                  manufacturerId: "$manufacturerId",
                },
              },
            },
          },
        ]);

        Filters = inStockReport.length > 0 ? inStockReport[0].products : [];
      }

      return apiResponse.successResponseWithData(
        res,
        "In stock Report Filters",
        {
          filters: Filters,
          warehouseId: warehouse,
        }
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

async function getDataForReport(reportType, data) {
  const rowsPDF = [];
  const rowsExcel = [];
  const head = [
    { text: "Product ID", bold: true, field: "_id" },
    { text: "Product Category", bold: true, field: "productCategory" },
    { text: "Product Name", bold: true, field: "productName" },
    { text: "Manufacturer", bold: true, field: "manufacturer" },
  ];
  if (reportType === "INSTOCK") {
    head.push({
      text: "Opening Balance",
      bold: true,
      field: "openingBalance",
    });
    head.push({
      text: "Current Inventory Balance",
      bold: true,
      field: "productQuantity",
    });
    head.push({ text: "Total Sales", bold: true, field: "totalSales" });
  } else if (reportType === "OUTOFSTOCK") {
    head.push({
      text: "Product out of Stock",
      bold: true,
      field: "outOfStockDays",
    });
  } else if (reportType === "BESTSELLERS") {
    head.push({
      text: "No. of Units Sold",
      bold: true,
      field: "sales",
    });
  }
  rowsPDF.push(head);
  for (let i = 0; i < data.length; i++) {
    const row = [
      data[i]._id || "N/A",
      data[i].productCategory || "N/A",
      data[i].productName || "N/A",
      data[i].manufacturer || "N/A",
    ];
    const rowObj = {
      _id: data[i]._id || "N/A",
      productCategory: data[i].productCategory || "N/A",
      productName: data[i].productName || "N/A",
      manufacturer: data[i].manufacturer || "N/A",
    };

    if (reportType === "INSTOCK") {
      row.push(data[i].inventoryAnalytics?.openingBalance || 0);
      row.push(data[i].productQuantity || 0);
      row.push(data[i].totalSales || 0);

      rowObj["openingBalance"] =
        data[i].inventoryAnalytics?.openingBalance || 0;
      rowObj["productQuantity"] = data[i].productQuantity || 0;
      rowObj["totalSales"] = data[i].inventoryAnalytics?.totalSales || 0;
    } else if (reportType === "OUTOFSTOCK") {
      row.push(data[i].inventoryAnalytics?.outOfStockDays || "N/A");

      rowObj["outOfStockDays"] =
        data[i].inventoryAnalytics?.outOfStockDays || "N/A";
    } else if (reportType === "BESTSELLERS") {
      row.push(data[i]?.sales || "N/A");

      rowObj["sales"] = data[i]?.sales || "N/A";
    }
    rowsPDF.push(row);
    rowsExcel.push(rowObj);
  }
  return {
    header: head,
    pdfData: rowsPDF,
    excelData: rowsExcel,
  };
}
