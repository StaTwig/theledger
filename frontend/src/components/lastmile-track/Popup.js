import React from "react";
import Checked from "../../assets/icons/checked.svg";

const Popup = (props) => {
  const { t } = props;

  console.log(props.points);
  return (
    <>
      <div className="inventorypopup">
        <div className="d-flex  flex-column align-items-center">
          <img
            src={Checked}
            width="60"
            height="60"
            className="mb-3"
            alt="Checked"
          />
          <div className="alert">
            <b> {t("success")}!</b>
          </div>
          <div className="data mb-2">Unit Completed Successfully</div>
  
         
          {props.points && (
            <div className="points_popup_body_ts">
              You've been rewarded with <span>{props.points}</span> points
            </div>
          )}

          <button className="btn-primary btn" onClick={props.onHide}>
            {t("ok")}
          </button>
        </div>
      </div>
    </>
  );
};

export default Popup;
