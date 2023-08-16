import React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import InstockRow from "./InstockRow";
import { useSelector } from "react-redux";
import Filter from "../Filter/Filter";
import EmptyIcon from "../../../../assets/files/designs/empty-table.jpg";

export default function Instock({
	inStock,
	inStockFilters,
	reportWarehouse,
	setInstockType,
	setInstockId,
	t,
}) {
	const { user } = useSelector((state) => state);
  const Distributor = user.type === "DISTRIBUTORS" || user.type === "DROGUERIA" ? true : false;
  
	return (
		<>
			<TableContainer sx={{ minHeight: 560 }}>
				<Table sx={{ minWidth: 665 }} className="mi-custom-table" aria-label="collapsible table">
					<TableHead>
						<TableRow>
							<TableCell className="mi-custom-tableHead mi-first-cell-padding">
								<Filter
									filters={inStockFilters}
									filterKey={"productCategory"}
									title={t("product_category")}
									setStockType={setInstockType}
									setStockId={setInstockId}
								/>
							</TableCell>
							<TableCell className="mi-custom-tableHead">
								<Filter
									filters={inStockFilters}
									title={t("product_name")}
									filterKey={"productName"}
									setStockType={setInstockType}
									setStockId={setInstockId}
								/>
							</TableCell>
							{Distributor && (
								<TableCell className="mi-custom-tableHead">
									{/* <Filter
                      filters={inStockFilters}
                      title={t("Product Manufacturer")}
                      filterKey={"manufacturer"}
                    /> */}
									<p className="mi-body-sm mi-reset grey-400">{t("product_manufacturer")}</p>
								</TableCell>
							)}
							<TableCell className="mi-custom-tableHead">
								<div className="table-header-with-filter">
									<p className="mi-body-sm mi-reset grey-400">{t("opening_balance")}</p>
								</div>
							</TableCell>
							<TableCell className="mi-custom-tableHead">
								<div className="table-header-with-filter">
									<p className="mi-body-sm mi-reset grey-400">
										{t("opening_current_in_stock_(qty)")}
									</p>
								</div>
							</TableCell>
							<TableCell className="mi-custom-tableHead"></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{inStock && inStock?.length > 0 ? (
							inStock.map((product, idx) => (
								<InstockRow t={t} product={product} reportWarehouse={reportWarehouse} key={idx} />
							))
						) : (
							<TableRow>
								<TableCell colSpan={Distributor ? 6 : 5}>
									<div className="Table--Empty-container bg_white_added">
										<div className="Table--empty-illustartion">
											<img src={EmptyIcon} alt="EmptyIcon" />
											<h1 className="vl-subheading f-500 vl-black">{t("no_rec")}</h1>
										</div>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	);
}
