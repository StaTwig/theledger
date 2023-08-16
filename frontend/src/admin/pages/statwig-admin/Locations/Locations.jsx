import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import LocationCard from "../../../common/LocationCard/LocationCard";
import TileCard from "../../../common/TileCard/TileCard";
import StatwigHeader from "../../../shared/Header/StatwigHeader/StatwigHeader";
import LocationMap from "./LocationMap/Map";
import "./Locations.css";
import LocationTable from "./LocationTable/LocationTable";
import {
  fetchWarehousesByOrgId,
  getOrgDetails,
} from "../../../actions/organisationActions";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import No_location from "../../../../assets/files/designs/empty_location.jpg";

export default function Locations(props) {
  const history = useHistory();
  const { t } = useTranslation();
  if (props.user.type !== "CENTRAL_AUTHORITY") {
    history.push("/overview");
  }
  const [Map, setMap] = useState(false);
  const [flag, setFlag] = useState(false);
  const [orgDetails, setOrgDetails] = useState();
  const [addresses, setAddresses] = useState();
  const params = useParams();
  const orgId = params.orgId;

  const refresh = () => {
    setFlag(!flag);
  };

  useEffect(() => {
    async function getWarehousesForOrg() {
      try {
        const result = await fetchWarehousesByOrgId(orgId);
        if (result.status === 200) {
          setAddresses(result.data.data);
        } else {
          console.log("Warehouses request failed!");
        }
      } catch (err) {
        console.log("Error - ", err);
      }
    }
    getWarehousesForOrg();

    async function getOrganisationDetails() {
      try {
        const result = await getOrgDetails(orgId);
        if (result.status === 200) {
          setOrgDetails(result.data.data);
        } else {
          console.log("Org details request failed!");
        }
      } catch (err) {
        console.log("Error - ", err);
      }
    }
    getOrganisationDetails();
  }, [orgId, flag]);
  return (
    <>
      <StatwigHeader />
      <section className='admin-page-layout'>
        <div className='admin-container'>
          <div className='admin-location-container admin-section-space'>
            <div className='admin-locations-left'>
              <div className='previous-link-tabs'>
                <Link
                  to='/statwig/manage-organization'
                  className='link-card vl-link'
                >
                  <i className='fa-solid fa-arrow-left'></i>
                  <p className='vl-subheading f-500'>
                    {t("manage")} {t("location")}
                  </p>
                </Link>
                <div className='breadcumb-links vl-flex-sm'>
                  <Link to='/statwig/manage-organization' className='vl-link'>
                    <p className='vl-small f-500 vl-grey-sm'>
                      {t("manage")} {t("organisation")}
                    </p>
                  </Link>
                  <p className='vl-note f-500 vl-grey-sm'>/</p>
                  <Link to='/statwig/view-locations' className='vl-link'>
                    <p className='vl-small f-500 vl-grey-sm'>{t("location")}</p>
                  </Link>
                </div>
              </div>
              <div className='location-details-grid'>
                <LocationCard t={t} layout='location' orgDetails={orgDetails} />
                <TileCard t={t} layout='location' orgDetails={orgDetails} />
              </div>

              <div className='map-view-button' onClick={() => setMap(!Map)}>
                <button className='vl-btn vl-btn-md vl-btn-secondary'>
                  {Map ? (
                    <>
                      <span>
                        <i className='fa-solid fa-table'></i>
                      </span>
                      {t("view_table")}
                    </>
                  ) : (
                    <>
                      <span>
                        <i className='fa-solid fa-map-location-dot'></i>
                      </span>
                      {t("view_map")}
                    </>
                  )}
                </button>
              </div>
            </div>
            {addresses && (
              <>
                {addresses?.length > 0 ? (
                  <>
                    {Map ? (
                      <div className='Locationmap-container'>
                        <LocationMap warehouses={addresses} />
                      </div>
                    ) : (
                      <LocationTable
                        t={t}
                        refresh={refresh}
                        Locations={addresses}
                        orgDetails={orgDetails}
                      />
                    )}
                  </>
                ) : (
                  <div className='no_location_illustration'>
                    <div className='illustration_image_wrapper'>
                      <img src={No_location} alt='no_location' />
                    </div>
                    <p className='mi-subheading f-500'>
                      Oops! You didn't add any locations, Please complete your
                      location details
                    </p>
                    <Link
                      to='/statwig/manage-organization'
                      className='no_location_btn'
                    >
                      <button className='vl-btn vl-btn-alt vl-btn-primary'>
                        {t("add_loc")}
                      </button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
