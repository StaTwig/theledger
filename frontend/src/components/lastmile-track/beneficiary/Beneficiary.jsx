import React from "react";
import { useState } from "react";
import "./Beneficiary.css";
import AddImage from "../../../assets/files/designs/add.jpg";
import { useEffect } from "react";
import NewDose from "./NewDose";
import {
  getVaccinationDetailsByVial,
  deleteVaccinationIndividual,
  completeVaccinationVial,
} from "../../../actions/lastMileActions";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FailPopUp from "../../../shared/PopUp/failedPopUp";
import Modal from "../../../shared/modal";
import { formatDate } from "../../../utils/dateHelper";

function ResultCard({ doseDetails, variant, update, deleteDose }) {
  const { t } = useTranslation();
  return (
    <div className={`Result-single-card result-variant-${variant}`}>
      <div className="result-stats">
        <h1 className="vl-heading f-700 vl-black">
          {t("age")}:{" "}
          {doseDetails.age === 0 ? doseDetails.ageMonths : doseDetails.age}
          <span className="vl-note f-400">
            {" "}
            {doseDetails.ageMonths ? "months" : "years"}
          </span>
        </h1>
        <h2 className="vl-subheading f-500 vl-black">
          {t("gender")} : {t(doseDetails.gender.toLowerCase()).toUpperCase()}
        </h2>
      </div>
      <div className="edit_delete_btn">
        <button
          className="card_btn btn_delete"
          onClick={() => deleteDose(doseDetails.id)}
        >
          <span>
            <i className="fa-solid fa-trash-can"></i>
          </span>
          Delete
        </button>
        <button
          className="card_btn btn_edit"
          onClick={() =>
            update(
              doseDetails.gender,
              doseDetails.age,
              doseDetails.ageMonths,
              doseDetails.id
            )
          }
        >
          <span>
            <i className="fa-solid fa-pencil"></i>
          </span>
          Edit
        </button>
      </div>
    </div>
  );
}

