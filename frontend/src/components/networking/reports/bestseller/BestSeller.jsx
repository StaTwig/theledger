import React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import BestSellerRow from "./BestSellerRow";
import { useSelector } from "react-redux";
import EmptyIcon from "../../../../assets/files/designs/empty-table.jpg";

export default function BestSeller({ bestseller, t }) {
  const { user } = useSelector((state) => state);
  const Distributor =
    user.type === "DISTRIBUTORS" || user.type === "DROGUERIA" ? true : false;
  return (
    <>
      {bestseller && bestseller?.length > 0 ? (
        <TableContainer sx={{ minHeight: 560 }}>
          <Table
            sx={{ minWidth: 665 }}
            className="mi-custom-table"
            aria-label="collapsible table"
          >
            <TableHead>
              <TableRow>
                <TableCell className="mi-custom-tableHead mi-first-cell-padding">
                  <p className="mi-body-sm mi-reset grey-400">
                    {t("product_category")}
                  </p>
                </TableCell>
                <TableCell className="mi-custom-tableHead">
                  <p className="mi-body-sm mi-reset grey-400">
                    {t("product_name")}
                  </p>
                </TableCell>
                {Distributor && (
                  <TableCell className="mi-custom-tableHead">
                    <p className="mi-body-sm mi-reset grey-400">
                      {t("product_manufacturer")}
                    </p>
                  </TableCell>
                )}
                <TableCell className="mi-custom-tableHead">
                  <p className="mi-body-sm mi-reset grey-400">
                    {t("no_of_units_solds")}
                  </p>
                </TableCell>
                <TableCell className="mi-custom-tableHead"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bestseller.map((product, index) => (
                <BestSellerRow product={product} key={index} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="Table--Empty-container bg_white_added">
          <div className="Table--empty-illustartion">
            <img src={EmptyIcon} alt="EmptyIcon" />
            <h1 className="vl-subheading f-500 vl-black">{t("no_rec")}</h1>
          </div>
        </div>
      )}
    </>
  );
}
