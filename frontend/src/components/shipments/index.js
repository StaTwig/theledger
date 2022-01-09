import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./style.scss";
import Table from "./table";
import Tabs from "../../shared/tabs";
import Tiles from "./tiles";
import Add from "../../assets/icons/createshipment.png";
import TableFilter from "../../shared/advanceTableFilter";
import mon from "../../assets/icons/brand.svg";
import calender from "../../assets/icons/calendar.svg";
import Status from "../../assets/icons/Status.svg";
import { useDispatch } from "react-redux";
import { getAllUsers } from "../../actions/userActions";
import {
  getInboundShipments,
  getOutboundShipments,
  getSupplierAndReceiverList,
  getShipmentIds,
  getGMRShipments,
} from "../../actions/shipmentActions";
import Received from "../../assets/icons/Received1.svg";
import Sent from "../../assets/icons/Sent.png";
import update from "../../assets/icons/Update_Status.png";
import { config } from "../../config";
import { getExportFile } from "../../actions/poActions";
import uuid from "react-uuid";
import { isAuthenticated } from "../../utils/commonHelper";

const ShipmentAnalytic = (props) => {
  const { t } = props;
  const [visible, setvisible] = useState("one");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [alerts, setAlerts] = useState(false);
  const dispatch = useDispatch();
  const [outboundShipments, setOutboundShipments] = useState([]);
  const [inboundShipments, setInboundShipments] = useState([]);
  const [supplierReceiverList, setSupplierReceiverList] = useState([]);
  const [shipmentIdList, setShipmentIdList] = useState([]);
  const [idFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [count, setCount] = useState(0);
  const [exportFilterData, setExportFilterData] = useState([]);
  const [showExportFilter, setShowExportFilter] = useState(false);
  var status;

  if (
    !isAuthenticated("inboundShipments") &&
    !isAuthenticated("outboundShipments")
  )
    props.history.push(`/profile`);

  useEffect(() => {
    async function fetchData() {
      if (props.user.emailId === "gmr@statledger.io") {
        const inboundRes = await getGMRShipments(0, limit);
        setOutboundShipments(inboundRes.data.data);
        setCount(inboundRes.data.count);
      } else {
        if (visible === "one") {
          const inboundRes = await getInboundShipments(
            "",
            "",
            "",
            "",
            "",
            0,
            limit
          ); // id, from, to, dateFilter, status, skip, limit
          setInboundShipments(inboundRes.data.inboundShipments);
          setCount(inboundRes.data.count);
        } else {
          const outboundRes = await getOutboundShipments(
            "",
            "",
            "",
            "",
            "",
            0,
            limit
          ); // id, from, to, dateFilter, status, skip, limit
          setOutboundShipments(outboundRes.data.outboundShipments);
          setCount(outboundRes.data.count);
        }
      }
      const supplierReceiverListRes = await getSupplierAndReceiverList();
      setSupplierReceiverList(supplierReceiverListRes.data);

      const shipmentIdListRes = await getShipmentIds();
      setShipmentIdList(shipmentIdListRes.data);
      setSkip(0);
    }
    fetchData();
    // dispatch(resetShipments());
    dispatch(getAllUsers());
  }, [dispatch, limit, visible, props]);

  const onPageChange = async (pageNum) => {
    const recordSkip = (pageNum - 1) * limit;

    setSkip(recordSkip);
    if (props.user.emailId === "gmr@statledger.io") {
      const inboundRes = await getGMRShipments(recordSkip, limit);
      setInboundShipments(inboundRes.data.data);
      setCount(inboundRes.data.count);
    } else {
      if (visible === "one") {
        const inboundRes = await getInboundShipments(
          idFilter,
          fromFilter,
          toFilter,
          dateFilter,
          statusFilter,
          recordSkip,
          limit
        ); // id, from, to, dateFilter, status, skip, limit
        setInboundShipments(inboundRes.data.inboundShipments);
        setCount(inboundRes.data.count);
      } else {
        const outboundRes = await getOutboundShipments(
          idFilter,
          fromFilter,
          toFilter,
          dateFilter,
          statusFilter,
          recordSkip,
          limit
        ); // id, from, to, dateFilter, status, skip, limit
        setOutboundShipments(outboundRes.data.outboundShipments);
        setCount(outboundRes.data.count);
      }
    }
    setData(visible);
  };

  const headers = {
    coloumn1: t('shipment_id'),
    coloumn2: t("shipment_date"),
    coloumn3: t("from"),
    coloumn4: t("to"),
    coloumn6: t("status"),

    img1: <img src={mon} width='16' height='16' alt='Monday' />,
    img2: <img src={calender} width='16' height='16' alt='Calender' />,
    img3: <img src={Received} width='16' height='16' alt='Received' />,
    img4: <img src={Sent} width='16' height='16' alt='Sent' />,
    img6: <img src={Status} width='16' height='16' alt='Status' />,
  };

  const setData = (v, a = false) => {
    setvisible(v);
    setAlerts(a);
  };

  const setDateFilterOnSelect = async (dateFilterSelected) => {
    setDateFilter(dateFilterSelected);
    setSkip(0);
    if (visible === "one") {
      const inboundRes = await getInboundShipments(
        idFilter,
        fromFilter,
        toFilter,
        dateFilterSelected,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setInboundShipments(inboundRes.data.inboundShipments);
      setCount(inboundRes.data.count);
    } else {
      const outboundRes = await getOutboundShipments(
        idFilter,
        fromFilter,
        toFilter,
        dateFilterSelected,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setOutboundShipments(outboundRes.data.outboundShipments);
      setCount(outboundRes.data.count);
    }
  };

  const setStatusFilterOnSelect = async (statusFilterSelected) => {
    setStatusFilter(statusFilterSelected);
    setSkip(0);
    if (visible === "one") {
      const inboundRes = await getInboundShipments(
        idFilter,
        fromFilter,
        toFilter,
        dateFilter,
        statusFilterSelected,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setInboundShipments(inboundRes.data.inboundShipments);
      setCount(inboundRes.data.count);
    } else {
      const outboundRes = await getOutboundShipments(
        idFilter,
        fromFilter,
        toFilter,
        dateFilter,
        statusFilterSelected,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setOutboundShipments(outboundRes.data.outboundShipments);
      setCount(outboundRes.data.count);
    }
  };

  const setToShipmentFilterOnSelect = async (toShipmentFilterSelected) => {
    setToFilter(toShipmentFilterSelected);
    setSkip(0);
    if (visible === "one") {
      const inboundRes = await getInboundShipments(
        idFilter,
        fromFilter,
        toShipmentFilterSelected,
        dateFilter,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setInboundShipments(inboundRes.data.inboundShipments);
      setCount(inboundRes.data.count);
    } else {
      const outboundRes = await getOutboundShipments(
        idFilter,
        fromFilter,
        toShipmentFilterSelected,
        dateFilter,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setOutboundShipments(outboundRes.data.outboundShipments);
      setCount(outboundRes.data.count);
    }
  };

  const setFromShipmentFilterOnSelect = async (fromShipmentFilterSelected) => {
    setFromFilter(fromShipmentFilterSelected);
    setSkip(0);
    if (visible === "one") {
      const inboundRes = await getInboundShipments(
        idFilter,
        fromShipmentFilterSelected,
        toFilter,
        dateFilter,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setInboundShipments(inboundRes.data.inboundShipments);
      setCount(inboundRes.data.count);
    } else {
      const outboundRes = await getOutboundShipments(
        idFilter,
        fromShipmentFilterSelected,
        toFilter,
        dateFilter,
        statusFilter,
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setOutboundShipments(outboundRes.data.outboundShipments);
      setCount(outboundRes.data.count);
    }
  };

  const setShipmentIdFilterOnSelect = async (shipmentIdFilterSelected) => {
    setSkip(0);
    if (visible === "one") {
      const inboundRes = await getInboundShipments(
        shipmentIdFilterSelected,
        "",
        "",
        "",
        "",
        0,
        limit
      ); //id, from, to, dateFilter, status, skip, limit
      setInboundShipments(inboundRes.data.inboundShipments);
      setCount(inboundRes.data.count);
    } else {
      const outboundRes = await getOutboundShipments(
        shipmentIdFilterSelected,
        "",
        "",
        "",
        "",
        0,
        limit
      ); // id, from, to, dateFilter, status, skip, limit
      setOutboundShipments(outboundRes.data.outboundShipments);
      setCount(outboundRes.data.count);
    }
  };
  const sendData = () => {
    let rtnArr = visible === "one" ? inboundShipments : outboundShipments;
    if (alerts)
      rtnArr = rtnArr.filter((row) => row?.shipmentAlerts?.length > 0);
    if (props.user.emailId === "gmr@statledger.io") rtnArr = outboundShipments;
    return rtnArr ? rtnArr : [];
  };

  useEffect(() => {
    setExportFilterData([
      { key: "excel", value: t('excel'), checked: false },
      { key: "pdf", value: t('pdf'), checked: false },
      { key: "email", value: t('mail'), checked: false },
      // { key: "print", value: "Print", checked: false },
    ]);
  }, []);

  const onSelectionOfDropdownValue = (index, type, value) => {
    setShowExportFilter(false);
    let url = "";
    if (visible === "one") {
      url = `${
        config().getExportFileForInboundShipmentUrl
      }?type=${value.toLowerCase()}`;
    }
    if (visible === "two") {
      url = `${
        config().getExportFileForOutboundShipmentUrl
      }?type=${value.toLowerCase()}`;
    }

    var today = new Date();

    var nameOfFile;

    if(visible=='one'){
      nameOfFile = 'shipmentoutbound'+today.getFullYear().toString()+'/'+(today.getMonth()+1).toString()+'/'+today.getDate().toString();
      // console.log(name, name);
    }
    else if(visible=='two'){
      nameOfFile = 'shipmentinbound'+today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
    }
    getExportFile(url, value).then((response) => {
      console.log(response);
      if (response.data && response.status !== 200) {
        console.log("Error while downloading file");
      } else {
        const downloadUrl = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute(
          "download",
          `${nameOfFile}.${
            value.toLowerCase() === "excel" ? "xlsx" : value.toLowerCase()
          }`
        ); //any other extension
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    });
  };

  return (
    <div className='shipment'>
      <div className='d-flex justify-content-between'>
        <h1 className='breadcrumb'>{t('shipments')}</h1>
        <div className='d-flex'>
          {/* <button className=" btn-primary btn mr-2" onClick={()=>setOpenPOExcel(true)}>Import PO</button>

          <button
            className="btn btn-orange fontSize20 font-bold mr-2"
            onClick={() => setOpenPurchaseOrder(true)}
          >
            <img src={Order} width="14" height="14" className="mr-2" />
            <span>Create Purchase Order</span>
          </button> */}
          {isAuthenticated("updateShipment") && (
            <Link to='/enterid'>
              <button
                className='btn btn-orange fontSize20 font-bold mr-3 chain mt-2'
                disabled={status === "RECEIVED"}
              >
                <img
                  src={update}
                  width='20'
                  height='17'
                  className='mr-2 mb-1'
                  alt='UpdateShipment'
                />
                <span>
                  <b>{t('update_shipment')}</b>
                </span>
              </button>
            </Link>
          )}
          {isAuthenticated("createShipment") && (
            <Link
              to={
                props.user.emailId === "gmr@statledger.io"
                  ? `/createshipment`
                  : `/newshipment`
              }
            >
              <button className='btn btn-yellow fontSize20 font-bold mt-2'>
                <img
                  src={Add}
                  width='20'
                  height='17'
                  className='mr-2 mb-1'
                  alt='CreateShipment'
                />
                <span>
                  <b>{t('create_shipment')}</b>
                </span>
              </button>
            </Link>
          )}
        </div>
      </div>
      {isAuthenticated("shipmentAnalytics") &&
        props.user.emailId !== "gmr@statledger.io" && (
          <Tiles {...props} setData={setData} />
        )}
      {props.user.emailId !== "gmr@statledger.io" && (
        <div className='mt-4'>
          <Tabs
            {...props}
            isAuthenticated={isAuthenticated}
            setvisible={setvisible}
            visible={visible}
            setShowExportFilter={setShowExportFilter}
          />
        </div>
      )}
      {/* <div className='full-width-ribben mt-4'>
        <TableFilter
          data={headers}
          shipmentIdList={shipmentIdList}
          supplierReceiverList={
            props.user.emailId === "gmr@statledger.io"
              ? []
              : supplierReceiverList
          }
          setShipmentIdFilterOnSelect={setShipmentIdFilterOnSelect}
          setFromShipmentFilterOnSelect={setFromShipmentFilterOnSelect}
          setToShipmentFilterOnSelect={setToShipmentFilterOnSelect}
          setStatusFilterOnSelect={setStatusFilterOnSelect}
          setDateFilterOnSelect={setDateFilterOnSelect}
          fb='80%'
          showExportFilter={showExportFilter}
          setShowExportFilter={setShowExportFilter}
          exportFilterData={exportFilterData}
          onSelectionOfDropdownValue={onSelectionOfDropdownValue}
          isReportDisabled={!isAuthenticated("shipmentExportReport")}
        />
      </div> */}
      <div className='ribben-space'>
        <Table
          {...props}
          skip={skip}
          shpmnts={sendData}
          count={count}
          onPageChange={onPageChange}
          data={headers}
          shipmentIdList={shipmentIdList}
          supplierReceiverList={
            props.user.emailId === "gmr@statledger.io"
              ? []
              : supplierReceiverList
          }
          setShipmentIdFilterOnSelect={setShipmentIdFilterOnSelect}
          setFromShipmentFilterOnSelect={setFromShipmentFilterOnSelect}
          setToShipmentFilterOnSelect={setToShipmentFilterOnSelect}
          setStatusFilterOnSelect={setStatusFilterOnSelect}
          setDateFilterOnSelect={setDateFilterOnSelect}
          fb='80%'
          showExportFilter={showExportFilter}
          setShowExportFilter={setShowExportFilter}
          exportFilterData={exportFilterData}
          onSelectionOfDropdownValue={onSelectionOfDropdownValue}
          isReportDisabled={!isAuthenticated("shipmentExportReport")}
          t={t}
        />
      </div>
    </div>
  );
};

export default ShipmentAnalytic;
