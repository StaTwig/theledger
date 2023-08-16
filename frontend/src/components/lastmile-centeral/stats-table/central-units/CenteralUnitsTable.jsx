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
import CenteralUnitsRow from "./CenteralUnitsRow";
import Pagination from "@mui/material/Pagination";
import { getVialsUtilised } from "../../../../actions/lastMileActions";

export default function CenteralUnitsTable({ filters, t }) {
  const [page, setPage] = useState(1);
  const [unitsUtilized, setUnitsUtilized] = useState([]);
  const [totalCount, setTotalCount] = useState();

  const handleChange = (event, value) => {
    setPage(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      const payload = filters;
      payload.today = false;
      payload.skip = (page - 1) * 10;
      payload.limit = 10;

      const result = await getVialsUtilised(payload);
      if (result?.data?.success) {
        setUnitsUtilized(result.data.data.vialsUtilized);
        setTotalCount(result.data.data.totalCount);
      } else console.log(result.data);
    };
    fetchData();
  }, [filters, page]);

  return (
    <>
      <TableContainer className='vl-mui-custom-tablecontainer'>
        <div className='Beneficiary--header'>
          <h1 className='vl-subtitle f-700 vl-black'>{t("total_util")}</h1>
        </div>
        {unitsUtilized && unitsUtilized?.length ? (
          <>
            <Table sx={{ minWidth: 650 }} className='vl-mui-custom-table'>
              <TableHead className='vl-mui-custom-tablehead'>
                <TableRow className='vl-mui-custom-tr'>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("s.no")}</p>
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
                        {t("no_of_vaccine")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell align='center'>
                    <div className='vl-table-column'>
                      <p className='vl-body f-500 vl-blue'>{t("date")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody className='vl-mui-custom-tablebody'>
                {unitsUtilized &&
                  unitsUtilized.map((row, index) => (
                    <CenteralUnitsRow
                      key={index}
                      data={row}
                      index={index + 1}
                      page={page}
                    />
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
