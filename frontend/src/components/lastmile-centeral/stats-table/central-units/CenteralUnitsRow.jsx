import { TableCell, TableRow } from "@mui/material";
import React from "react";
import { formatDate } from "../../../../utils/dateHelper";

export default function CenteralUnitsRow({ data, index, page }) {
  return (
    <TableRow className='vl-mui-custom-tr'>
      <TableCell component='th' scope='row' align='center'>
        <div className='vl-table-body-column'>
          <p className='vl-body f-500 '>{index + (page - 1) * 10}</p>
        </div>
      </TableCell>
      <TableCell component='th' scope='row' align='center'>
        <div className='vl-table-body-column'>
          <p className='vl-body f-500 '>{data.batchNumber}</p>
        </div>
      </TableCell>
      <TableCell component='th' scope='row' align='center'>
        <div className='vl-table-body-column'>
          <p className='vl-body f-500 '>{data.numberOfDoses}</p>
        </div>
      </TableCell>
      <TableCell component='th' scope='row' align='center'>
        <div className='vl-table-body-column'>
          <p className='vl-body f-500 '>{formatDate(data.createdAt)}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
