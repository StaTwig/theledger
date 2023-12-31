import React from "react";
import ManufacturerHeader from "./manufacturerHeader/ManufacturerHeader.jsx";
import "./NetworkDashboard.scss";
import OtherLocations from "./otherLocations/OtherLocations";
import TopSeller from "./topSeller/TopSeller";

const NetworkDashboard = (props) => {
  const {
    manufacturer,
    oManufacturer,
    partnerLocation,
    setReportWarehouse,
    MylocationFilter,
    setMylocationFilter,
    user,
    setMobileDashboard,
    TopBestseller,
    setPartnerLocation,
    executeScroll,
    t,
  } = props;

  return (
    <div className='network-sidebar-container'>
      <div className='dashboard-card'>
        <ManufacturerHeader
          user={user}
          manufacturer={manufacturer}
          partnerLocation={partnerLocation}
          MylocationFilter={MylocationFilter}
          setMylocationFilter={setMylocationFilter}
          oManufacturer={oManufacturer}
          setMobileDashboard={setMobileDashboard}
          setPartnerLocation={setPartnerLocation}
          t={t}
        />
      </div>
      <div className='dashboard-card'>
        <TopSeller bestseller={TopBestseller} executeScroll={executeScroll} t={t} />
      </div>
      <div className='dashboard-card'>
        <OtherLocations
          setReportWarehouse={(param) => setReportWarehouse(param)}
          oManufacturer={oManufacturer}
          user={user}
          t={t}
        />
      </div>
    </div>
  );
};

export default NetworkDashboard;
