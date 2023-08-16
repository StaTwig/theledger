import React from "react";
import Avatar from "@mui/material/Avatar";
import "./AnalyticsCard.css";
import { useHistory } from "react-router";

export default function AnalyticsCard({
  t,
  layout,
  bgColor,
  icon,
  value,
  textColor,
  valueTitle,
  name,
  analytics,
  onClick
}) {
  const history = useHistory();

  const handleClick = () => {
    let route;
    switch (name) {
      case "users": {
        route = "/org/manage-users";
        break;
      }
      case "orgs": {
        route = "/statwig/manage-organization";
        break;
      }
      default: {
        route = "/statwig/manage-organization";
      }
    }
    history.push(route);
  };

  return (
    <>
      {layout === "type1" && (
        <div className="Analyticstype1-container">
          <div className="type1-header">
            <h1 className="vl-subheading f-700 vl-black">{t("no_of_org")}</h1>
          </div>
          <div className="type1-body">
            <div className="analytic-icon-space">
              {analytics?.orgInitials?.map((initial, index) => (
                <div
                  key={index}
                  className={`analytic-icon icon-position-${index + 1}`}
                >
                  <Avatar className={`color-variant-${index + 1}`}>
                    {initial?.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
              ))}
              <div className="analytic-icon icon-position-5 ">
                {analytics?.totalCount > 5 && (
                  <Avatar className="color-variant-5 icon-total-number">
                    +{analytics?.totalCount - 5}
                  </Avatar>
                )}
              </div>
            </div>
            <p className="vl-note f-400 vl-blue vl-link" onClick={handleClick}>
              {t("view_org")}
            </p>
          </div>
        </div>
      )}
      {layout === "type2" && (
        <div className="Analyticstype1-container">
          <div className="type1-header">
            <h1 className="vl-subheading f-700 vl-black"> {t("no_of_user")}</h1>
          </div>
          <div className="type1-body">
            <div className="analytic-icon-space">
              {analytics?.userInitials?.map((initial, index) => (
                <div
                  key={index}
                  className={`analytic-icon icon-position-${index + 1}`}
                >
                  <Avatar className={`color-variant-${index + 1}`}>
                    {initial?.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
              ))}
              <div className="analytic-icon icon-position-5 ">
                {analytics?.totalCount > 5 && (
                  <Avatar className="color-variant-5 icon-total-number">
                    +{analytics?.totalCount - 5}
                  </Avatar>
                )}
              </div>
            </div>
            <p className="vl-note f-400 vl-blue vl-link" onClick={handleClick}>
              {t("view_user")}
            </p>
          </div>
        </div>
      )}

      {layout === "type3" && (
        <div className="Analyticstype3-container">
          <div className="type3-header">
            <div className={`type3-icon-space ${bgColor}`}>
              <i className={`fa-solid ${icon} ${textColor}`}></i>
            </div>
            <p className="vl-small f-400 vl-grey-xs vl-link">6 months</p>
          </div>
          <div className="type3-body">
            <div className="type3-values">
              <h1 className={`vl-heading f-700 ${textColor}`}>{value}</h1>
              <p className={`vl-body f-500 ${textColor}`}>{valueTitle}</p>
            </div>
          </div>
        </div>
      )}

      {layout === "type4" && (
        <div className="Analyticstype3-container" onClick={onClick}>
          <div className="type4-body vl-flex-xl">
            <div className={`type3-icon-space ${bgColor}`}>
              <i className={`fa-solid ${icon} ${textColor}`}></i>
            </div>
            <div className="type3-values">
              <h1 className={`vl-heading f-700 ${textColor}`}>{value}</h1>
              <p className={`vl-body f-500 ${textColor}`}>{valueTitle}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
