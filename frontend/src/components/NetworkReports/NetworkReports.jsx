import React, { useState, useEffect } from "react";
import { getNetworkPageAnalytics } from "../../actions/networkActions";
import "./NetworkReports.css";
import ReportAnalytics from "./ReportAnalytics/ReportAnalytics";
import BestsellerTable from "./Reports/Bestseller/BestsellerTable";
import ExpiredTable from "./Reports/Expired/ExpiredTable";
import InstocksTable from "./Reports/Instocks/InstocksTable";
import NearexpireTable from "./Reports/Nearexpire/NearexpireTable";
import OutofstocksTable from "./Reports/Outofstocks/OutofstocksTable";
import ReportSearch from "./ReportSearch/ReportSearch";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";

function TabList({ Tab, setTab }) {
  const { t } = useTranslation();
  return (
    <div className='Tablist_container'>
      <div
        className={`Tab_Link ${Tab === "out_stock" && "active"}`}
        onClick={() => setTab("out_stock")}
      >
        <p className='vl-subheading'>{t("out_of_stock")}</p>
      </div>
      <div
        className={`Tab_Link ${Tab === "in_stock" && "active"}`}
        onClick={() => setTab("in_stock")}
      >
        <p className='vl-subheading'>{t("in_stock")}</p>
      </div>
      <div
        className={`Tab_Link ${Tab === "near_expire" && "active"}`}
        onClick={() => setTab("near_expire")}
      >
        <p className='vl-subheading'>{t("near_expiration")}</p>
      </div>
      <div
        className={`Tab_Link ${Tab === "expired" && "active"}`}
        onClick={() => setTab("expired")}
      >
        <p className='vl-subheading'>{t("expired")}</p>
      </div>
      <div
        className={`Tab_Link ${Tab === "best_seller" && "active"}`}
        onClick={() => setTab("best_seller")}
      >
        <p className='vl-subheading'>{t("best_seller")}</p>
      </div>
    </div>
  );
}

export default function NetworkReports() {
  const history = useHistory();
  const { t } = useTranslation();

  const [locationParams, setLocationParams] = useState({
    region: "",
    country: "",
    state: "",
    city: "",
  });
  const [Tab, setTab] = useState("out_stock");
  const [analytics, setAnalytics] = useState({
    outStock: 0,
    inStock: 0,
    bestSellers: 0,
  });

  const getNetworkAnalytics = async () => {
    const result = await getNetworkPageAnalytics(locationParams);
    if (result?.analytics) {
      setAnalytics((prevState) => ({
        ...prevState,
        outStock: result?.analytics?.outStock,
        inStock: result?.analytics?.inStock,
        bestSellers: result?.analytics?.bestSeller,
      }));
    }
  };

  const updateSearchParams = (data) => {
    setLocationParams((prevState) => ({
      ...prevState,
      region: data.region,
      country: data.country,
      state: data.state,
      city: data.city,
    }));
  };

  useEffect(() => {
    getNetworkAnalytics();
  }, [locationParams]);

  return (
    <section className='NetworkReports_container'>
      {/* <div style={{height: "5vh", width: "100%", position: "fixed", display: "flex", background: "lightGray", zIndex: 2000}}>
				<Button
					onClick={() => history.push("/network")}
					style={{ fontSize: "14px", width: "18%", color: "teal", borderRadius: "10%" }}
				>
					{t('switch_to_location_view')}
				</Button>
			</div> */}

      <div className='network_page_inner_header'>
        <h1
          style={{ paddingBottom: "10px" }}
          className='vl-heading-bdr black f-700 mi-reset'
        >
          {t("network")}
        </h1>

        <button
          className='mi-btn mi-btn-md mi-btn-secondary'
          onClick={() => history.push("/network")}
        >
          {t("switch_to_location_view")}
        </button>
      </div>
      <div className='header_null_space'></div>

      <div className='NetworkReports_Search_Header'>
        <ReportSearch updateSearchParams={updateSearchParams} />
      </div>
      <main className={`Result_space ${locationParams && "show"}`}>
        <div className='NetworkReports_Breadcrumps_links'>
          {locationParams?.country && (
            <>
              <p className='vl-subheading f-500'>{locationParams.country}</p>
              <i className='fa-solid fa-chevron-right'></i>
            </>
          )}
          {locationParams?.state && (
            <>
              <p className='vl-subheading f-500'>{locationParams.state}</p>
              <i className='fa-solid fa-chevron-right'></i>
            </>
          )}
          {locationParams?.city && (
            <>
              <p className='vl-subheading f-500'>{locationParams.city}</p>
            </>
          )}
        </div>
        <div className='NetworkReports_Analytics_container'>
          <ReportAnalytics
            variant={1}
            title='out_of_stock'
            value={analytics.outStock}
          />
          <ReportAnalytics
            variant={2}
            title='in_stock'
            value={analytics.inStock}
          />
          <ReportAnalytics
            variant={3}
            title='best_seller'
            value={analytics.bestSellers}
          />
        </div>
        <div className='NetworkReports_Table_Wrapper'>
          <TabList Tab={Tab} setTab={setTab} />
          {Tab === "out_stock" && (
            <OutofstocksTable locationParams={locationParams} />
          )}
          {Tab === "in_stock" && (
            <InstocksTable locationParams={locationParams} />
          )}
          {Tab === "near_expire" && (
            <NearexpireTable locationParams={locationParams} />
          )}
          {Tab === "expired" && (
            <ExpiredTable locationParams={locationParams} />
          )}
          {Tab === "best_seller" && (
            <BestsellerTable locationParams={locationParams} />
          )}
        </div>
      </main>
    </section>
  );
}
