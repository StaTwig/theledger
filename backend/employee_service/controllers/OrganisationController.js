const OrganisationModel = require("../models/OrganisationModel");
const EmployeeModel = require("../models/EmployeeModel");
const WarehouseModel = require("../models/WarehouseModel");
const InventoryModel = require("../models/InventoryModel");
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");
const moment = require("moment");
const CounterModel = require("../models/CounterModel");
const logEvent = require("../../../utils/event_logger/eventLogger");
const { getLatLongByCity } = require("../helpers/getLatLong");
const cuid = require("cuid");
const axios = require("axios");
const hf_blockchain_url = process.env.HF_BLOCKCHAIN_URL || "http://3.110.249.128:8080";
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const EmployeeIdMap = new Map();

async function createWarehouse(address, warehouseId, organisationId, region, country) {
	const invCounter = await CounterModel.findOneAndUpdate(
		{ "counters.name": "inventoryId" },
		{
			$inc: {
				"counters.$.value": 1,
			},
		},
		{
			new: true,
		},
	);
	const inventoryId = invCounter.counters[7].format + invCounter.counters[7].value;
	const inventoryResult = new InventoryModel({ id: inventoryId });
	await inventoryResult.save();
	const loc = await getLatLongByCity(address.city + "," + address.country);
	const warehouse = new WarehouseModel({
		title: "Office",
		id: warehouseId,
		warehouseInventory: inventoryId,
		organisationId: organisationId,
		location: loc,
		warehouseAddress: {
			firstLine: address.line1,
			secondLine: "",
			region: address.region,
			city: address.city,
			state: address.state,
			country: address.country,
			landmark: "",
			zipCode: address.pincode,
		},
		region: {
			regionName: region,
		},
		country: {
			countryId: "001",
			countryName: country,
		},
		status: "ACTIVE",
	});
	await warehouse.save();
}

async function createOrg(payload) {
	let {
		firstName,
		lastName,
		emailId,
		phoneNumber,
		organisationName,
		type,
		address,
		parentOrgName,
		parentOrgId,
	} = payload;

	// Validate duplicate email/phone
	if (emailId) emailId = emailId.toLowerCase().replace(" ", "");
	if (phoneNumber) {
		phoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
	}

	let matchQuery = {};
	if (emailId) matchQuery["emailId"] = emailId;
	if (phoneNumber) matchQuery["phoneNumber"] = phoneNumber;

	let employeeExists = await EmployeeModel.findOne(matchQuery);
	if (employeeExists) {
		return {
			inserted: false,
			message: `Employee "${employeeExists.emailId || employeeExists.phoneNumber
				}" already exists!`,
		};
	}

	// Validate duplicate Organization Name
	const organisationExists = await OrganisationModel.findOne({
		name: new RegExp("^" + organisationName + "$", "i"),
	});
	if (organisationExists) {
		return {
			inserted: false,
			message: `Organization "${organisationName}" already exists!`,
		};
	}

	// Create new Organization, Warehouse & Employee
	const empCounter = await CounterModel.findOneAndUpdate(
		{
			"counters.name": "employeeId",
		},
		{
			$inc: {
				"counters.$.value": 1,
			},
		},
		{ new: true },
	);
	const employeeId = empCounter.counters[4].format + empCounter.counters[4].value;

	const warehouseCounter = await CounterModel.findOneAndUpdate(
		{ "counters.name": "warehouseId" },
		{
			$inc: {
				"counters.$.value": 1,
			},
		},
		{ new: true },
	);
	const warehouseId = warehouseCounter.counters[3].format + warehouseCounter.counters[3].value;

	const orgCounter = await CounterModel.findOneAndUpdate(
		{ "counters.name": "orgId" },
		{
			$inc: {
				"counters.$.value": 1,
			},
		},
		{ new: true },
	);
	const organisationId = orgCounter.counters[2].format + orgCounter.counters[2].value;

	let parentOrg;
	if (!parentOrgId) {
		parentOrg = await OrganisationModel.findOne({
			name: new RegExp("^" + parentOrgName + "$", "i"),
		});
	}

	const country = address?.country ? address?.country : "Costa Rica";
	const region = address?.region ? address?.region : "Americas";
	const addr =
		address?.line1 + ", " + address?.city + ", " + address?.state + ", " + address?.pincode;

	const organisation = new OrganisationModel({
		primaryContactId: employeeId,
		name: organisationName,
		id: organisationId,
		type: type,
		status: "ACTIVE",
		isRegistered: true,
		postalAddress: addr,
		warehouses: [warehouseId],
		warehouseEmployees: [employeeId],
		region: region,
		country: country,
		configuration_id: "CONF000",
		parentOrgId: parentOrgId ? parentOrgId : parentOrg?.id,
	});
	await organisation.save();

	await createWarehouse(address, warehouseId, organisationId, region, country);

	const user = new EmployeeModel({
		firstName: firstName || emailId.split("@")[0],
		lastName: lastName || emailId.split("@")[0],
		emailId: emailId,
		phoneNumber: phoneNumber,
		organisationId: organisationId,
		id: employeeId,
		postalAddress: addr,
		accountStatus: "ACTIVE",
		warehouseId: warehouseId == "NA" ? [] : [warehouseId],
		role: "admin",
	});
	await user.save();

	const bc_data = {
		username: emailId ? emailId : phoneNumber,
		password: "",
		orgName: "org1MSP",
		role: "",
		email: emailId ? emailId : phoneNumber,
	};
	axios.post(`${hf_blockchain_url}/api/v1/register`, bc_data);

	const event_data = {
		eventID: cuid(),
		eventTime: new Date().toISOString(),
		actorWarehouseId: "null",
		transactionId: employeeId,
		eventType: {
			primary: "CREATE",
			description: "USER",
		},
		actor: {
			actorid: employeeId,
			actoruserid: employeeId,
		},
		stackholders: {
			ca: {
				id: "null",
				name: "null",
				address: "null",
			},
			actororg: {
				id: organisationId ? organisationId : "null",
				name: "null",
				address: "null",
			},
			secondorg: {
				id: "null",
				name: "null",
				address: "null",
			},
		},
		payload: {
			data: "CREATED ORG WITH EXCEL",
		},
	};
	await logEvent(event_data);
	return {
		inserted: true,
		message: "Success",
	};
}

