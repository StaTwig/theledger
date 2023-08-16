import React, { useState, useRef } from "react";
import "./Networking.scss";
import NetworkMap from "./networkMap/NetworkMap";
import Reports from "./reports/Reports";
import NetworkDashboard from "./networkDashboard/NetworkDashboard";
import { useHistory } from "react-router";

export default function Networking(props) {
  const {
    user,
    manufacturer,
    reportWarehouse,
    oManufacturer,
    setReportWarehouse,
    MainTab,
    setMainTab,
    t,
  } = props;

  const history = useHistory();

  const [MobileDashboard, setMobileDashboard] = useState(false);

  const scrollToRef = (ref) => window.scrollTo(0, ref.current.offsetTop);
  const myRef = useRef(null);
  const executeScroll = () => scrollToRef(myRef);
  return (
    <div className='network-main-layout'>
      {/* {user?.type === "GoverningBody" && (
				<div classname="network-header">
					<Button
						onClick={() => history.push("/admin-network-reports")}
						style={{ fontSize: "14px", width: "18%", color: "teal", borderRadius: "10%" }}
					>
						{t('switch_to_country_view')}
					</Button>
				</div>
			)} */}

      {user?.type === "GoverningBody" && (
        <div className='network_page_inner_header'>
          <h1
            style={{ paddingBottom: "10px" }}
            className='vl-heading-bdr black f-700 mi-reset'
          >
            {t("network")}
          </h1>

          <button
            className='mi-btn mi-btn-md mi-btn-secondary'
            onClick={() => history.push("/admin-network-reports")}
          >
            {t("switch_to_country_view")}
          </button>
        </div>
      )}

      <div className='header_null_space'></div>

      <div
        className='network-grid-container'
        style={{ pointerEvents: props.demoLogin ? "none" : "auto" }}
      >
        <div className={`network-dashboard ${MobileDashboard && "active"}`}>
          <NetworkDashboard
            reportWarehouse={reportWarehouse}
            {...props}
            manufacturer={manufacturer}
            setReportWarehouse={(param) => setReportWarehouse(param)}
            oManufacturer={oManufacturer}
            setMobileDashboard={setMobileDashboard}
            executeScroll={executeScroll}
            t={t}
          />
        </div>
        <div className='network-workspace'>
          <div className='network-map-holder'>
            <div className='map-filter-button'>
              <div className={`dashboard-mobile`}>
                <div
                  className='dashboard-mobile-btn'
                  onClick={() => setMobileDashboard(true)}
                >
                  <i className='fa-solid fa-map-location-dot'></i>
                </div>
              </div>
              {/* <div className="location-filter-btn filter-hide-sm">
                <Checkbox {...label} />
                <p className="mi-body-md f-500  mi-reset">My Location</p>
              </div>
              <div className="location-filter-btn filter-hide-sm">
                <Checkbox {...label} />
                <p className="mi-body-md f-500  mi-reset">Partner Location</p>
              </div> */}
            </div>
            <NetworkMap {...props} />
          </div>
          <div className='network-report-holders'>
            <Reports
              {...props}
              reportWarehouse={reportWarehouse}
              MainTab={MainTab}
              setMainTab={setMainTab}
              myRef={myRef}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
