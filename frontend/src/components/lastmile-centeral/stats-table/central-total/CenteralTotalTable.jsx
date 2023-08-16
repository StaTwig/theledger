import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import EmptyIcon from "../../../../assets/files/designs/empty-table.jpg";
import CenteralTotalRow from "./CenteralTotalRow";
import Pagination from "@mui/material/Pagination";
import { getAllVaccinationDetails } from "../../../../actions/lastMileActions";
import _ from "lodash";

export default function CenteralTotalTable({ filters, t, i18n }) {
  const [page, setPage] = useState(1);
  const [vaccinationsList, setVaccinationsList] = useState([]);
  const [totalCount, setTotalCount] = useState();
  const [oldFilters, setoldFilters] = useState();

  const handleChange = (event, value) => {
    setPage(value);
    setoldFilters(filters);
  };

  useEffect(() => {
    const fetchData = async () => {
      const payload = filters;
      payload.today = false;
      payload.skip = (page - 1) * 10;
      payload.limit = 10;
      if (_.isEqual(filters, oldFilters) !== true) {
				payload.skip = 0;
				setPage(1);
			}
      const result = await getAllVaccinationDetails(payload, i18n.language);
      if (result?.data?.success) {
        setVaccinationsList(result.data.data.result);
        setTotalCount(result.data.data.totalCount);
      }
    };
    fetchData();
  }, [filters, page]);

  return (
    <>
      <TableContainer className='vl-mui-custom-tablecontainer'>
        <div className='Beneficiary--header'>
          <h1 className='vl-subtitle f-700 vl-black'>{t("total_vaccine")}</h1>
        </div>
        {vaccinationsList && vaccinationsList?.length ? (
          <>
            <Table sx={{ minWidth: 650 }} className='vl-mui-custom-table'>
              <TableHead className='vl-mui-custom-tablehead'>
                <TableRow className='vl-mui-custom-tr'>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("date")}</p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("batch_no")}</p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>
                        {t("manufacturer_name")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("age")}</p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("gender")}</p>
                    </div>
                  </TableCell>

                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("state")}</p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("city")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody className='vl-mui-custom-tablebody'>
                {vaccinationsList &&
                  vaccinationsList.map((row) => (
                    <CenteralTotalRow data={row} />
                  ))}
              </TableBody>
            </Table>
            <div className='mi_custom_pagination_wrapper'>
              <Pagination
                count={Math.ceil(totalCount / 10)}
                page={page}
                onChange={handleChange}
              />
            </div>
          </>
        ) : (
          <div className='Table--Empty-container-alt'>
            <div className='Table--empty-illustartion'>
              <img src={EmptyIcon} alt='EmptyIcon' />
              <h1 className='vl-subheading f-500 vl-black'>{t("no_rec")}</h1>
            </div>
          </div>
        )}
        <div className='padding-space'></div>
      </TableContainer>
    </>
  );
}