function getOrgCondition(query) {
	let matchCondition = {};
	if (query.orgType && query.orgType != "") {
		matchCondition.type = query.orgType;
	}
	if (query.country && query.country != "") {
		matchCondition["country.countryName"] = query.country;
	}

	if (query.status && query.status != "") {
		matchCondition.status = query.status;
	} else {
		matchCondition.status = { $in: ["ACTIVE", "DEACTIVATED"] }
	}

	if (query.region && query.region != "") {
		matchCondition["region.name"] = query.region;
	}
	if (query.orgName && query.orgName != "") {
		matchCondition.name = { $regex: query.orgName ? query.orgName : "", $options: "i" }
	}
	if (query.creationFilter && query.creationFilter == "true") {
		let now = moment();
		let oneDayAgo = moment().subtract(1, "day");
		let oneMonthAgo = moment().subtract(1, "months");
		let threeMonthsAgo = moment().subtract(3, "months");
		let oneYearAgo = moment().subtract(1, "years");
		let oneWeek = moment().subtract(1, "weeks");
		let sixMonths = moment().subtract(6, "months");
		if (query.dateRange == "today") {
			matchCondition.createdAt = {
				$gte: new Date(oneDayAgo),
				$lte: new Date(now),
			};
		} else if (query.dateRange == "thisMonth") {
			matchCondition.createdAt = {
				$gte: new Date(oneMonthAgo),
				$lte: new Date(now),
			};
		} else if (query.dateRange == "threeMonths") {
			matchCondition.createdAt = {
				$gte: new Date(threeMonthsAgo),
				$lte: new Date(now),
			};
		} else if (query.dateRange == "thisYear") {
			matchCondition.createdAt = {
				$gte: new Date(oneYearAgo),
				$lte: new Date(now),
			};
		} else if (query.dateRange == "thisWeek") {
			matchCondition.createdAt = {
				$gte: new Date(oneWeek),
				$lte: new Date(now),
			};
		} else if (query.dateRange == "sixMonths") {
			matchCondition.createdAt = {
				$gte: new Date(sixMonths),
				$lte: new Date(now),
			};
		}
	}
	return matchCondition;
}

