import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import OrganizationList from "./OrganizationList";
const SearchOrganization = ({ user, nManufacturer, setReportWarehouse, t }) => {
  const [refetchWarehouses, toggleRefetchWarehouses] = useState(false);
  // const [nManufacturer, setNManufacturer] = useState([{filters: []}]);
  // useEffect(() =>{
  //  const getManFilters = async(param) => {
  //   const filterWarehouse = await getManufacturerFilterOptions(param);
  //   setNManufacturer(filterWarehouse.data);
  //   console.log(filterWarehouse.data)
  // }
  // getManFilters("org");
  // }, [])

  useEffect(() => {
    toggleRefetchWarehouses(!refetchWarehouses)
  }, [nManufacturer]);

  return (
    <div className='search-location-results'>
      <p className='mi-body-md f-400 grey mi-reset'>{t("organization_list")}</p>
      <div className='search-result-container'>
        {nManufacturer?.map((org, index) => {
          return (
            <OrganizationList
              setReportWarehouse={setReportWarehouse}
              refetchWarehouses={refetchWarehouses}
              orgName={org?.orgName}
              orgId={org?.orgId}
              user={user}
              key={index}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SearchOrganization;
