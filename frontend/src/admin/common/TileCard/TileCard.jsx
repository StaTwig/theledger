import React from "react";
import "./TileCard.css";

export default function TileCard({ layout, t, orgDetails, warehouseDetails }) {
  let active = 0;
  let inactive = 0;
  let total = 0;

  if (layout === "location") {
    active = orgDetails?.warehouseCount?.activeWarehouseCount || 0;
    inactive = orgDetails?.warehouseCount?.inactiveWarehouseCount || 0;
    total = active + inactive;
  } else {
    warehouseDetails?.employees?.forEach((employee) => {
      if (employee.accountStatus === "ACTIVE") ++active;
      else ++inactive;
      ++total;
    });
  }

  return (
    <>
      {layout === "location" && (
        <div className='admin-location-card-container'>
          <div className='admin-location-header'>
            <h1 className='vl-subheading f-500'>
              {t("total")} {t("location")}
            </h1>
            <div className='number-label'>{total}</div>
          </div>
          <div className='admin-location-body'>
            <div className='tile-grid'>
              <div className='tile-card'>
                <h1 className={`vl-heading f-700 vl-accept`}>{active}</h1>
                <p className={`vl-body f-500  vl-blue`}>
                  {t("active")} {t("location")}
                </p>
              </div>
              <div className='tile-card'>
                <h1 className={`vl-heading f-700 vl-reject`}>{inactive}</h1>
                <p className={`vl-body f-500 vl-blue`}>
                  {t("inactive")} {t("location")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {layout === "user" && (
        <div className='admin-location-card-container'>
          <div className='admin-location-header'>
            <h1 className='vl-subheading f-500'>
              {t("total")} {t("users")}
            </h1>
            <div className='number-label'>{total}</div>
          </div>
          <div className='admin-location-body'>
            <div className='tile-grid'>
              <div className='tile-card'>
                <h1 className={`vl-heading f-700 vl-accept`}>{active}</h1>
                <p className={`vl-body f-500  vl-blue`}>
                  {t("active")} {t("users")}
                </p>
              </div>
              <div className='tile-card'>
                <h1 className={`vl-heading f-700 vl-reject`}>{inactive}</h1>
                <p className={`vl-body f-500 vl-blue`}>
                  {t("inactive")} {t("users")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
