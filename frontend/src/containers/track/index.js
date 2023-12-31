import React, { useState, useEffect } from "react";
import Track from "../../components/track";
import Header from "../../shared/header";
import Sidebar from "../../shared/sidebarMenu";
import { useDispatch } from "react-redux";
import { getJourneyTrack } from "../../actions/shipmentActions";
import { turnOff, turnOn } from "../../actions/spinnerActions";
import moment from "moment";
import queryString from "query-string";
import { useTranslation } from "react-i18next";

const TrackContainer = (props) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [poChainOfCustodyData, setPoChainOfCustodyData] = useState([]);
  const [shippmentChainOfCustodyData, setShippmentChainOfCustodyData] =
    useState([]);
  const [viewIotTemperatureSplineline, setViewIotTemperatureSplineline] =
    useState(false);
  const [
    enableTracingZoomOutPageForViewShipment,
    setEnableTracingZoomOutPageForViewShipment,
  ] = useState(false);

  const searchData = async (id) => {
    dispatch(turnOn());
    const result = await getJourneyTrack(id);

    dispatch(turnOff());
    if (result.status === 200) {
      var arr = [];
      var finalArr = [];
      if (result.data.data?.poDetails) {
        if (!!Object.keys(result.data.data?.poDetails).length) {
          setPoChainOfCustodyData(result.data.data?.poDetails);
          arr = result.data.data.poDetails;

          arr["shipmentUpdates"] = [
            {
              poStatus: result.data.data.poDetails.poStatus,
              status: "RECEIVED",
              products: result.data.data.poDetails.products,
              updatedOn: moment(
                result.data.data.poDetails.lastUpdatedOn
              ).format("DD/MM/YYYY hh:mm"),
              isOrder: 1,
            },
          ];
          if (result.data.data?.trackedShipment?.length)
            finalArr = [arr]
              .concat(result.data.data.inwardShipmentsArray)
              .concat(result.data.data.trackedShipment)
              .concat(result.data.data.outwardShipmentsArray);
          else
            finalArr = [arr]
              .concat(result.data.data.inwardShipmentsArray)
              .concat(result.data.data.outwardShipmentsArray);
        }
      }

      if (finalArr.length === 0) {
        if (result.data.data?.trackedShipment?.length)
          finalArr = result.data.data.inwardShipmentsArray
            .concat(result.data.data.trackedShipment)
            .concat(result.data.data.outwardShipmentsArray);
      }
      setShippmentChainOfCustodyData(finalArr);
    } else {
      setPoChainOfCustodyData([]);
      setShippmentChainOfCustodyData([]);
    }
  };

  const resetData = () => {
    setPoChainOfCustodyData([]);
    setShippmentChainOfCustodyData([]);
  };

  useEffect(() => {
    const { status } = queryString.parse(props.location.search);
    if (status === "shipmentView") {
      setViewIotTemperatureSplineline(true);
    }
  }, [props.location.search]);

  const navigateToOriginalShipmentPage = () => {
    props.history.push(`/viewshipment/${props.match.params.id}`);
  };

  const zoomOutTemperatureGraph = () => {
    setEnableTracingZoomOutPageForViewShipment(true);
    setViewIotTemperatureSplineline(true);
  };

  const navigateBackToTracingPage = () => {
    setEnableTracingZoomOutPageForViewShipment(false);
    setViewIotTemperatureSplineline(false);
  };

  const [trackTraceData, setTrackTraceData] = useState({
    setValue: "",
    value: "",
    resetData: "",
    setIsSubmitted: "",
  });

  return (
    <div className='container-fluid p-0'>
      <Header {...props} t={t} />
      <div className='d-flex'>
        <Sidebar {...props} t={t} trackTraceData={trackTraceData} />
        <div className='content'>
          <Track
            searchData={searchData}
            resetData={resetData}
            poChainOfCustodyData={poChainOfCustodyData}
            shippmentChainOfCustodyData={shippmentChainOfCustodyData}
            viewIotTemperatureSplineline={viewIotTemperatureSplineline}
            navigateToOriginalShipmentPage={navigateToOriginalShipmentPage}
            enableTracingZoomOutPageForViewShipment={
              enableTracingZoomOutPageForViewShipment
            }
            zoomOutTemperatureGraph={zoomOutTemperatureGraph}
            navigateBackToTracingPage={navigateBackToTracingPage}
            t={t}
            lang={i18n.resolvedLanguage}
            setTrackTraceData={setTrackTraceData}
            {...props}
          />
        </div>
      </div>
    </div>
  );
};

export default TrackContainer;
