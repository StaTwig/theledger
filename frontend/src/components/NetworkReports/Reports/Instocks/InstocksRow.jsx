import React from "react";
import TableCell from "@mui/material/TableCell";

import TableRow from "@mui/material/TableRow";

export default function InstocksRow({product, reportWarehouse, t}) {
  return (
		<TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product?.productCategory}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product.productName}</p>
				</div>
			</TableCell>
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product.manufacturer}</p>
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
			<TableCell component="th" scope="row">
				<div className="mi-table-data">
					<p className="mi-body-md black f-500 mi-reset">{product?.productQuantity || 0}</p>
					<p className="mi-body-xs grey f-400 mi-reset mi-no-wrap">
						({product?.unitofMeasure?.name})
					</p>
				</div>
			</TableCell>
		</TableRow>
	);
}
