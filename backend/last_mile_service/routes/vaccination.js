const express = require("express");
const router = express.Router();
const VaccinationController = require("../controllers/VaccinationController");

router.post("/fetchBatchById", VaccinationController.fetchBatchById);
router.post("/fetchBatchByIdWithoutCondition", VaccinationController.fetchBatchByIdWithoutCondition);
router.post("/vaccinateIndividual", VaccinationController.vaccinateIndividual);
router.post("/vaccinateMultiple", VaccinationController.vaccinateMultiple);
router.post("/getAllVaccinationDetails", VaccinationController.getAllVaccinationDetails);
router.post("/getAnalyticsWithFilters", VaccinationController.getAnalyticsWithFilters);
router.post("/getVialsUtilised", VaccinationController.getVialsUtilised);
router.get("/getVaccinationDetailsByVial", VaccinationController.getVaccinationDetailsByVial);
router.get("/getAnalytics", VaccinationController.getAnalytics);
router.post("/getVaccinationsList", VaccinationController.getVaccinationsList);
router.get("/getOrgsForFilters", VaccinationController.lastMileOrgFilter);
router.post("/exportVaccinationList", VaccinationController.exportVaccinationList);
router.post("/exportVialsUtilised", VaccinationController.exportVialsUtilised);
router.put("/updateDose", VaccinationController.updateDose);
router.delete("/deleteDose", VaccinationController.deleteDose);
router.post("/completeVial", VaccinationController.completeVial);
router.get("/addDateStringToDoses", VaccinationController.addDateStringToDoses)
module.exports = router;
