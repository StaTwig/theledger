import React, { useState, useEffect } from "react";
import { getManufacturerWarehouses } from "../../../../../actions/networkActions";

const OrganizationList = ({ orgName, user, orgId, setReportWarehouse, refetchWarehouses }) => {
	const [warehouses, setWarehouses] = useState([]);
	
	useEffect(() => {
		(async () => {
			const warehouses = await getManufacturerWarehouses(orgId, "");
			let warehouseArray = warehouses.data.warehouses;
			setWarehouses(warehouseArray);
		})();
	}, [refetchWarehouses]);
	
	const [toggleButton, setToggleButton] = useState(false);
	return (
		<div className="mi-accordion-container">
			<div
				className="mi-flex-sb organization-list-dropdown"
				onClick={() => setToggleButton(!toggleButton)}
			>
				<div className="mi-table-data">
					<p className="mi-body-md black f-700 mi-reset noselect">{orgName}</p>
				</div>
				{toggleButton ? (
					<i className="fa-solid fa-angle-up"></i>
				) : (
					<i className="fa-solid fa-angle-down"></i>
				)}
			</div>
			{toggleButton && (
				<ul className="unordered-organization-list">
					{warehouses?.map((warehouse, index) => (
						<li className="mi-flex organization-list-item" key={index}>
							<span>
								<i className="fa-solid fa-location-dot mr-2"></i>
							</span>
							<button
								className="link-button"
								onClick={() => setReportWarehouse(warehouse?.warehouseId)}
								key={index}
							>
								Location {index + 1} - {warehouse?.title} - {warehouse?.city}
							</button>
						</li>
					))}
					<br></br>
				</ul>
			)}
		</div>
	);
};

export default OrganizationList;