export default function Beneficiary(props) {
  const {
    batchDetails,
    vialId,
    setVialId,
    saveVaccination,
    saveCompleteVaccination,
    setRewardModal,
    setModalProps,
    setOpen,
    count,
    setcount,
  } = props;
  const { t } = useTranslation();
  const [LayoutType, setLayoutType] = useState(1);
  const [doses, setDoses] = useState([]);
  const [defaultValues, setDefaultValues] = useState({});
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const userLocation = useSelector((store) => store.userLocation);

  useEffect(() => {
    (async () => {
      if (LayoutType === 1 && vialId) {
        const result = await getVaccinationDetailsByVial(vialId);
        if (result?.data?.success) {
          if (result?.data.data.isComplete) {
            setLayoutType(2);
          } else {
            setDoses(result.data.data[0].doses);
          }
        } else {
          console.log("Error in fetching dose list - ", result.data.message);
        }
      }
    })();
  }, [LayoutType, vialId]);

  const newVaccination = async (result) => {
    if (!vialId) {
      setVialId(result.vaccineVialId);
    }
    setLayoutType(1);
  };

  const updateVaccination = (gender, age, ageMonths, doseId) => {
    setDefaultValues({
      gender,
      age,
      ageMonths,
      doseId,
      update: true,
    });
    setLayoutType(2);
  };

  const deleteVaccination = async (doseId) => {
    setDoses(doses.filter((dose) => dose.id !== doseId));
    await deleteVaccinationIndividual(doseId);
  };

  const completeVaccination = async () => {
    await completeVaccinationVial({ vaccineVialId: vialId });
    saveCompleteVaccination();
  };

  return (
    <div className="Beneficiary--container">
      <div className="Beneficiary--inner-wrapper">
        <div className="Beneficiary--header">
          <h1 className="vl-subtitle f-700 vl-black">
            {t("register_vaccination_details")}
          </h1>
          <button
            className="vl-btn vl-btn-sm vl-btn-primary"
            onClick={() => {
              if (doses.length < 10) {
                setLayoutType(2);
              } else {
                console.log("Vial exhausted!");
                setErrorMessage("Vial exhausted!");
                setErrorModal(true);
              }
            }}
          >
            <span>
              <i className="fa-solid fa-plus"></i>
            </span>{" "}
            {t("add_beneficiary_details")}
          </button>
        </div>
        <div className="Beneficiary--product">
          <div className="Beneficiary-product-card">
            <div className="Product-field-grid">
              <div className="field-header">
                <i className="fa-solid fa-vial-circle-check"></i>
                <p className="vl-body f-500 vl-blue">{t("product_name")} :</p>
              </div>
              <p className="vl-body f-500 vl-blue">
                {batchDetails.product.name}
              </p>
            </div>
            <div className="Product-field-grid">
              <div className="field-header">
                <i className="fa-solid fa-building"></i>
                <p className="vl-body f-500 vl-blue">
                  {t("manufacturer_name")} :
                </p>
              </div>
              <p className="vl-body f-500 vl-blue">
                {batchDetails.product.manufacturer}
              </p>
            </div>
            <div className="batch-number">
              <p className="vl-note batch-number-label f-500">
                {t("batchNumber")} : {batchDetails?.batchNumber}
              </p>
            </div>
            <div className="Product-field-grid">
              <div className="field-header">
                <p className="vl-body f-500 vl-blue">{t("exp_date")} :</p>
              </div>
              <p className="vl-body f-500 vl-blue">
                {formatDate(batchDetails.atom.attributeSet?.expDate)}
              </p>
            </div>
          </div>
        </div>
        <div className="Beneficiary--body">
          {LayoutType === 1 ? (
            doses.length === 0 ? (
              <section className="Beneficiary--Empty-wrapper">
                <div className="Beneficiary--Image-space">
                  <img src={AddImage} alt="ScanImage" />
                </div>
                <h1 className="vl-note f-500 vl-black">
                  {t("vaccinated_list_empty_click_add")}
                </h1>
              </section>
            ) : (
              <section className="Beneficiary--Result-wrapper">
                <div className="Beneficiary--Result-inner-wrapper">
                  <div className="Result-header">
                    <div className="Result-title-space">
                      <h1 className="vl-subheading f-700 vl-grey-md">
                        {t("vaccinated_overview")}
                      </h1>
                      <p className="vl-body card-number-label f-700">
                        {doses?.length ? doses.length : 0}
                      </p>
                    </div>
                    <div className="complete_btn_groups">
                      <button
                        className="vl-btn vl-btn-sm vl-btn-alert"
                        onClick={saveVaccination}
                      >
                        {t("save_continue")}
                      </button>
                      <button
                        className="vl-btn vl-btn-sm vl-btn-primary"
                        onClick={completeVaccination}
                      >
                        {t("complete")}
                      </button>
                    </div>
                  </div>
                  <div className="Result-body">
                    {doses.map((dose, index) => (
                      <ResultCard
                        key={index}
                        variant={index}
                        doseDetails={dose}
                        update={updateVaccination}
                        deleteDose={deleteVaccination}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )
          ) : null}

          {LayoutType === 2 && (
            <NewDose
              defaultValues={defaultValues}
              setDefaultValues={setDefaultValues}
              vaccineVialId={vialId}
              warehouseId={
                userLocation?.id ? userLocation.id : props.user.warehouseId[0]
              }
              productId={batchDetails.product.id}
              batchNumber={batchDetails?.batchNumber}
              atomId={batchDetails?.atom?.id}
              newVaccination={newVaccination}
              setLayoutType={setLayoutType}
              setOpen={setOpen}
              setcount={setcount}
              count={count}
            />
          )}
        </div>
      </div>
      {errorModal && (
        <Modal close={() => setErrorModal(false)} size="modal-sm">
          <FailPopUp
            message={errorMessage}
            onHide={() => setErrorModal(false)}
            t={t}
          />
        </Modal>
      )}
    </div>
  );
}