exports.getPendingOrgs = [
	auth,
	async (req, res) => {
		try {
			const pendingOrgs = await OrganisationModel.find({
				status: "NOTVERIFIED",
				isRegistered: true,
			}).sort({ createdAt: -1 });

			return apiResponse.successResponseWithData(req, res, "Organisation list", pendingOrgs);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.getOrgs = [
	auth,
	async (req, res) => {
		try {
			const users = await OrganisationModel.aggregate([
				{
					$match: getOrgCondition(req.query),
				},
				{
					$lookup: {
						from: "employees",
						let: { orgId: "$id" },
						pipeline: [
							{ $match: { $expr: { $eq: ["$$orgId", "$organisationId"] } } },
							{ $count: "total" },
						],
						as: "employeeCount",
					},
				},
				{ $unwind: { path: "$employeeCount", preserveNullAndEmptyArrays: true } },
				{
					$sort: {
						createdAt: -1,
					},
				},
				{ $setWindowFields: { output: { totalCount: { $count: {} } } } },
				{ $skip: parseInt(req.query.skip) || 0 },
				{ $limit: parseInt(req.query.limit) || 10 },
			]);
			for (var c = 0; c < users.length; c++) {
				if (EmployeeIdMap.has(users[c].primaryContactId)) {
					users[c].primaryContactId = EmployeeIdMap.get(users[c].primaryContactId);
				} else {
					const employeeEmail = await EmployeeModel.findOne({
						id: users[c].primaryContactId,
					}).select("emailId phoneNumber");
					if (employeeEmail?.emailId) {
						EmployeeIdMap.set(users[c].primaryContactId, employeeEmail.emailId);
						users[c].primaryContactId = employeeEmail.emailId;
					} else {
						EmployeeIdMap.set(users[c].primaryContactId, employeeEmail?.phoneNumber);
						users[c].primaryContactId = employeeEmail?.phoneNumber;
					}
				}
			}
			return apiResponse.successResponseWithData(req, res, "Organisation list", users);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.getOrgDetails = [
	auth,
	async (req, res) => {
		try {
			const orgId = req.query?.orgId;

			if (!orgId) {
				return apiResponse.validationErrorWithData(req, res, "Org Id not provided", {
					orgId: orgId,
				});
			}

			const organisation = await OrganisationModel.aggregate([
				{ $match: { id: orgId } },
				{
					$lookup: {
						from: "warehouses",
						let: { organisationId: "$id" },
						pipeline: [
							{
								$facet: {
									activeWarehouses: [
										{
											$match: {
												$expr: {
													$and: [
														{ $eq: ["$organisationId", "$$organisationId"] },
														{ $eq: ["$status", "ACTIVE"] },
													],
												},
											},
										},
										{ $count: "activeWarehouses" },
									],
									inactiveWarehouses: [
										{
											$match: {
												$expr: {
													$and: [
														{ $eq: ["$organisationId", "$$organisationId"] },
														{ $eq: ["$status", "DEACTIVATED"] },
													],
												},
											},
										},
										{ $count: "inactiveWarehouses" },
									],
								},
							},
							{ $unwind: { path: "$activeWarehouses", preserveNullAndEmptyArrays: true } },
							{ $unwind: { path: "$inactiveWarehouses", preserveNullAndEmptyArrays: true } },
							{
								$project: {
									activeWarehouseCount: "$activeWarehouses.activeWarehouses",
									inactiveWarehouseCount: "$inactiveWarehouses.inactiveWarehouses",
								},
							},
						],
						as: "warehouseCount",
					},
				},
				{ $unwind: "$warehouseCount" },
			]);
			if (!organisation?.length) {
				throw new Error("Organisation not found!");
			}

			return apiResponse.successResponseWithData(
				req,
				res,
				"Organisation details fetched!",
				organisation[0],
			);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.getWarehouseAndUsersById = [
	auth,
	async (req, res) => {
		try {
			const warehouseId = req.query?.warehouseId;

			if (!warehouseId) {
				return apiResponse.validationErrorWithData(req, res, "Warehouse Id not provided", {
					warehouseId: warehouseId,
				});
			}

			const warehouseDetails = await WarehouseModel.aggregate([
				{ $match: { id: warehouseId } },
				{
					$lookup: {
						from: "employees",
						let: { warehouseId: "$id" },
						pipeline: [
							{ $match: { $expr: { $and: [{ $in: ["$$warehouseId", "$warehouseId"] }] } } },
						],
						as: "employees",
					},
				},
			]);

			if (!warehouseDetails) {
				throw new Error("Warehouse not found!");
			}

			return apiResponse.successResponseWithData(
				req,
				res,
				"Warehouse details fetched!",
				warehouseDetails[0],
			);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.getWarehouseAndUsersById = [
	auth,
	async (req, res) => {
		try {
			const warehouseId = req.query?.warehouseId;

			if (!warehouseId) {
				return apiResponse.validationErrorWithData(req, res, "Warehouse Id not provided", {
					warehouseId: warehouseId,
				});
			}

			const warehouseDetails = await WarehouseModel.aggregate([
				{ $match: { id: warehouseId } },
				{
					$lookup: {
						from: "employees",
						let: { warehouseId: "$id" },
						pipeline: [
							{ $match: { $expr: { $and: [{ $in: ["$$warehouseId", "$warehouseId"] }] } } },
						],
						as: "employees",
					},
				},
			]);

			if (!warehouseDetails) {
				throw new Error("Warehouse not found!");
			}

			return apiResponse.successResponseWithData(
				req,
				res,
				"Warehouse details fetched!",
				warehouseDetails[0],
			);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.getOrgAnalytics = [
	auth,
	async (req, res) => {
		try {
			const analytics = await OrganisationModel.aggregate([
				{
					$facet: {
						total: [
							{ $match: { status: { $in: ["ACTIVE", "DEACTIVATED"] } } },
							{
								$group: {
									_id: null,
									organisations: {
										$addToSet: {
											organisationId: "$id",
											status: "$status",
										},
									},
									orgInitials: {
										$firstN: {
											input: "$name",
											n: 5,
										},
									},
								},
							},
							{
								$project: {
									count: {
										$cond: {
											if: { $isArray: "$organisations" },
											then: { $size: "$organisations" },
											else: "NA",
										},
									},
									orgInitials: 1,
								},
							},
						],
						active: [
							{ $match: { status: "ACTIVE" } },
							{
								$group: {
									_id: null,
									organisations: {
										$addToSet: {
											organisationId: "$id",
											status: "$status",
										},
									},
								},
							},
							{
								$project: {
									count: {
										$cond: {
											if: { $isArray: "$organisations" },
											then: { $size: "$organisations" },
											else: "NA",
										},
									},
								},
							},
						],
						inactive: [
							{ $match: { status: "DEACTIVATED" } },
							{
								$group: {
									_id: null,
									organisations: {
										$addToSet: {
											organisationId: "$id",
											status: "$status",
										},
									},
								},
							},
							{
								$project: {
									count: {
										$cond: {
											if: { $isArray: "$organisations" },
											then: { $size: "$organisations" },
											else: "NA",
										},
									},
								},
							},
						]
					},
				},
				{ $unwind: "$total" },
				{ $unwind: "$active" },
				{ $unwind: "$inactive" },
			]);
			const analyticsObject = {
				totalCount: analytics[0].total.count,
				activeCount: analytics[0].active.count,
				inactiveCount: analytics[0].inactive.count,
				orgInitials: analytics[0].total.orgInitials,
			};
			return apiResponse.successResponseWithData(req, res, "Organisation list", analyticsObject);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.updateOrg = [
	auth,
	async (req, res) => {
		try {
			const { id, status, type } = req.body;
			const org = await OrganisationModel.findOneAndUpdate(
				{
					id: id,
				},
				{
					$set: {
						status: status,
						type: type,
					},
				},
				{
					new: true,
				},
			);
			if (status === "REJECTED") {
				try {
					await OrganisationModel.findOneAndDelete({ id: id });
					await EmployeeModel.findOneAndDelete({
						id: org.primaryContactId,
					});
					await WarehouseModel.findOneAndDelete({
						id: org.warehouses[0],
					});
					return apiResponse.successResponseWithData(req, res, "Organisation REJECTED", org);
				} catch (err) {
					console.log(err);
					return apiResponse.errorResponse(req, res, err);
				}
			}
			if (status === "ACTIVE") {
				await WarehouseModel.findOneAndUpdate(
					{ id: org.warehouses[0] },
					{ $set: { status: "ACTIVE" } },
					{ new: true },
				);
				await EmployeeModel.findOneAndUpdate(
					{ id: org.primaryContactId },
					{
						$push: {
							warehouseId: org.warehouses[0],
						},
						$pull: {
							pendingWarehouseId: org.warehouses[0],
						},
					},
				);
			}
			if (status === "DEACTIVATED") {
				await WarehouseModel.updateMany(
					{ id: org.warehouses },
					{ $set: { status: "DEACTIVATED" } },
				);

				for (let i = 0; i < org.warehouses?.length; ++i) {
					const currWarehouse = org.warehouses[i];
					await EmployeeModel.updateMany(
						{ warehouseId: currWarehouse },
						{
							$push: { pendingWarehouseId: currWarehouse },
							$pull: { warehouseId: currWarehouse },
						},
					);
				}
			}
			await EmployeeModel.findOneAndUpdate(
				{ id: org.primaryContactId },
				{
					$set: {
						accountStatus: status,
						role: "admin",
					},
				},
			);
			return apiResponse.successResponseWithData(req, res, "Organisation updated", org);
		} catch (err) {
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.checkDuplicateOrgName = [
	async (req, res) => {
		try {
			const { organisationName } = req.query;
			const organisationExists = await OrganisationModel.findOne({
				name: new RegExp("^" + organisationName.trim() + "$", "i"),
				isRegistered: true,
			});

			if (organisationExists) {
				return apiResponse.successResponseWithData(req, res, "Organisation Exists!", true);
			} else {
				return apiResponse.successResponseWithData(req, res, "Organisation does not exist!", false);
			}
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err.message);
		}
	},
];

exports.addNewOrganisation = [
	auth,
	async (req, res) => {
		try {
			const {
				firstName,
				lastName,
				emailId,
				phoneNumber,
				organisationName,
				type,
				address,
			} = req.body;
			const organisationExists = await OrganisationModel.findOne({
				name: new RegExp("^" + organisationName + "$", "i"),
			});

			if (organisationExists) {
				return apiResponse.validationErrorWithData(
					res,
					"Organisation name already exists",
					organisationName,
				);
			}
			const country = req.body?.address?.country ? req.body.address?.country : "India";
			const region = req.body?.address?.region ? req.body.address?.region : "Asia";
			const addr =
				address?.line1 + ", " + address?.city + ", " + address?.state + ", " + address?.pincode;

			const empCounter = await CounterModel.findOneAndUpdate(
				{
					"counters.name": "employeeId",
				},
				{
					$inc: {
						"counters.$.value": 1,
					},
				},
				{ new: true },
			);
			const employeeId = empCounter.counters[4].format + empCounter.counters[4].value;

			const warehouseCounter = await CounterModel.findOneAndUpdate(
				{ "counters.name": "warehouseId" },
				{
					$inc: {
						"counters.$.value": 1,
					},
				},
				{ new: true },
			);
			const warehouseId = warehouseCounter.counters[3].format + warehouseCounter.counters[3].value;

			const orgCounter = await CounterModel.findOneAndUpdate(
				{ "counters.name": "orgId" },
				{
					$inc: {
						"counters.$.value": 1,
					},
				},
				{ new: true },
			);
			const organisationId = orgCounter.counters[2].format + orgCounter.counters[2].value;

			const organisation = new OrganisationModel({
				primaryContactId: employeeId,
				name: organisationName,
				id: organisationId,
				type: type,
				status: "ACTIVE",
				isRegistered: true,
				postalAddress: addr,
				warehouses: [warehouseId],
				warehouseEmployees: [employeeId],
				region: region,
				country: country,
				configuration_id: "CONF000",
				parentOrgId: req.user.organisationId,
			});
			await organisation.save();

			const invCounter = await CounterModel.findOneAndUpdate(
				{ "counters.name": "inventoryId" },
				{
					$inc: {
						"counters.$.value": 1,
					},
				},
				{
					new: true,
				},
			);
			const inventoryId = invCounter.counters[7].format + invCounter.counters[7].value;
			const inventoryResult = new InventoryModel({ id: inventoryId });
			await inventoryResult.save();
			const loc = await getLatLongByCity(address.city + "," + address.country);
			const warehouse = new WarehouseModel({
				title: "Office",
				id: warehouseId,
				warehouseInventory: inventoryId,
				organisationId: organisationId,
				location: loc,
				warehouseAddress: {
					firstLine: address.line1,
					secondLine: "",
					region: address.region,
					city: address.city,
					state: address.state,
					country: address.country,
					landmark: "",
					zipCode: address.pincode,
				},
				region: {
					regionName: region,
				},
				country: {
					countryId: "001",
					countryName: country,
				},
				status: "ACTIVE",
			});
			await warehouse.save();

			const formatedEmail = emailId?.toLowerCase().replace(" ", "") || null;
			const formatedPhone = phoneNumber?.startsWith("+") ? phoneNumber : `+${phoneNumber}` || null;
			const user = new EmployeeModel({
				firstName: firstName,
				lastName: lastName,
				emailId: formatedEmail,
				phoneNumber: formatedPhone,
				organisationId: organisationId,
				id: employeeId,
				postalAddress: addr,
				accountStatus: "ACTIVE",
				warehouseId: warehouseId == "NA" ? [] : [warehouseId],
				role: "admin",
			});
			await user.save();

			const bc_data = {
				username: emailId ? formatedEmail : formatedPhone,
				password: "",
				orgName: "org1MSP",
				role: "",
				email: emailId ? formatedEmail : formatedPhone,
			};
			await axios.post(`${hf_blockchain_url}/api/v1/register`, bc_data);

			const event_data = {
				eventID: cuid(),
				eventTime: new Date().toISOString(),
				actorWarehouseId: "null",
				transactionId: employeeId,
				eventType: {
					primary: "CREATE",
					description: "USER",
				},
				actor: {
					actorid: employeeId,
					actoruserid: employeeId,
				},
				stackholders: {
					ca: {
						id: "null",
						name: "null",
						address: "null",
					},
					actororg: {
						id: req.body.organisationId ? req.body.organisationId : "null",
						name: "null",
						address: "null",
					},
					secondorg: {
						id: "null",
						name: "null",
						address: "null",
					},
				},
				payload: {
					data: req.body,
				},
			};
			await logEvent(event_data, req);

			return apiResponse.successResponseWithData(
				req,
				res,
				"Organisation added successfully!",
				organisation,
			);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];

exports.addOrgsFromExcel = [
	auth,
	async (req, res) => {
		try {
			const dir = path.join(__dirname, "uploads");
			if (!fs.existsSync(dir)) fs.mkdirSync(dir);

			const workbook = XLSX.readFile(req.file.path);
			const sheetName = workbook.SheetNames[0];
			const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
				dateNF: "dd/mm/yyyy;@",
				cellDates: true,
				raw: false,
			});
			const parentOrgId = req.user.type === "DISTRIBUTORS" ? req.user.organisationId : null;
			const organisationMap = new Map();
			const employeeMap = new Map();
			const formattedData = [];
			let duplicateRecords = 0;

			for (const [index, user] of data.entries()) {
				const {
					"FIRST NAME": firstName,
					"LAST NAME": lastName,
					"EMAIL": email,
					"Email of organization": emailOfOrganization,
					"PHONE": phoneNumber,
					"ORG NAME": orgName,
					"PHARMACY": pharmacy,
					"ORG TYPE": orgType,
					"ORGANIZATION TYPE": organisationType,
					"PARENT ORG": parentOrgName,
					"CITY": city,
					"COUNTRY": country,
					"ADDRESS": line1,
					"Address": alternateAddress,
					"PINCODE": pincode,
					"POSTAL CODE": postalCode,
					"REGION": region,
					"DISTRICT": district,
					"STATE": state,
					"PROVINCE": province,
					"Province": alternateProvince
				} = user;

				const emailId = email || emailOfOrganization;
				const organisationName = orgName || pharmacy;
				const type = orgType || organisationType;
				const address = {
					city: city?.trim(),
					country: country?.trim(),
					line1: (line1 || alternateAddress)?.trim(),
					pincode: (pincode || postalCode || postalCode)?.trim(),
					region: (region || district)?.trim(),
					state: state?.trim(),
					province: (province || alternateProvince)?.trim()
				};

				const payload = {
					firstName,
					lastName,
					emailId,
					phoneNumber,
					organisationName,
					type,
					address,
					parentOrgName,
					parentOrgId
				};

				const employeeKey = email ? email.toLowerCase().replace(" ", "") : phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
				const organisationKey = organisationName ? organisationName.toLowerCase() : undefined;

				if (!organisationMap.has(organisationKey) && !employeeMap.has(employeeKey)) {
					formattedData[index] = payload;
					organisationMap.set(organisationKey, payload);
					employeeMap.set(employeeKey, payload);
				} else {
					duplicateRecords++;
				}
			}

			const results = await Promise.all(formattedData.map(createOrg));
			const insertedOrgs = results.filter((elem) => elem.inserted)?.length;

			const response = {
				insertedRecords: insertedOrgs,
				invalidRecords: results.length - insertedOrgs + duplicateRecords,
			};

			return apiResponse.successResponseWithData(req, res, "Success", response);
		} catch (err) {
			console.log(err);
			return apiResponse.errorResponse(req, res, err);
		}
	},
];
