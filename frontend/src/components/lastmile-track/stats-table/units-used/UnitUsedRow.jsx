import React from "react";
import { TableCell, TableRow } from "@mui/material";
import { format } from "date-fns";
import { fetchBatchByIdWithoutCondition } from "../../../../actions/lastMileActions";
export default function UnitUsedRow({
  vial,
  index,
  page,
  setSteps,
  setTableView,
  setBatchDetails,
  setVialId,
  setcount,
}) {
  const getBatchDetails = async (vialId, batchNumber, warehouseId, atomId) => {
    const result = await fetchBatchByIdWithoutCondition({
      atomId,
      warehouseId,
    });
    if (result?.data?.success === true) {
      let dIndex = result.data.data[0].atom.batchNumbers.findIndex(
        (element) => {
          return element.toLowerCase() === batchNumber.toLowerCase();
        }
      );
      const bNo =
        result.data.data[0].atom.batchNumbers[
          dIndex > -1 ? dIndex : batchNumber
        ];
      setVialId(vialId);
      setBatchDetails({
        ...result.data.data[0],
        batchNumber: bNo,
      });
      setTableView(false);
      setSteps(2);
    } else {
      alert(result.data?.message);
    }
  };
  return (
    <TableRow className="vl-mui-custom-tr">
      <TableCell component="th" scope="row" align="center">
        <div className="vl-table-body-column">
          <p className="vl-body f-500 ">{index + page * 10 - 9}</p>
        </div>
      </TableCell>
      <TableCell component="th" scope="row" align="center">
        <div className="vl-table-body-column">
          <p className="vl-body f-500 ">{vial.batchNumber}</p>
        </div>
      </TableCell>
      <TableCell component="th" scope="row" align="center">
        <div className="vl-table-body-column">
          <p className="vl-body f-500 ">{vial.numberOfDoses}</p>
        </div>
      </TableCell>
      <TableCell component="th" scope="row" align="center">
        <div className="vl-table-body-column">
          <p className="vl-body f-500 ">
            {format(new Date(vial.createdAt), "dd/MM/yyyy")}
          </p>
        </div>
      </TableCell>
      <TableCell component="th" scope="row" align="center">
        <div className="vl-table-body-column">
          {vial.isComplete ? (
            <div className="mi_status_label status_bg_completed">
              <i className="fa-solid fa-circle-check"></i>
              <p className="vl-body f-500">Completed</p>
            </div>
          ) : (
            <div
              className="mi_status_label status_bg_add"
              onClick={() => {
                getBatchDetails(
                  vial.id,
                  vial.batchNumber,
                  vial.warehouseId,
                  vial.atomId
                );
                setcount(0);
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <p className="vl-body f-500">Add</p>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
