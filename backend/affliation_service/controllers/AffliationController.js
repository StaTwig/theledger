const apiResponse = require("../utils/apiResponse");
const Organisation = require("../models/organisationModel");
const EmployeeModel = require("../models/employeeModel");
const auth = require("../middlewares/jwt");

exports.pendingRequests = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const affiliations = await Organisation.aggregate([
        {
          $match: {
            id: organisationId,
            "affiliations.request_status": "PENDING",
          },
        },
        { $unwind: "$affiliations" },
        {
          $lookup: {
            from: "employees",
            let: { employee: "$affiliations" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$id", "$$employee.employee_id"] },
                      { $eq: ["$$employee.request_status", "PENDING"] },
                    ],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            includeArrayIndex: "arrayIndex",
          },
        },
        {
          $lookup: {
            from: "organisations",
            localField: "user.organisationId",
            foreignField: "id",
            as: "user.org",
          },
        },
        {
          $unwind: {
            path: "$user.org",
            includeArrayIndex: "arrayIndex",
          },
        },
        {
          $project: {
            _id: 0,
            affiliations: 1,
            name: 1,
            user: {
              walletAddress: 1,
              firstName: 1,
              lastName: 1,
              photoId: 1,
              emailId: 1,
              org: {
                name: 1,
              },
            },
          },
        },
        {
          $sort: { "affiliations.request_date": -1 },
        },
      ])
      return apiResponse.successResponseWithData(
        res,
        "Pending Requests",
        affiliations
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.sentRequests = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const affiliations = await Organisation.aggregate([
        { $match: { organisationId: { $ne: organisationId } } },
        { $unwind: "$affiliations" },
        {
          $lookup: {
            from: "employees",
            let: { employee: "$affiliations" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$id", "$$employee.employee_id"] },
                      { $eq: ["$organisationId", organisationId] },
                    ],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $project: {
            _id: 0,
            affiliations: 1,
            name: 1,
            user: {
              walletAddress: 1,
              firstName: 1,
              lastName: 1,
              photoId: 1,
              emailId: 1,
            },
          },
        },
        {
          $unwind: {
            path: "$user",
            includeArrayIndex: "arrayIndex",
          },
        },
        {
          $sort: { "affiliations.request_date": -1 },
        },
      ])
      return apiResponse.successResponseWithData(
        res,
        "Sent Requests",
        affiliations
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.affiliateOrg = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const affiliations = await Organisation.aggregate([
        {
          $match: {
            id: organisationId,
            $or: [
              { "affiliations.request_status": "APPROVED" },
              { "affiliations.request_status": "PENDING" },
            ],
          },
        },
        { $unwind: "$affiliations" },
        {
          $lookup: {
            from: "employees",
            let: { employee: "$affiliations" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$id", "$$employee.employee_id"] },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            includeArrayIndex: "arrayIndex",
          },
        },
        {
          $lookup: {
            from: "organisations",
            localField: "user.organisationId",
            foreignField: "id",
            as: "user.org",
          },
        },
        {
          $unwind: {
            path: "$user.org",
            includeArrayIndex: "arrayIndex",
          },
        },
        {
          $project: {
            _id: 0,
            affiliations: 1,
            user: {
              walletAddress: 1,
              firstName: 1,
              lastName: 1,
              photoId: 1,
              emailId: 1,
              org: {
                id: 1,
                name: 1,
                postalAddress: 1,
              },
            },
          },
        },
        {
          $sort: { "affiliations.request_date": -1 },
        },
        {
          $group: {
            _id: "$user.org.name",
            user: { $first: "$user" },
            affiliations: { $push: "$$ROOT" },
            // orgs: { $push: "$$ROOT" },
          },
        },
      ])
      return apiResponse.successResponseWithData(
        res,
        "Affiliated Organizations Details",
        affiliations
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.allAffiliateOrgs = [
  auth,
  async (req, res) => {
    try {
      const orgs = await EmployeeModel.find({ organisationId: req.user.organisationId })
        .select("affiliatedOrganisations")
      const orgSet = new Set();
      orgs.map((item) => {
        item.affiliatedOrganisations.map((e) => {
          orgSet.add(e);
        });
      });
      if (orgSet.size > 0) {
        const orgArray = [...orgSet];
        const organisationList = await Organisation.find({ id: { $in: orgArray } })
        return apiResponse.successResponseWithData(
          res,
          "All Affiliated Organizations Details",
          organisationList
        );
      } else {
        return apiResponse.notFoundResponse(
          res,
          " No Affiliated Organizations Found"
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.acceptAffiliate = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const { employee_id } = req.query;
      const resUpdate = await Organisation.updateOne(
        {
          $and: [
            { id: organisationId },
            { "affiliations.request_status": "PENDING" },
            { "affiliations.employee_id": employee_id },
          ],
        },
        {
          $set: {
            "affiliations.$.request_status": "APPROVED",
            "affiliations.$.last_updated_on": new Date(),
          },
        }
      )
      let res_message = "Affiliation request approved";
      if (resUpdate.nModified == 0)
        res_message =
          "Affiliation request not approved. Refresh the page and try again!!!";
      return apiResponse.successResponseWithData(
        res,
        res_message,
        resUpdate
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.rejectAffiliate = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const { employee_id } = req.query;
      const resUpdate = await Organisation.updateOne(
        {
          $and: [
            { id: organisationId },
            { "affiliations.request_status": "PENDING" },
            { "affiliations.employee_id": employee_id },
          ],
        },
        {
          $set: {
            "affiliations.$.request_status": "REJECTED",
            "affiliations.$.last_updated_on": new Date(),
          },
        }
      )
      let res_message = "Affiliation request rejected";
      if (resUpdate.nModified == 0)
        res_message =
          "Affiliation request not rejected. Refresh the page and try again!!!";
      return apiResponse.successResponseWithData(
        res,
        res_message,
        resUpdate
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.unAffiliate = [
  auth,
  async (req, res) => {
    try {
      const { id } = req.query;
      await Organisation.update(
        {},
        {
          $pull: {
            affiliations: {
              employee_id: id,
            },
          },
        },
        { multi: true }
      )
      return apiResponse.successResponse(
        res,
        "UnAffiliated employee"
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.unAffiliateOrg = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const { emp } = req.body;
      const affiliatedOrgs = await Organisation.updateOne(
        { id: organisationId },
        {
          $pull: {
            affiliations: {
              employee_id: { $in: emp },
              request_status: "APPROVED",
            },
          },
        }
      )
      if (affiliatedOrgs.ok) {
        return apiResponse.successResponse(res, `Organisation unaffiliated`);
      } else {
        return apiResponse.errorResponse(res, "Please try again");
      }
    } catch (err) {
      console.log(err)
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.affiliate = [
  auth,
  async (req, res) => {
    try {
      const dateTimeNow = new Date();
      const { employee, org } = req.body;
      const orgResponse = await Organisation.updateOne(
        { id: org, "affiliations.employee_id": { $ne: employee } },
        {
          $push: {
            affiliations: {
              employee_id: employee,
              request_date: dateTimeNow,
              request_status: "PENDING",
              last_updated_on: dateTimeNow,
            },
          },
        },
        {
          new: true,
        }
      )
      let res_message = "Affiliation Request Sent";
      if (orgResponse.nModified == 0)
        res_message = "User already affiliated to the organisation";
      return apiResponse.successResponseWithData(
        res,
        res_message,
        orgResponse
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];

exports.getAllOrg = [
  auth,
  async (req, res) => {
    try {
      const { organisationId } = req.user;
      const organizations = await Organisation.find({
        id: { $ne: organisationId },
      }).select("name id");
      return apiResponse.successResponseWithData(
        res,
        "All organizations",
        organizations
      );
    } catch (err) {
      console.log(err);
      return apiResponse.errorResponse(res, err);
    }
  },
];
