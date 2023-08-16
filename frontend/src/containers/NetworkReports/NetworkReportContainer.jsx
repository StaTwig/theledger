import React from "react";
import NetworkReports from "../../components/NetworkReports/NetworkReports";
import Header from "../../shared/header";
import SideBar from "../../shared/sidebarMenu";
import { useTranslation } from "react-i18next";

export default function NetworkReportContainer(props) {
  const { t } = useTranslation();
  return (
    <div className="container-fluid p-0">
      <Header {...props} t={t} />
      <div className="d-flex">
        <SideBar {...props} t={t} />
        <div className="Network-content">
          <NetworkReports />
        </div>
      </div>
    </div>
  );
}
