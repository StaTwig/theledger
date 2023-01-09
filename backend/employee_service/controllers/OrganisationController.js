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
const XLSX = require("xlsx");

const EmployeeIdMap = new Map();
async function createWarehouse(address, warehouseId, organisationId, region, country) {
	console.log(warehouseId)
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
async function createOrg({
	firstName,
	lastName,
	emailId,
	phoneNumber,
	organisationName,
	type,
	address,
	parentOrgName,
	parentOrgId
}) {
	let warehouseId;
	const country = address?.country ? address?.country : "Costa Rica";
	const region = address?.region ? address?.region : "Americas";
	const organisationExists = await OrganisationModel.findOne({
		name: new RegExp("^" + organisationName?.trim() + "$", "i"),
	});
	let parentOrg;
	if (!parentOrgId)
		parentOrg = await OrganisationModel.findOne({
			name: new RegExp("^" + parentOrgName?.trim() + "$", "i"),
		});
	if (organisationExists) {
		const warehouseExists = await WarehouseModel.findOne({ postalAddress: address.line1 })
		warehouseId = warehouseExists?.id;
		if (warehouseExists) {
			console.log(warehouseExists)
			return `Organisation ${organisationName?.trim()} and Warehouse ${address.line1} already exists`;
		}
		const warehouseCounter = await CounterModel.findOneAndUpdate(
			{ "counters.name": "warehouseId" },
			{
				$inc: {
					"counters.$.value": 1,
				},
			},
			{ new: true },
		);
		warehouseId = warehouseCounter.counters[3].format + warehouseCounter.counters[3].value;
		await createWarehouse(address, warehouseId, organisationExists.id, region, country);
		return `Organization ${organisationName?.trim()} already exists!, warehouse ${address.line1} created`;
	}


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
		parentOrgId: parentOrgId ? parentOrgId : parentOrg?.id,
	});
	await organisation.save();
	const warehouseCounter = await CounterModel.findOneAndUpdate(
		{ "counters.name": "warehouseId" },
		{
			$inc: {
				"counters.$.value": 1,
			},
		},
		{ new: true },
	);
	warehouseId = warehouseCounter.counters[3].format + warehouseCounter.counters[3].value;
	await createWarehouse(address, warehouseId, organisationId, region, country);

	if (emailId) emailId = emailId.toLowerCase().replace(" ", "");
	if (phoneNumber) {
		phoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
	}
	if (!organisationExists) {
		const user = new EmployeeModel({
			firstName: firstName || emailId.split('@')[0],
			lastName: lastName || emailId.split('@')[0],
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
	}
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
	return "success";
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
	}
	if (query.region && query.region != "") {
		matchCondition["region.name"] = query.region;
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
			});

			return apiResponse.successResponseWithData(req, res, "Organisation list", pendingOrgs);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(req, res, err);
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
				{ $unwind: "$employeeCount" },
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
					if (employeeEmail.emailId != null) {
						EmployeeIdMap.set(users[c].primaryContactId, employeeEmail.emailId);
						users[c].primaryContactId = employeeEmail.emailId;
					} else {
						EmployeeIdMap.set(users[c].primaryContactId, employeeEmail.phoneNumber);
						users[c].primaryContactId = employeeEmail.phoneNumber;
					}
				}
			}
			return apiResponse.successResponseWithData(req, res, "Organisation list", users);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(req, res, err);
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
														{ $ne: ["$status", "ACTIVE"] },
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
			return apiResponse.ErrorResponse(req, res, err);
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
			return apiResponse.ErrorResponse(req, res, err);
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
			return apiResponse.ErrorResponse(req, res, err);
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
							{ $match: {} },
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
					},
				},
				{ $unwind: "$total" },
				{ $unwind: "$active" },
			]);
			const analyticsObject = {
				totalCount: analytics[0].total.count,
				activeCount: analytics[0].active.count,
				inactiveCount: analytics[0].total.count - analytics[0].active.count,
				orgInitials: analytics[0].total.orgInitials,
			};
			return apiResponse.successResponseWithData(req, res, "Organisation list", analyticsObject);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(req, res, err);
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
					return apiResponse.ErrorResponse(req, res, err);
				}
			}
			if (status === "ACTIVE") {
				const warehouse = await WarehouseModel.findOneAndUpdate(
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
			return apiResponse.ErrorResponse(req, res, err);
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
			return apiResponse.ErrorResponse(req, res, err.message);
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
			await logEvent(event_data);

			return apiResponse.successResponseWithData(
				req,
				res,
				"Organisation added successfully!",
				organisation,
			);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(req, res, err);
		}
	},
];

exports.addOrgsFromExcel = [
	auth,
	async (req, res) => {
		try {
			const dir = `uploads`;
			if (!fs.existsSync(dir)) fs.mkdirSync(dir);
			const workbook = XLSX.readFile(req.file.path);
			const sheet_name_list = workbook.SheetNames;
			const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
				dateNF: "dd/mm/yyyy;@",
				cellDates: true,
				raw: false,
			});
			const parentOrgId = req.user.type === "DISTRIBUTORS" ? req.user.organisationId : null;
			const formatedData = new Array();
			for (const [index, user] of data.entries()) {
				const firstName = user["FIRST NAME"];
				const lastName = user["LAST NAME"];
				const emailId = user["EMAIL"] || user["Email of organization"];
				const phoneNumber = user["PHONE"];
				const organisationName = user["ORG NAME"] || user["Pharmacy"];
				const type = user["ORG TYPE"];
				const parentOrgName = user["PARENT ORG"];
				const address = {
					city: user["CITY"]?.trim(),
					country: user["COUNTRY"]?.trim(),
					line1: (user["ADDRESS"]?.trim() || user["Address"]?.trim()),
					pincode: user["PINCODE"]?.trim() || user["POSTAL CODE"]?.trim() || user["Postal Code"]?.trim(),
					region: user["REGION"]?.trim() || user["DISTRICT"]?.trim(),
					state: user["STATE"]?.trim(),
					province: user["PROVINCE"]?.trim() || user["Province"]?.trim()
				}

				formatedData[index] = {
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
				console.log(formatedData[index])
			}
			const promises = [];
			for (const orgData of formatedData) {
				promises.push(createOrg(orgData));
			}
			await Promise.all(promises);
			return apiResponse.successResponseWithData(req, res, "success", formatedData);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(req, res, err);
		}
	},
];
