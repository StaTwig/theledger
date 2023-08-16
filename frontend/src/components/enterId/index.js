/* eslint-disable */

import React, { useEffect, useState } from "react";
import "./style.scss";
import "./status.scss";
import { Formik } from "formik";
import update from "../../assets/icons/Update_Status.png";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import {
  getShipmentIds,
  getViewShipment,
  fetchairwayBillNumber,
} from "../../actions/shipmentActions";
import { t } from "i18next";

const EnterId = (props) => {
  const [billno, setbillno] = useState(null);
  const [shipmentArray, setShipmentArray] = useState([]);
  const [transitNumberArray, settransitNumberArray] = useState([]);
  const [shipdisabled, setshipdisabled] = useState(true);

  useEffect(() => {
    async function getShipmentArray() {
      let arr = await getShipmentIds();
      setShipmentArray(arr.data);
    }
    async function fetchairwayBill() {
      let temp_arr = await fetchairwayBillNumber();
      let newArr = temp_arr.data || []
      let newArr1 = newArr.filter(each => {
        if (each.airWayBillNo) {
          return each
        }
      })
      settransitNumberArray(newArr1);
    }
    getShipmentArray();
    fetchairwayBill();
  }, []);

  //For Transit Number
  const defaultProps1 = {
    options: transitNumberArray,
    getOptionLabel: (option) => option.airWayBillNo,
  };
  const flatProps1 = {
    options: transitNumberArray.map((option) => option.airWayBillNo),
  };

  //for shipment id
  const defaultProps = {
    options: shipmentArray,
    getOptionLabel: (option) => option.id,
  };
  const flatProps = {
    options: shipmentArray.map((option) => option.id),
  };
  const [shipmentId, setShipmentId] = useState(null);
  const [shipmentId2, setShipmentId2] = useState(null);
  const [enableSearch, setenableSearch] = useState(false);
  const [errorShipment, seterrorShipment] = useState(false);
  const [errorShipment1, seterrorShipment1] = useState(false);
  const [value, setValue] = React.useState();
  const [value1, setValue1] = React.useState();
  const [inputValue, setInputValue] = React.useState("");
  const [inputValue1, setInputValue1] = React.useState("");

  useEffect(() => {
    if (shipmentId) {
      getViewShipment(shipmentId).then((result) => {
        const val = result.data.status;
        if (val == "RECEIVED") {
          setshipdisabled(true);
          seterrorShipment(true);
        } else {
          setshipdisabled(false);
          seterrorShipment(false);
        }
      });
    }
  }, [shipmentId]);

  const billNoCheck = (bno) => {
    let val = transitNumberArray.filter((e) => e.airWayBillNo == bno);
    setShipmentId2(val[0]?.id);
    if (val[0]?.status == "RECEIVED") {
      setshipdisabled(true);
      seterrorShipment1(true);
    } else {
      setshipdisabled(false);
      seterrorShipment1(false);
    }
  };

  const handleUpdateStatus = async () => {
    let result = await getViewShipment(shipmentId);
    if (result.data?.status === "RECEIVED") {
      setshipdisabled(true);
      seterrorShipment(true);
    } else {
      if (shipmentId) {
        if (shipmentArray.filter((e) => e.id === shipmentId).length > 0) {
          props.history.push(`/updateStatus/${shipmentId}/false`);
        }
      } else {
        props.history.push(`/updateStatus/${shipmentId2}/false`);
      }
    }
  };

  return (
    <>
      <div className='update-status-layout'>
        <div className='status-page-header'>
          <h1 className='vl-heading-bdr' style={{ paddingBottom: "10px" }}>
            {t("update_shipment")}
          </h1>
        </div>
        <Formik
          enableReinitialize={true}
          initialValues={{
            shipmentId: shipmentId,
            billno: billno,
          }}
          validate={(values) => {
            const errors = {};

            if (!values.shipmentId) {
              errors.shipmentId = t("Required");
            }
            if (!values.billno) {
              errors.billno = t("Required");
            }
            if (!values.updateStatusLocation) {
              errors.updateStatusLocation = t("Required");
            }
            if (!values.comments) {
              errors.comments = t("Required");
            }
            if (!values.alerttrue) {
              errors.alerttrue = t("Required");
            }
            return errors;
          }}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(false);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            setFieldValue,
            dirty,
          }) => (
            <form onSubmit={handleSubmit} className='status-update-main'>
              <div className='update-form-container'>
                <div className='ship-form-space'>
                  <div className='shipment-search-form'>
                    <div className='label-header'>
                      <i className='fa-solid fa-address-card'></i>
                      <p className='mi-body-md f-500 mi-reset grey'>
                        {t("search_shipment_id")}
                      </p>
                    </div>

                    <div className='search-area'>
                      <Autocomplete
                        {...defaultProps}
                        id='auto-complete'
                        value={value}
                        onChange={(event, newValue) => {
                          setValue(newValue);
                        }}
                        inputValue={inputValue}
                        onInputChange={(event, newInputValue) => {
                          setShipmentId(newInputValue);
                          setInputValue(newInputValue);
                          newInputValue
                            ? setshipdisabled(false)
                            : (setshipdisabled(true), seterrorShipment(false));
                        }}
                        autoComplete
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name='shipmentId'
                            margin='normal'
                            variant='outlined'
                            placeholder={t("enter_shipment_id")}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className={`error-space ${errorShipment && "visible"}`}>
                    <p className='mi-body-xs f-400 mi-reset'>
                      {t("update_msg")}
                    </p>
                  </div>
                </div>

                <div className='shipment-or'>
                  <p className='mi-body-xl f-700 mi-reset'>{t("or")}</p>
                </div>
                <div className='ship-form-space'>
                  <div className='shipment-search-form'>
                    <div className='label-header'>
                      <i className='fa-solid fa-address-card'></i>
                      <p className='mi-body-md f-500 mi-reset grey'>
                        {t("search_transit_id")}
                      </p>
                    </div>

                    <div className='search-area'>
                      <Autocomplete
                        {...defaultProps1}
                        id='billNo'
                        value={value1}
                        onChange={(event, newValue) => {
                          setValue1(newValue);
                        }}
                        inputValue={inputValue1}
                        onInputChange={(event, newInputValue) => {
                          setbillno(newInputValue);
                          setInputValue1(newInputValue);
                          billNoCheck(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name='billNo'
                            margin='normal'
                            variant='outlined'
                            placeholder={t("enter_transit_id")}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className={`error-space ${errorShipment1 && "visible"}`}>
                    <p className='mi-body-xs f-400 mi-reset'>
                      {t("update_msg")}
                    </p>
                  </div>
                </div>
              </div>
              <div className='update-btn-space'>
                <div className='btn-status-group'>
                  <button
                    type='button'
                    className='mi-btn mi-btn-md mi-btn-blue mr-2'
                    onClick={() => props.history.push(props.user.type === "Third Party Logistics" ? "/enterid" : "/shipments")}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    disabled={shipdisabled}
                    className='mi-btn mi-btn-md mi-btn-orange'
                    onClick={handleUpdateStatus}
                  >
                    <img
                      src={update}
                      width='20'
                      height='17'
                      className='mr-2 mb-1'
                    />
                    <span>{t("update_shipment")}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </>
  );
};
export default EnterId;
