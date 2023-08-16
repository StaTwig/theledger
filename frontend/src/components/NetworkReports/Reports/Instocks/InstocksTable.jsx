import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import InstocksRow from "./InstocksRow";
import { useTranslation } from "react-i18next";
import {
  getInStockFilterOptions,
  getmanufacturerInStockReport,
} from "../../../../actions/networkActions";
import { Pagination, useTheme } from "@mui/material";
import Filterbar from "../../Filter/Filterbar";
import { useDispatch } from "react-redux";
import { turnOff, turnOn } from "../../../../actions/spinnerActions";

function TableHeader({
  anchorEl,
  selectedColumn,
  handleClick,
  handleClose,
  theme,
  filterOptions,
  selectedFilters,
  handleFilterUpdate,
  t,
}) {
  return (
    <TableRow>
      <TableCell>
        <div
          className='mi_report_table_head'
          onClick={(event) => handleClick(event, "productCategory")}
        >
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("product_category")}
          </p>
          <i className='fa-solid fa-sort grey-400'></i>
        </div>
        <Filterbar
          title={t("product_category")}
          fieldName='productCategory'
          anchorEl={anchorEl}
          selectedColumn={selectedColumn}
          handleClose={handleClose}
          theme={theme}
          options={filterOptions.productCategories}
          selectedFilters={selectedFilters}
          handleFilterUpdate={handleFilterUpdate}
        />
      </TableCell>
      <TableCell>
        <div
          className='mi_report_table_head'
          onClick={(event) => handleClick(event, "productName")}
        >
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("product_name")}
          </p>
          <i className='fa-solid fa-sort grey-400'></i>
        </div>
        <Filterbar
          title={t("product_name")}
          fieldName='productName'
          anchorEl={anchorEl}
          selectedColumn={selectedColumn}
          handleClose={handleClose}
          theme={theme}
          options={filterOptions.productNames}
          selectedFilters={selectedFilters}
          handleFilterUpdate={handleFilterUpdate}
        />
      </TableCell>
      <TableCell>
        <div
          className='mi_report_table_head'
          onClick={(event) => handleClick(event, "manufacturer")}
        >
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("manufacturer")}
          </p>
          <i className='fa-solid fa-sort grey-400'></i>
          <Filterbar
            title={t("manufacturer")}
            fieldName='manufacturer'
            anchorEl={anchorEl}
            selectedColumn={selectedColumn}
            handleClose={handleClose}
            theme={theme}
            options={filterOptions.manufacturers}
            selectedFilters={selectedFilters}
            handleFilterUpdate={handleFilterUpdate}
          />
        </div>
      </TableCell>
      <TableCell>
        <div
          className='mi_report_table_head'
          onClick={(event) => handleClick(event, "organisation")}
        >
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("organisation_name")}
          </p>
          <i className='fa-solid fa-sort grey-400'></i>
          <Filterbar
            title={t("organisation_name")}
            fieldName='organisation'
            anchorEl={anchorEl}
            selectedColumn={selectedColumn}
            handleClose={handleClose}
            theme={theme}
            options={filterOptions.organisations}
            selectedFilters={selectedFilters}
            handleFilterUpdate={handleFilterUpdate}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className='mi_report_table_head'>
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("location_details")}
          </p>
          {/* <i className="fa-solid fa-sort grey-400"></i> */}
        </div>
      </TableCell>
      <TableCell>
        <div className='mi_report_table_head'>
          <p className='mi-body-sm f-400 mi-reset grey-400'>
            {t("quantity")} (UOM)
          </p>
          {/* <i className="fa-solid fa-sort grey-400"></i> */}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function InstocksTable({ locationParams }) {
  const dispatch = useDispatch();
  const [inStock, setInStock] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [inStockFilters, setInStockFilters] = useState();
  const [reportWarehouse, setReportWarehouse] = useState("");
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    productCategories: [],
    productNames: [],
    manufacturers: [],
    organisations: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    productCategory: "",
    productName: "",
    manufacturer: "",
    organisation: "",
  });

  const theme = useTheme();
  const { t } = useTranslation();

  const handlePageChange = (event, newValue) => {
    setPage(newValue);
  };

  const handleFilterUpdate = (fieldName, newValue) => {
    if (!fieldName) return;
    setSelectedFilters((prevState) => ({
      ...prevState,
      [fieldName]: newValue,
    }));
  };

  const handleClick = (event, fieldName) => {
    setAnchorEl(event.currentTarget);
    setSelectedColumn(fieldName);
  };

  const handleClose = () => {
    if (anchorEl) {
      anchorEl.focus();
    }
    setAnchorEl(null);
    setSelectedColumn("");
  };

  const getInstock = async (startDate) => {
    let payload = {
      ...selectedFilters,
      ...locationParams,
    };
    payload.reportWarehouse = reportWarehouse;
    payload.skip = (page - 1) * 10;
    payload.limit = 10;
    dispatch(turnOn());
    const inStock = await getmanufacturerInStockReport(payload);
    if (inStock) {
      setInStock(inStock.data.inStockReport);
      setTotalCount(inStock.data.totalCount);
      setReportWarehouse(inStock.data.warehouseId);
    }
    dispatch(turnOff());
  };

  const getInstockFilters = async () => {
    let payload = {
      ...selectedFilters,
      ...locationParams,
    };
    payload.reportWarehouse = reportWarehouse;
    payload.date = "";
    dispatch(turnOn());
    const inStockFilters = await getInStockFilterOptions(payload);
    if (inStockFilters) setInStockFilters(inStockFilters.filters);
    dispatch(turnOff());
  };

  useEffect(() => {
    getInstockFilters();
    if (page === 1) getInstock();
    setPage(1);
  }, [selectedFilters, locationParams]);

  useEffect(() => {
    getInstock();
  }, [page]);

  useEffect(() => {
    if (inStockFilters?.length) {
      let categoriesSet = new Set();
      let productNamesSet = new Set();
      let manufacturersSet = new Set();
      let organisationSet = new Set();
      inStockFilters.map((elem) => {
        categoriesSet.add(elem.productCategory);
        productNamesSet.add(elem.productName);
        manufacturersSet.add(elem.manufacturer);
        organisationSet.add(elem.organisation);
      });
      let cols = filterOptions;
      cols.productCategories = [...categoriesSet];
      cols.productNames = [...productNamesSet];
      cols.manufacturers = [...manufacturersSet];
      cols.organisations = [...organisationSet];
      setFilterOptions(cols);
    }
  }, [inStockFilters]);

  return (
    <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label='simple table'>
        <TableHead>
          <TableHeader
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            selectedColumn={selectedColumn}
            handleClick={handleClick}
            handleClose={handleClose}
            theme={theme}
            filterOptions={filterOptions}
            selectedFilters={selectedFilters}
            handleFilterUpdate={handleFilterUpdate}
            t={t}
          />
        </TableHead>
        <TableBody>
          {inStock.map((product, index) => (
            <InstocksRow
              t={t}
              product={product}
              reportWarehouse={reportWarehouse}
              key={index}
            />
          ))}
        </TableBody>
      </Table>
      <Pagination
        count={Math.ceil(totalCount / 10)}
        page={page}
        onChange={handlePageChange}
      />
    </TableContainer>
  );
}
