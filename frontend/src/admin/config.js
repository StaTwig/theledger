export const TEST_SERVER_URL = "https://test.admin.vaccineledger.com";
export const PROD_SERVER_URL = "//api.vaccineledger.com:9001";
export const ABINBEV_PROD_SERVER_URL = "//admin.abinbev.statledger.io:9001";
export const ABINBEV_TEST_SERVER_URL =
  "//test.admin.abinbev.statledger.io:9001";
export const LOCAL_SERVER_URL_USER = "//localhost:3001";
export const LOCAL_SERVER_URL_ADDRESS = "//localhost:3001";
export const LOCAL_SERVER_URL_AFFILIATION = "//localhost:3002";
export const LOCAL_SERVER_URL_EMPLOYEE = "//localhost:3003";
export const LOCAL_SERVER_URL_RBAC = "//localhost:3004";
export const LOCAL_SERVER_URL_CONFIG = "//localhost:3005";
export const TEST_SERVER_URL_VL = 'https://test.vaccineledger.com';

export function config() {
  const confs = {
    local: {
      sendOtpUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/auth/sendOtp`,
      verifyOtpUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/auth/verifyOtp`,
      getApprovalsUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/getApprovals`,
      getPermissionsUrl: `${LOCAL_SERVER_URL_RBAC}/api/rbac_service/getPermissions`,
      getWareHousesUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/fetchWarehouses`,
      verifyOrgUserUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/acceptApproval`,
      updateOrgUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/updateOrg`,
      rejectOrgUserUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/rejectApproval`,
      activateOrgUserUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/activateUser`,
      deactivateOrgUserUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/deactivateUser`,
      getOrgUsersUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/auth/getOrgUsers`,
      getOrgUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/getOrgs`,
      getOrgActiveUsers: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/auth/getOrgActiveUsers`,
      addOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/addUser`,
      recentRequestsSentUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/fetchSentRequests`,
      userInfoUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/auth/userInfo`,
      pendingAffiliatedReqUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/fetchPendingRequests`,
      affiliatedOrgUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/fetchAffiliates`,
      getAllOrgUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/getAllOrg`,
      unaffiliateUserUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/unAffiliate`,
      unaffiliateOrgUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/unAffiliateOrg`,
      acceptAffiliateUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/acceptAffiliate`,
      rejectAffiliateUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/rejectAffiliate`,
      addAffiliateUrl: `${LOCAL_SERVER_URL_AFFILIATION}/api/affliation_service/addAffiliate`,
      addOrgAddressrUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/addWarehouse`,
      getLocationApprovalUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/getLocationApprovals`,
      updateOrgAddressrUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/updateWarehouse`,
      addAddressesFromExcelUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/addAddressesFromExcel`,
      modifyLocationUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/address_service/modifyLocation`,
      getOrgTypesUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/configuration_service/getOrganizationsByType?id=CONF000`,

      getOrgTypeiIdsUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/configuration_service/getOrganizationsByType?id=`,
      updateOrgTypesUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/configuration_service/updateOrganizationsByType`,
      addNewOrgTypesUrl: `${LOCAL_SERVER_URL_ADDRESS}/api/configuration_service/addNewOrgType`,
      imgDomainUrl: `${TEST_SERVER_URL}`,
      getCountryDataUrl: `${TEST_SERVER_URL}/api/address_service/getCountries`,
      getRegionDataUrl: `${TEST_SERVER_URL}/api/address_service/getRegions`,
      fetchAllRoles:`${TEST_SERVER_URL}/api/rbac_service/getRoles`,
      fetchPermissionsByRole :`${TEST_SERVER_URL}/api/rbac_service/getPermissions`,
      updatePermissions: `${TEST_SERVER_URL}/api/rbac_service/updatePermissions`,

      //The 4 endpoints below are written in theledger repo, Modify the server address after merging the VLadmin portal to test.vl.com
      fetchAllRegions:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=all`,
      fetchCountriesByRegion:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=`,
      fetchStateByCountry:`${TEST_SERVER_URL_VL}/productmanagement/api/location?country_id=`,
      fetchCitiesByState:`${TEST_SERVER_URL_VL}/productmanagement/api/location?state_id=`,
    },
    test: {
      sendOtpUrl: `${TEST_SERVER_URL}/api/employee_service/auth/sendOtp`,
      verifyOtpUrl: `${TEST_SERVER_URL}/api/employee_service/auth/verifyOtp`,
      getApprovalsUrl: `${LOCAL_SERVER_URL_EMPLOYEE}/api/employee_service/getApprovals`,
      getPermissionsUrl: `${TEST_SERVER_URL}/api/rbac_service/getPermissions`,
      getWareHousesUrl: `${TEST_SERVER_URL}/api/address_service/fetchWarehouses`,
      updateOrgUrl: `${TEST_SERVER_URL}/api/employee_service/updateOrg`,
      verifyOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/acceptApproval`,
      rejectOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/rejectApproval`,
      activateOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/activateUser`,
      deactivateOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/deactivateUser`,
      getOrgUsersUrl: `${TEST_SERVER_URL}/api/employee_service/auth/getOrgUsers`,
      getOrgUrl: `${TEST_SERVER_URL}/api/employee_service/getOrgs`,
      getOrgActiveUsers: `${TEST_SERVER_URL}/api/employee_service/auth/getOrgActiveUsers`,
      addOrgUserUrl: `${TEST_SERVER_URL}/api/employee_service/addUser`,
      recentRequestsSentUrl: `${TEST_SERVER_URL}/api/affliation_service/fetchSentRequests`,
      userInfoUrl: `${TEST_SERVER_URL}/api/employee_service/auth/userInfo`,
      pendingAffiliatedReqUrl: `${TEST_SERVER_URL}/api/affliation_service/fetchPendingRequests`,
      affiliatedOrgUrl: `${TEST_SERVER_URL}/api/affliation_service/fetchAffiliates`,
      getAllOrgUrl: `${TEST_SERVER_URL}/api/affliation_service/getAllOrg`,
      unaffiliateUserUrl: `${TEST_SERVER_URL}/api/affliation_service/unAffiliate`,
      unaffiliateOrgUrl: `${TEST_SERVER_URL}/api/affliation_service/unAffiliateOrg`,
      acceptAffiliateUrl: `${TEST_SERVER_URL}/api/affliation_service/acceptAffiliate`,
      rejectAffiliateUrl: `${TEST_SERVER_URL}/api/affliation_service/rejectAffiliate`,
      addOrgAddressrUrl: `${TEST_SERVER_URL}/api/address_service/addWarehouse`,
      addAffiliateUrl: `${TEST_SERVER_URL}/api/affliation_service/addAffiliate`,
      updateOrgAddressrUrl: `${TEST_SERVER_URL}/api/address_service/updateWarehouse`,
      addAddressesFromExcelUrl: `${TEST_SERVER_URL}/api/address_service/addAddressesFromExcel`,
      getOrgTypesUrl: `${TEST_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=CONF000`,
      getOrgTypeiIdsUrl: `${TEST_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=`,
      updateOrgTypesUrl: `${TEST_SERVER_URL}/api/configuration_service/updateOrganizationsByType`,
      addNewOrgTypesUrl: `${TEST_SERVER_URL}/api/configuration_service/addNewOrgType`,
      getLocationApprovalUrl: `${TEST_SERVER_URL}/api/address_service/getLocationApprovals`,
      modifyLocationUrl: `${TEST_SERVER_URL}/api/address_service/modifyLocation`,
      imgDomainUrl: `${TEST_SERVER_URL}`,
      getCountryDataUrl: `${TEST_SERVER_URL}/api/address_service/getCountries`,
      getRegionDataUrl: `${TEST_SERVER_URL}/api/address_service/getRegions`,
      fetchAllRoles:`${TEST_SERVER_URL}/api/rbac_service/getRoles`,
      fetchPermissionsByRole :`${TEST_SERVER_URL}/api/rbac_service/getPermissions`,
      updatePermissions: `${TEST_SERVER_URL}/api/rbac_service/updatePermissions`,

      //The 4 endpoints below are written in theledger repo, Modify the server address after merging the VLadmin portal to test.vl.com
      fetchAllRegions:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=all`,
      fetchCountriesByRegion:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=`,
      fetchStateByCountry:`${TEST_SERVER_URL_VL}/productmanagement/api/location?country_id=`,
      fetchCitiesByState:`${TEST_SERVER_URL_VL}/productmanagement/api/location?state_id=`,
    },
    prod: {
      sendOtpUrl: `${PROD_SERVER_URL}/api/employee_service/auth/sendOtp`,
      verifyOtpUrl: `${PROD_SERVER_URL}/api/employee_service/auth/verifyOtp`,
      getApprovalsUrl: `${PROD_SERVER_URL}/api/employee_service/getApprovals`,
      getPermissionsUrl: `${PROD_SERVER_URL}/api/rbac_service/getPermissions`,
      getWareHousesUrl: `${PROD_SERVER_URL}/api/address_service/fetchWarehouses`,
      updateOrgUrl: `${PROD_SERVER_URL}/api/employee_service/updateOrg`,
      verifyOrgUserUrl: `${PROD_SERVER_URL}/api/employee_service/acceptApproval`,
      rejectOrgUserUrl: `${PROD_SERVER_URL}/api/employee_service/rejectApproval`,
      activateOrgUserUrl: `${PROD_SERVER_URL}/api/employee_service/activateUser`,
      deactivateOrgUserUrl: `${PROD_SERVER_URL}/api/employee_service/deactivateUser`,
      getOrgUsersUrl: `${PROD_SERVER_URL}/api/employee_service/auth/getOrgUsers`,
      getOrgUrl: `${PROD_SERVER_URL}/api/employee_service/getOrgs`,
      getOrgActiveUsers: `${PROD_SERVER_URL}/api/employee_service/auth/getOrgActiveUsers`,
      addOrgUserUrl: `${PROD_SERVER_URL}/api/employee_service/addUser`,
      recentRequestsSentUrl: `${PROD_SERVER_URL}/api/affliation_service/fetchSentRequests`,
      userInfoUrl: `${PROD_SERVER_URL}/api/employee_service/auth/userInfo`,
      pendingAffiliatedReqUrl: `${PROD_SERVER_URL}/api/affliation_service/fetchPendingRequests`,
      affiliatedOrgUrl: `${PROD_SERVER_URL}/api/affliation_service/fetchAffiliates`,
      getAllOrgUrl: `${PROD_SERVER_URL}/api/affliation_service/getAllOrg`,
      unaffiliateUserUrl: `${PROD_SERVER_URL}/api/affliation_service/unAffiliate`,
      unaffiliateOrgUrl: `${PROD_SERVER_URL}/api/affliation_service/unAffiliateOrg`,
      acceptAffiliateUrl: `${PROD_SERVER_URL}/api/affliation_service/acceptAffiliate`,
      rejectAffiliateUrl: `${PROD_SERVER_URL}/api/affliation_service/rejectAffiliate`,
      addAffiliateUrl: `${PROD_SERVER_URL}/api/affliation_service/addAffiliate`,
      addOrgAddressrUrl: `${PROD_SERVER_URL}/api/address_service/addWarehouse`,
      updateOrgAddressrUrl: `${PROD_SERVER_URL}/api/address_service/updateWarehouse`,
      addAddressesFromExcelUrl: `${PROD_SERVER_URL}/api/address_service/addAddressesFromExcel`,
      getOrgTypesUrl: `${PROD_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=CONF000`,
      getOrgTypeiIdsUrl: `${PROD_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=`,
      updateOrgTypesUrl: `${PROD_SERVER_URL}/api/configuration_service/updateOrganizationsByType`,
      addNewOrgTypesUrl: `${PROD_SERVER_URL}/api/configuration_service/addNewOrgType`,
      getLocationApprovalUrl: `${PROD_SERVER_URL}/api/address_service/getLocationApprovals`,
      modifyLocationUrl: `${PROD_SERVER_URL}/api/address_service/modifyLocation`,
      imgDomainUrl: `${PROD_SERVER_URL}`,
      getCountryDataUrl: `${TEST_SERVER_URL}/api/address_service/getCountries`,
      getRegionDataUrl: `${TEST_SERVER_URL}/api/address_service/getRegions`,
      fetchAllRoles:`${TEST_SERVER_URL}/api/rbac_service/getRoles`,
      fetchPermissionsByRole :`${TEST_SERVER_URL}/api/rbac_service/getPermissions`,
      updatePermissions: `${TEST_SERVER_URL}/api/rbac_service/updatePermissions`,

      //The 4 endpoints below are written in theledger repo, Modify the server address after merging the VLadmin portal to test.vl.com
      fetchAllRegions:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=all`,
      fetchCountriesByRegion:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=`,
      fetchStateByCountry:`${TEST_SERVER_URL_VL}/productmanagement/api/location?country_id=`,
      fetchCitiesByState:`${TEST_SERVER_URL_VL}/productmanagement/api/location?state_id=`,
    },
    abinbevtest: {
      sendOtpUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/auth/sendOtp`,
      verifyOtpUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/auth/verifyOtp`,
      getApprovalsUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/getApprovals`,
      getPermissionsUrl: `${ABINBEV_TEST_SERVER_URL}/api/rbac_service/getPermissions`,
      getWareHousesUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/fetchWarehouses`,
      updateOrgUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/updateOrg`,
      verifyOrgUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/acceptApproval`,
      rejectOrgUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/rejectApproval`,
      activateOrgUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/activateUser`,
      deactivateOrgUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/deactivateUser`,
      getOrgUsersUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/auth/getOrgUsers`,
      getOrgUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/getOrgs`,
      getOrgActiveUsers: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/auth/getOrgActiveUsers`,
      addOrgUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/addUser`,
      recentRequestsSentUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/fetchSentRequests`,
      userInfoUrl: `${ABINBEV_TEST_SERVER_URL}/api/employee_service/auth/userInfo`,
      pendingAffiliatedReqUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/fetchPendingRequests`,
      affiliatedOrgUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/fetchAffiliates`,
      getAllOrgUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/getAllOrg`,
      unaffiliateUserUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/unAffiliate`,
      unaffiliateOrgUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/unAffiliateOrg`,
      acceptAffiliateUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/acceptAffiliate`,
      rejectAffiliateUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/rejectAffiliate`,
      addOrgAddressrUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/addWarehouse`,
      addAffiliateUrl: `${ABINBEV_TEST_SERVER_URL}/api/affliation_service/addAffiliate`,
      updateOrgAddressrUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/updateWarehouse`,
      addAddressesFromExcelUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/addAddressesFromExcel`,
      getOrgTypesUrl: `${ABINBEV_TEST_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=CONF000`,
      getOrgTypeiIdsUrl: `${ABINBEV_TEST_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=`,
      updateOrgTypesUrl: `${ABINBEV_TEST_SERVER_URL}/api/configuration_service/updateOrganizationsByType`,
      addNewOrgTypesUrl: `${ABINBEV_TEST_SERVER_URL}/api/configuration_service/addNewOrgType`,
      getLocationApprovalUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/getLocationApprovals`,
      modifyLocationUrl: `${ABINBEV_TEST_SERVER_URL}/api/address_service/modifyLocation`,
      imgDomainUrl: `${ABINBEV_TEST_SERVER_URL}`,
      getCountryDataUrl: `${TEST_SERVER_URL}/api/address_service/getCountries`,
      getRegionDataUrl: `${TEST_SERVER_URL}/api/address_service/getRegions`,
      //The 4 endpoints below are written in theledger repo, Modify the server address after merging the VLadmin portal to test.vl.com
      fetchAllRegions:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=all`,
      fetchCountriesByRegion:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=`,
      fetchStateByCountry:`${TEST_SERVER_URL_VL}/productmanagement/api/location?country_id=`,
      fetchCitiesByState:`${TEST_SERVER_URL_VL}/productmanagement/api/location?state_id=`,
    },
    abinbevprod: {
      sendOtpUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/auth/sendOtp`,
      verifyOtpUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/auth/verifyOtp`,
      getApprovalsUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/getApprovals`,
      getPermissionsUrl: `${ABINBEV_PROD_SERVER_URL}/api/rbac_service/getPermissions`,
      getWareHousesUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/fetchWarehouses`,
      updateOrgUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/updateOrg`,
      verifyOrgUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/acceptApproval`,
      rejectOrgUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/rejectApproval`,
      activateOrgUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/activateUser`,
      deactivateOrgUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/deactivateUser`,
      getOrgUsersUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/auth/getOrgUsers`,
      getOrgUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/getOrgs`,
      getOrgActiveUsers: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/auth/getOrgActiveUsers`,
      addOrgUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/addUser`,
      recentRequestsSentUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/fetchSentRequests`,
      userInfoUrl: `${ABINBEV_PROD_SERVER_URL}/api/employee_service/auth/userInfo`,
      pendingAffiliatedReqUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/fetchPendingRequests`,
      affiliatedOrgUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/fetchAffiliates`,
      getAllOrgUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/getAllOrg`,
      unaffiliateUserUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/unAffiliate`,
      unaffiliateOrgUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/unAffiliateOrg`,
      acceptAffiliateUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/acceptAffiliate`,
      rejectAffiliateUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/rejectAffiliate`,
      addOrgAddressrUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/addWarehouse`,
      addAffiliateUrl: `${ABINBEV_PROD_SERVER_URL}/api/affliation_service/addAffiliate`,
      updateOrgAddressrUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/updateWarehouse`,
      addAddressesFromExcelUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/addAddressesFromExcel`,
      getOrgTypesUrl: `${ABINBEV_PROD_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=CONF000`,
      getOrgTypeiIdsUrl: `${ABINBEV_PROD_SERVER_URL}/api/configuration_service/getOrganizationsByType?id=`,
      updateOrgTypesUrl: `${ABINBEV_PROD_SERVER_URL}/api/configuration_service/updateOrganizationsByType`,
      addNewOrgTypesUrl: `${ABINBEV_PROD_SERVER_URL}/api/configuration_service/addNewOrgType`,
      getLocationApprovalUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/getLocationApprovals`,
      modifyLocationUrl: `${ABINBEV_PROD_SERVER_URL}/api/address_service/modifyLocation`,
      imgDomainUrl: `${ABINBEV_PROD_SERVER_URL}`,
      getCountryDataUrl: `${TEST_SERVER_URL}/api/address_service/getCountries`,
      getRegionDataUrl: `${TEST_SERVER_URL}/api/address_service/getRegions`,
     
      //The 4 endpoints below are written in theledger repo, Modify the server address after merging the VLadmin portal to test.vl.com
      fetchAllRegions:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=all`,
      fetchCountriesByRegion:`${TEST_SERVER_URL_VL}/productmanagement/api/location?region=`,
      fetchStateByCountry:`${TEST_SERVER_URL_VL}/productmanagement/api/location?country_id=`,
      fetchCitiesByState:`${TEST_SERVER_URL_VL}/productmanagement/api/location?state_id=`,
    },
  };

  const environment = process.env.ENVIRONMENT || "test"; // change prod to test, local,stable, dev for respective environments
  const conf = confs[environment];

  return conf;
}
