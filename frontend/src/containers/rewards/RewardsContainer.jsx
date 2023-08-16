import React from "react";
import Header from "../../shared/header";
import Sidebar from "../../shared/sidebarMenu";
import { useTranslation } from "react-i18next";
import Rewards from "../../components/rewards/Rewards";

const RewardsContainer = (props) => {
  const { t } = useTranslation();
  return (
    <div className="container-fluid p-0">
      <Header {...props} t={t} />
      <div className="d-flex">
        <Sidebar {...props} t={t} />
        <div className="Network-content">
          <Rewards t={t} />
        </div>
      </div>
    </div>
  );
};

export default RewardsContainer;
