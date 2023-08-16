import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../utils/dateHelper";

export default function BatchesTable({ batchesList, setBatchDetails, setSteps, toggleShowBatchesList }) {
	const { t } = useTranslation();

	const handleBatchClick = (batch) => {
		setBatchDetails({
      ...batch,
      batchNumber: batch.atom.batchNumbers[0]
    });
    setSteps(2);
    toggleShowBatchesList(false);
	};

	return (
		<>
			<TableContainer className="vl-mui-custom-tablecontainer">
				<Table sx={{ minWidth: 350 }} className="vl-mui-custom-table">
					<TableHead className="vl-mui-custom-tablehead">
						<TableRow className="vl-mui-custom-tr">
							<TableCell align="center">
								<div className="vl-table-column">
									<p className="vl-body f-500 vl-blue">{t("batch_no")}</p>
								</div>
							</TableCell>
							<TableCell align="center">
								<div className="vl-table-column">
									<p className="vl-body f-500 vl-blue">{t("exp_date")}</p>
								</div>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody className="vl-mui-custom-tablebody">
						{batchesList?.length &&
							batchesList.map((batch, i) => (
								<TableRow key={i} className="vl-mui-custom-tr">
									<TableCell component="th" scope="row" align="center" onClick={() => handleBatchClick(batch)}>
										<div className="vl-table-body-column">
											<p className="vl-body f-500 ">{batch.atom.batchNumbers[0]}</p>
										</div>
									</TableCell>
									<TableCell component="th" scope="row" align="center" onClick={() => handleBatchClick(batch)}>
										<div className="vl-table-body-column">
											<p className="vl-body f-500 ">
												{formatDate(batch.atom?.attributeSet?.expDate)}
											</p>
										</div>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	);
}