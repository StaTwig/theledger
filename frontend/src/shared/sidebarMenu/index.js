import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../footer";
import HomeIcon from "../../assets/icons/Overviewselected.svg";
import shipIcon from "../../assets/icons/Shippmentselected.png";
import InventoryIcon from "../../assets/icons/Inventoryselected.png";
import trackSelectedIcon from "../../assets/icons/Track_Traceselected.png";
import NetworkIcon from "../../assets/icons/blockicon.png";
import OrderSelectedIcon from "../../assets/icons/orderSelected.png";
import lastMileIcon from "../../assets/icons/lastMile.png";
import { isAuthenticated } from "../../utils/commonHelper";
import "./style.scss";

const SideBar = (props) => {
	const { match, user, t, trackTraceData } = props;
	const { url } = match;
	const [enable, setEnable] = useState(true);
	const intelEnabled = (props.user.type && props.user.type.toUpperCase() === "THIRD PARTY LOGISTICS") ? true : false;

	useEffect(() => {
		if (intelEnabled) setEnable(false);
	}, [intelEnabled, user]);

	const resetTrackTracePage = () => {
		if (trackTraceData && trackTraceData?.value !== "") {
			trackTraceData?.setValue("");
			trackTraceData?.resetData();
			trackTraceData?.setIsSubmitted(false);
		}
	};

	const lastMilePath = user?.type === "GoverningBody" ? "/lastMile-Centeral" : "/lastMile-Track";
	let networkPath;
	switch (user?.type) {
		case "GoverningBody":
			networkPath = "/admin-network-reports";
			break;
		case "DISTRIBUTORS":
		case "DROGUERIA":
			networkPath = "/network";
			break;
		default:
			networkPath = null;
			break;
	}

	return (
		<div className="sidebar">
			<ul>
				{isAuthenticated("overview") && enable && (
					<li className={url === "/overview" ? "active" : "inactive"}>
						<Link to="/overview" className="nav-look-link">
							<img src={HomeIcon} alt="Overview" />
							<span>{t("overview")}</span>
						</Link>
					</li>
				)}
				{(isAuthenticated("viewInboundOrders") || isAuthenticated("viewOutboundOrders")) && enable && (
					<li className={url === "/orders" || url === "/neworder" ? "active" : ""}>
						<Link to="/orders" className="d-inline-block">
							<img
								src={OrderSelectedIcon}
								alt="Orders"
							/>
							<span className="ml-2">{t("orders")}</span>
						</Link>
					</li>
				)}
				{isAuthenticated("viewInventory") && enable && (
					<li
						className={
							url === "/inventory" ||
								url === "/newinventory" ||
								url === "/productcategory" ||
								url === "/batchexpired" ||
								url === "/batchnearexpiry/product" ||
								url === "/productoutofstock" ||
								url === "/addproduct" ||
								url === "/productlist/all"
								? "active"
								: ""
						}
					>
						<Link to="/inventory" className="d-inline-block">
							<img
								src={InventoryIcon}
								alt="Inventory"
							/>
							<span className="ml-2">{t("inventory")}</span>
						</Link>
					</li>
				)}
				{(isAuthenticated("inboundShipments") || isAuthenticated("outboundShipments")) && enable && (
					<li
						className={
							url === "/shipments" || url === "/newshipment" || url === "/transactionHistory"
								? "active"
								: ""
						}
					>
						<Link to="/shipments" className="d-inline-block">
							<img
								src={shipIcon}
								alt="Shippment"
							/>
							<span className="ml-2">{t("shipments")}</span>
						</Link>
					</li>
				)}

				{isAuthenticated("overview") && enable && networkPath && (
					<li className={url === networkPath ? "active" : ""}>
						<Link to={networkPath} className="d-inline-block">
							<img src={NetworkIcon} alt="network" />
							<span className="ml-2">{t("network")}</span>
						</Link>
					</li>
				)}
				{isAuthenticated("trackAndTrace") && enable && (
					<li className={url === "/track" ? "active" : ""}>
						<Link
							to="/track"
							className="nav-look-link d-inline-block"
							onClick={resetTrackTracePage}
						>
							<img src={url === "/track" ? trackSelectedIcon : NetworkIcon} alt="Track &amp; Trace" />
							<span>{t("trackntrace")}</span>
						</Link>
					</li>
				)}
				{enable && (
					<li className={url === "/lastMile-Track" ? "active" : ""}>
						<Link to={lastMilePath} className="d-inline-block">
							<img src={lastMileIcon} alt="lastMile" />

							<span className="ml-2">{t("lastmile")}</span>
						</Link>
					</li>
				)}
			</ul>
			<Footer t={t} />
		</div>
	);
};

export default SideBar;
