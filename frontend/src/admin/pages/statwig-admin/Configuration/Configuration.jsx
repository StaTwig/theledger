import { Autocomplete, Dialog, DialogContent, MenuItem, Select, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import Modal from "../../../../shared/modal";
import {
	getAllPermissions,
	getAllRoles,
	getPermissionByRoleAndOrg,
	getPermissions,
	updatePermissionsByRole,
} from "../../../actions/organisationActions";
import AddRole from "../../../components/AddRole/AddRole";
import AssignRole from "../../../components/AssignRole/AssignRole";
import StatwigHeader from "../../../shared/Header/StatwigHeader/StatwigHeader";
import SuccessPopup from "../../../shared/Popup/SuccessPopup";
import "./Configuration.css";
import Permission from "./Permission/Permission";
import { createFilterOptions } from "@material-ui/lab";
import { turnOff, turnOn } from "../../../../actions/spinnerActions";
import { useTranslation } from "react-i18next";
import { useRef } from "react";

const filter = createFilterOptions();

export default function Configuration(props) {
	const history = useHistory();
  const { t } = useTranslation();
	if (props.user.type !== "CENTRAL_AUTHORITY") {
		history.push("/overview");
	}

	const [roles, setRoles] = useState([]);
	const [selectedRole, setSelectedRole] = useState("admin");
	const [permissions, setPermissions] = useState({});
	const [updatedPermissions, setUpdatedPermissions] = useState(null);
	const [openSuccessPopup, setOpenSuccessPopup] = useState(false);
	const [existingRole, setExistingRole] = useState(true);

	const roleRef = useRef(null);

	async function getUserRoles() {
		const roles = await getAllRoles();
		setRoles(roles);
	}

	useEffect(() => {
		getUserRoles();
	}, []);

	const uniq = [...new Set(roles)];

	const dispatch = useDispatch();

	async function getRolePermissions(flag) {
    dispatch(turnOn());
		let permissions;
		if (flag) {
			permissions = await getAllPermissions();
		} else {
			permissions = await getPermissionByRoleAndOrg(selectedRole, props.user.organisationId);
		}
		setPermissions(permissions[0]);
		let updates = {
			admin: permissions[0]?.admin,
			inventory: permissions[0]?.inventory,
			iot: permissions[0]?.iot,
			network: permissions[0]?.network,
			order: permissions[0]?.order,
			overview: permissions[0]?.overview,
			search: permissions[0]?.search,
			shipment: permissions[0]?.shipment,
			track: permissions[0]?.track,
		};
    setUpdatedPermissions(updates);
    dispatch(turnOff());
	}

	useEffect(() => {
		if (roles) {
			const res = roles.find((role) => role === selectedRole);
			getRolePermissions(res ? false : true);
		}
	}, [roles, selectedRole]);

	async function permissionUpdate() {
		if (updatedPermissions) {
			const res = await updatePermissionsByRole({
				permissions: updatedPermissions,
				orgId: props.user.organisationId,
				role: selectedRole,
			});
			setOpenSuccessPopup(true);
		}
	}

	async function updatePermissions(permissionType, data) {
		let updates = updatedPermissions;
		updates[permissionType] = data;
		setUpdatedPermissions(updates);
	}

	const handleAddNewRole = () => {
		setSelectedRole("");
		setExistingRole(false);
		roleRef.current.focus();
	}

	const closeModal = () => {
		setOpenSuccessPopup(false);
		// props.history.push("/inventory");
	};
	return (
		<>
			<StatwigHeader />
			<section className="admin-page-layout">
				<div className="admin-container">
					<div className="admin-role-container admin-section-space">
						<div className="role-headers">
							<div className="role-page-link">
								<p className="vl-subheading f-700">{t("configuration")}</p>
								<p className="vl-body f-400 vl-grey-sm">{t("roles_permissions")}</p>
							</div>
							<div className="config-btn-group">
								{/* <button
                  className="vl-btn vl-btn-md vl-btn-secondary"
                  onClick={handleClickOpen2}
                >
                  Assign Role to User
                </button> */}
								<button className="vl-btn vl-btn-md vl-btn-primary" onClick={handleAddNewRole}>
									Add Roles
								</button>
							</div>
						</div>

						<div className="input-set">
							<p className="vl-body f-500 vl-black">
								{existingRole ? t("select_role") : "Add New Role"}
							</p>
							<div className="input-full-column-space">
								<Autocomplete
									fullWidth
									options={uniq}
									onChange={(event, value) => setSelectedRole(value)}
									value={selectedRole}
									freeSolo={true}
									filterOptions={(options, params) => {
										const filtered = filter(options, params);
										const { inputValue } = params;
										const isExisting = options.some((option) => inputValue === option);
										if (inputValue !== "" || !isExisting) {
											filtered.push(inputValue);
										}
										return filtered;
									}}
									renderInput={(params) => (
										<TextField inputRef={roleRef} {...params} label="Role" />
									)}
								/>
							</div>
						</div>

						<div className="permission-tab-ribbon">
							<div className="ribbon-tab active ">
								<p className="vl-body">{t("user_role")}</p>
							</div>
							{/* <div className="ribbon-tab">
                <p className="vl-body">{t("analytics")}</p>
              </div>
              <div className="ribbon-tab">
                <p className="vl-body">{t("payments")}</p>
              </div> */}
						</div>

						<Permission
							t={t}
							permissions={permissions}
							updatePermissions={updatePermissions}
							permissionUpdate={permissionUpdate}
							updatedPermissions={updatedPermissions}
						/>
					</div>
				</div>
			</section>
			{openSuccessPopup && (
				<Modal
					close={() => closeModal()}
					size="modal-sm" //for other size's use `modal-lg, modal-md, modal-sm`
				>
					<SuccessPopup
						onHide={closeModal}
						successMessage="Permissions updated successfully"
						// errorMessage="Put the Error Message Here"
					/>
				</Modal>
			)}
		</>
	);
}
