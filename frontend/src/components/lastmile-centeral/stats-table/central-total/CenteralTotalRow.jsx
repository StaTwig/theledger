import { TableCell, TableRow } from "@mui/material";
import React from "react";
import { formatDate } from "../../../../utils/dateHelper";

export default function CenteralTotalRow({ data }) {
  return (
		<TableRow className="vl-mui-custom-tr">
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{formatDate(data.date)}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">#{data.batchNumber}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{data.organisationName}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{data.age}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{data.gender}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{data.state}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row" align="center">
				<div className="vl-table-body-column">
					<p className="vl-body f-500 ">{data.city}</p>
				</div>
			</TableCell>
		</TableRow>
	);
}
