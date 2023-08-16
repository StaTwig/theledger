import React from "react";
import TableCell from "@mui/material/TableCell";

import TableRow from "@mui/material/TableRow";
import { formatDate } from "../../../../utils/dateHelper";

export default function NearexpireRow({product, t}) {
  return (
		<TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product?.productCategory}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product?.productName}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product.manufacturer}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product.batchNumber}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{formatDate(product.expiredDates)}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product.organisation}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{`${product.address.city}, ${product.address.state}`}</p>
				</div>
			</TableCell>
		</TableRow>
	);
}
