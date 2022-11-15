import React from "react";
import Avatar from "@mui/material/Avatar";
import "./AnalyticsCard.css";
import { useHistory } from "react-router";

export default function AnalyticsCard({
	layout,
	bgColor,
	icon,
	value,
	textColor,
	valueTitle,
  name,
  analytics
}) {
	const history = useHistory();

	const handleClick = () => {
		let route;
		switch (name) {
			case "users": {
				route = "/org/manage-users";
				break;
			}
			case "orgs": {
				route = "/statwig/manage-organization";
			}
		}

		history.push(route);
	};

	return (
		<>
			{layout === "type1" && (
				<div className="Analyticstype1-container">
					<div className="type1-header">
						<h1 className="vl-subheading f-700 vl-black">No. of Organization</h1>
					</div>
					<div className="type1-body">
						<div className="analytic-icon-space">
							<div className="analytic-icon icon-position-1">
								<Avatar className="color-variant-1">R</Avatar>
							</div>
							<div className="analytic-icon icon-position-2">
								<Avatar className="color-variant-2">T</Avatar>
							</div>
							<div className="analytic-icon icon-position-3">
								<Avatar className="color-variant-3">B</Avatar>
							</div>
							<div className="analytic-icon icon-position-4">
								<Avatar className="color-variant-4">L</Avatar>
							</div>
							<div className="analytic-icon icon-position-5 ">
								<Avatar className="color-variant-5 icon-total-number">+200</Avatar>
							</div>
						</div>
						<p className="vl-note f-400 vl-blue vl-link" onClick={handleClick}>
							View Organization
						</p>
					</div>
				</div>
			)}
			{layout === "type2" && (
				<div className="Analyticstype1-container">
					<div className="type1-header">
						<h1 className="vl-subheading f-700 vl-black">No. of Users</h1>
					</div>
					<div className="type1-body">
						<div className="analytic-icon-space">
							{analytics?.userInitials?.map((initial, index) => (
								<div key={index} className={`analytic-icon icon-position-${index+1}`}>
									<Avatar className={`color-variant-${index+1}`}>{initial?.charAt(0).toUpperCase()}</Avatar>
								</div>
							))}
							<div className="analytic-icon icon-position-5 ">
								<Avatar className="color-variant-5 icon-total-number">{analytics?.totalCount}</Avatar>
							</div>
						</div>
						<p className="vl-note f-400 vl-blue vl-link" onClick={handleClick}>
							View Users
						</p>
					</div>
				</div>
			)}

			{layout === "type3" && (
				<div className="Analyticstype3-container">
					<div className="type3-header">
						<div className={`type3-icon-space ${bgColor}`}>
							<i className={`fa-solid ${icon} ${textColor}`}></i>
						</div>
						<p className="vl-small f-400 vl-grey-xs vl-link">6 months</p>
					</div>
					<div className="type3-body">
						<div className="type3-values">
							<h1 className={`vl-heading f-700 ${textColor}`}>{value}</h1>
							<p className={`vl-body f-500 ${textColor}`}>{valueTitle}</p>
						</div>
					</div>
				</div>
			)}

			{layout === "type4" && (
				<div className="Analyticstype3-container">
					<div className="type4-body vl-flex-xl">
						<div className={`type3-icon-space ${bgColor}`}>
							<i className={`fa-solid ${icon} ${textColor}`}></i>
						</div>
						<div className="type3-values">
							<h1 className={`vl-heading f-700 ${textColor}`}>{value}</h1>
							<p className={`vl-body f-500 ${textColor}`}>{valueTitle}</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}