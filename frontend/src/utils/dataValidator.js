const { isValidPhoneNumber } = require("react-phone-number-input");
const { verifyEmailAndPhoneNo } = require("../actions/userActions");
const { validateUniqueOrgName } = require("../admin/actions/organisationActions");

export const validateEmailPattern = (emailId) => {
	try {
		const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (emailId) {
			if (emailId.match(emailRegex) === null) {
				throw new Error("Email ID is invalid!");
			}
		} else {
			throw new Error("Please provide an Email ID!");
		}
	} catch (err) {
		throw err;
	}
};

export const validatePhonePattern = (phoneNumber) => {
	try {
		if (phoneNumber) {
			if (isValidPhoneNumber(phoneNumber) === false) {
				throw new Error("Phone Number is invalid!");
			}
		} else {
			throw new Error("Please provide a Phone Number!");
		}
	} catch (err) {
		throw err;
	}
};

export const checkDuplicateEmail = async (emailId) => {
	try {
		if (emailId) {
			validateEmailPattern(emailId);

			const result = await verifyEmailAndPhoneNo(`emailId=${emailId}`);
			if (result.status === 200) {
				return true;
			} else {
				throw new Error("Duplicate Email ID!");
			}
		} else {
			throw new Error("Please provide an Email ID!");
		}
	} catch (err) {
		throw err;
	}
};

export const checkDuplicatePhone = async (phoneNumber) => {
	try {
		if (phoneNumber) {
			validatePhonePattern(phoneNumber);

			const result = await verifyEmailAndPhoneNo(`phoneNumber=${phoneNumber}`);
			if (result.status === 200) {
				return true;
			} else {
				throw new Error("Duplicate Phone Number!");
			}
		} else {
			throw new Error("Please provide a Phone Number!");
		}
	} catch (err) {
		throw err;
	}
};

export const checkDuplicateOrgName = async (orgName) => {
	try {
		if (orgName) {
			const result = await validateUniqueOrgName(orgName);
			if (result.status === 200) {
				if (result.data.data) {
					throw new Error("Duplicate Organisation Name!");
				} else {
					return true;
				}
			} else {
				console.log(result.data.message);
				throw new Error("Request Failed!");
			}
		} else {
			throw new Error("Please provide an Organisation Name!");
		}
	} catch (err) {
		throw err;
	}
};
