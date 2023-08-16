import React, { useState } from "react";
import { TableCell, TableRow } from "@mui/material";
import Switch from "@mui/material/Switch";
import { useHistory } from "react-router";
import { modifyLocation } from "../../../../actions/organisationActions";

export default function LocationRow({ warehouse, orgDetails, refresh }) {
  const history = useHistory();
  const [buttonStatus, setButtonStatus] = useState(
    warehouse?.status === "ACTIVE" || false,
  );

  const modifyWarehouseStatus = async (data) => {
    const result = await modifyLocation(data);
    if (result.status !== 200) {
      alert(result.data.data.message);
    }
  };
  const changeBtnStatus = (status) => {
    if (status) {
      setButtonStatus(true);
      modifyWarehouseStatus({
        id: warehouse.id,
        eid: warehouse?.employee?.[0]?.id,
        type: 1,
      });
    } else {
      setButtonStatus(false);
      modifyWarehouseStatus({
        id: warehouse.id,
        eid: warehouse?.employee?.[0]?.id,
        type: 2,
      });
    }
    refresh();
  };

  return (
		<TableRow
			sx={{ "& > *": { borderBottom: "unset !important" } }}
			className="vl-custom-tableRow"
			onClick={() =>
				history.push(`/statwig/view-users/${warehouse.id}/${orgDetails.id}`, {
					warehouse,
					orgDetails,
				})
			}
		>
			<TableCell align="center">
				<p className="vl-body f-400 vl-grey-md">{warehouse.title}</p>
			</TableCell>
			<TableCell align="center">
				<p className="vl-body f-400 vl-grey-md">{warehouse.warehouseAddress.city}</p>
			</TableCell>
			<TableCell align="center">
				<p className="vl-body f-400 vl-grey-md">{warehouse.warehouseAddress.firstLine}</p>
			</TableCell>
			<TableCell align="center">
				<p className="vl-body f-400 vl-grey-md">
					{warehouse?.employeeCount?.total ? warehouse.employeeCount.total : "N/A"}
				</p>
			</TableCell>
			<TableCell onClick={(e) => e.stopPropagation()}>
				<div className="status-switch-button">
					<Switch
						color="warning"
						checked={buttonStatus}
						onChange={(e) => {
							e.stopPropagation();
							e.preventDefault();
							changeBtnStatus(!buttonStatus);
						}}
					/>
					{buttonStatus ? (
						<div className="label-status-btn status-accept-bg">
							<div className="status-dot status-accept-dot"></div>
							<p className="vl-small f-500 vl-black">Active</p>
						</div>
					) : (
						<div className="label-status-btn status-reject-bg">
							<div className="status-dot status-reject-dot"></div>
							<p className="vl-small f-500 vl-black">InActive</p>
						</div>
					)}
				</div>
			</TableCell>
		</TableRow>
	);
}
