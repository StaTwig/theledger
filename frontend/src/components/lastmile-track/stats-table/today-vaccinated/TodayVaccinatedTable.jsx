import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import TodayVaccinatedRow from "./TodayVaccinatedRow";
import EmptyIcon from "../../../../assets/files/designs/empty-table.jpg";
import { getVaccinationsList } from "../../../../actions/lastMileActions";
import { formatDate } from "../../../../utils/dateHelper";
import { useTranslation } from "react-i18next";

export default function TodayVaccinatedTable() {
  let today = new Date();
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState();
  const [vaccinationsList, setVaccinationsList] = useState([]);
  const { t } = useTranslation();

  const handleChange = (event, value) => {
    setPage(value);
  };

  useEffect(async () => {
    const payload = {
      today: true,
      skip: (page - 1) * 10,
      limit: 10,
    };

    const result = await getVaccinationsList(payload);
    if (result?.data?.success) {
      setVaccinationsList(result.data.data.vaccinationsList);
      setTotalCount(result.data.data.totalCount);
    }
  }, [page]);

  return (
    <>
      <TableContainer className="vl-mui-custom-tablecontainer">
        <div className="Beneficiary--header">
          <h1 className="vl-subtitle f-700 vl-black">{t("today_vaccine")}</h1>
          <h1 className="vl-body f-500 vl-grey-sm">{formatDate(today)}</h1>
        </div>
        {vaccinationsList && vaccinationsList.length ? (
          <>
            <Table sx={{ minWidth: 650 }} className="vl-mui-custom-table">
              <TableHead className="vl-mui-custom-tablehead">
                <TableRow className="vl-mui-custom-tr">
                  <TableCell align="center">
                    <div className="vl-table-column">
                      <p className="vl-body f-500 vl-blue">{t("s_no")}</p>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="vl-table-column">
                      <p className="vl-body f-500 vl-blue">{t("batch_no")}</p>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="vl-table-column">
                      <p className="vl-body f-500 vl-blue">{t("gender")}</p>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="vl-table-column">
                      <p className="vl-body f-500 vl-blue">{t("age")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="vl-mui-custom-tablebody">
                {vaccinationsList &&
                  vaccinationsList.length &&
                  vaccinationsList.map((row, i) => (
                    <TodayVaccinatedRow dose={row} index={i} />
                  ))}
              </TableBody>
            </Table>
            <div className="mi_custom_pagination_wrapper">
              <Pagination
                count={Math.ceil(totalCount / 10)}
                page={page}
                onChange={handleChange}
              />
            </div>
          </>
        ) : (
          <div className="Table--Empty-container">
            <div className="Table--empty-illustartion">
              <img src={EmptyIcon} alt="EmptyIcon" />
              <h1 className="vl-subheading f-500 vl-black">{t("no_rec")}</h1>
            </div>
          </div>
        )}
        <div className="padding-space"></div>
      </TableContainer>
    </>
  );
}
