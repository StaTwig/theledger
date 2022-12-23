import axios from "axios";
import { config } from "../config";

export const fetchBatch = async (data) => {
	try {
		const result = await axios.post(`${config().fetchBatchDetails}`, data);
		return result;
	} catch (err) {
		return err.response;
	}
};

export const fetchBatchByIdWithoutCondition = async (data) => {
	try {
		const result = await axios.post(`${config().fetchBatchByIdWithoutCondition}`, data);
		return result;
	} catch (err) {
		return err.response;
	}
};

export const getAllVaccinationDetails = async (data) => {
	try {
		const result = await axios.post(`${config().getAllVaccinationDetails}`, data);
		return result;
	} catch (err) {
		throw err;
	}
};

export const vaccinateIndividual = async (data) => {
	try {
		const result = await axios.post(`${config().vaccinateIndividual}`, data);
		return result;
	} catch (err) {
		throw err;
	}
};

export const updateVaccinationIndividual = async (data) => {
	try {
		const result = await axios.put(`${config().updateVaccinationIndividual}`, data);
		return result;
	} catch (err) {
		throw err;
	}
}

export const deleteVaccinationIndividual = async (data) => {
	try {
		const result = await axios.delete(`${config().deleteVaccinationIndividual}`, { params: { doseId: data } });
		return result;
	} catch (err) {
		throw err;
	}
}

export const completeVaccinationVial = async (data) => {
	try {
		const result = await axios.post(`${config().completeVaccinationVial}`, data);
		return result;
	} catch (err) {
		throw err;
	}
};

export const fetchAnalytics = async () => {
	try {
		const result = await axios.get(`${config().getVaccineAnalytics}`);
		return result;
	} catch (err) {
		throw err;
	}
};

export const getVaccinationDetailsByVial = async (vaccineVialId) => {
	try {
		const result = await axios.get(
			`${config().getVaccinationDetailsByVial}?vaccineVialId=${vaccineVialId}`,
		);
		return result;
	} catch (err) {
		throw err;
	}
};

export const getVialsUtilised = async (data) => {
	try {
		const result = await axios.post(`${config().getVialsUtilised}`, data);
		return result;
	} catch (err) {
		throw err;
	}
};

export const getAnalyticsWithFilters = async (data) => {
	try {
		const result = await axios.post(`${config().getAnalyticsWithFilters}`, data);
		return result;
	} catch(err) {
		return err.response;
	}
}

export const getVaccinationsList = async () => {
	try {
		const result = await axios.get(`${config().getVaccinationsList}`);
		return result;
	} catch (err) {
		throw err;
	}
};

export const getCitiesAndOrgsForFilters = async () => {
	try {
		const result = await axios.get(`${config().getCitiesAndOrgsForFilters}`);
		return result;
	} catch (err) {
		throw err;
	}
};

export const exportVaccinationList = async (data) => {
	try {
		const result = await axios.post(`${config().exportVaccinationList}`, data, {
			responseType: "blob",
		});
		return result;
	} catch (err) {
		throw err;
	}
};

export const exportVialsUtilised = async (data) => {
	try {
		const result = await axios.post(`${config().exportVialsUtilised}`, data, {
			responseType: "blob",
		});
		return result;
	} catch (err) {
		throw err;
	}
};
